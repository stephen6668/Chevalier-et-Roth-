
// Chevalier & Roth · Appwrite Auth + real waitlist (TablesDB)
const CRAppwrite = (() => {
  const endpoint = 'https://fra.cloud.appwrite.io/v1';
  const projectId = '6ac779cc001f0d093856';
  const databaseId = '6ac7d6740035408079f7';
  const waitlistTableId = '6ac7d6e1002f38269b6a';
  const adminTeamId = '6ac7d7fc0029522fc7bf';

  let client = null;
  let account = null;
  let tablesDB = null;
  let teams = null;

  function init(){
    if(!window.Appwrite) throw new Error('Appwrite SDK konnte nicht geladen werden.');
    if(account) return {client,account,tablesDB,teams};

    client = new Appwrite.Client()
      .setEndpoint(endpoint)
      .setProject(projectId);

    account = new Appwrite.Account(client);

    if(typeof Appwrite.TablesDB !== 'function'){
      throw new Error(
        'Die geladene Appwrite-Web-SDK-Version unterstützt TablesDB nicht. ' +
        'Bitte lade die Seite mit Strg+F5 neu. Erwartet wird Appwrite Web SDK 27.0.0.'
      );
    }

    tablesDB = new Appwrite.TablesDB(client);
    teams = new Appwrite.Teams(client);

    return {client,account,tablesDB,teams};
  }

  const normalizeEmail = value => String(value || '').trim().toLowerCase();

  function validateEmail(email){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function withTimeout(promise, ms=15000, label='Appwrite request'){
    return Promise.race([
      promise,
      new Promise((_, reject)=>setTimeout(()=>{
        const e=new Error(label+' hat nach '+Math.round(ms/1000)+' Sekunden nicht geantwortet.');
        e.type='appwrite_timeout';
        reject(e);
      }, ms))
    ]);
  }

  function explainError(err, fallback='Unbekannter Fehler'){
    console.error('[Chevalier & Roth / Appwrite]', err);
    const code = err && (err.code ?? err.status);
    const type = err && err.type;
    const message = err && err.message ? err.message : fallback;
    let friendly = message;

    if(type === 'user_invalid_credentials') friendly = 'E-Mail oder Passwort ist falsch.';
    else if(type === 'user_already_exists') friendly = 'Für diese E-Mail existiert bereits ein Konto.';
    else if(type === 'user_session_already_exists') friendly = 'Es ist bereits ein Appwrite-Konto in diesem Browser eingeloggt. Der Admin-Login wechselt jetzt automatisch auf das Admin-Konto.';
    else if(type === 'appwrite_timeout') friendly = 'Appwrite antwortet nicht. Prüfe deine Web Platform und Internetverbindung.';
    else if(type === 'row_unauthorized' || type === 'team_unauthorized' || code === 403) friendly = 'Keine Berechtigung. Prüfe Admin-Team und Waitlist-Permissions in Appwrite.';
    else if(code === 401) friendly = 'Die Appwrite-Sitzung ist nicht gültig oder nicht mehr aktiv. Bitte erneut einloggen.';
    else if(message.toLowerCase().includes('column')) friendly = 'Die Waitlist-Tabelle hat noch nicht alle benötigten Spalten.';
    else if(message.toLowerCase().includes('failed to fetch')) friendly = 'Verbindung zu Appwrite fehlgeschlagen. Prüfe die Web Platform in Appwrite.';

    const details = [type ? `Typ: ${type}` : '', code ? `Code: ${code}` : '', message ? `Appwrite: ${message}` : ''].filter(Boolean).join(' · ');
    return {friendly, details};
  }


  async function diagnose(){
    const result={
      hostname: location.hostname || '(local file)',
      endpoint,
      projectId,
      sdkLoaded: !!window.Appwrite,
      tablesDbAvailable: !!(window.Appwrite && typeof Appwrite.TablesDB === 'function')
    };
    try{
      init();
      const response=await withTimeout(fetch(endpoint+'/health/version',{
        method:'GET',
        headers:{'X-Appwrite-Project':projectId}
      }),8000,'Verbindungstest');
      result.reachable=response.ok;
      result.httpStatus=response.status;
      result.tablesDbAvailable=!!(window.Appwrite && typeof Appwrite.TablesDB === 'function');
    }catch(e){
      result.reachable=false;
      result.error=e.message||String(e);
    }
    return result;
  }

  async function currentUser(){
    init();
    try{return await withTimeout(account.get(),10000,'Account laden')}catch(e){return null}
  }

  async function register({name,email,password}){
    init();
    const safeName=String(name||'').trim();
    const safeEmail=normalizeEmail(email);
    const safePassword=String(password||'');

    if(!safeName) throw new Error('Bitte deinen Namen eingeben.');
    if(!safeEmail || !validateEmail(safeEmail)) throw new Error('Bitte eine gültige E-Mail-Adresse eingeben.');
    if(safePassword.length < 8) throw new Error('Das Passwort muss mindestens 8 Zeichen lang sein.');

    await withTimeout(account.create(
      Appwrite.ID.unique(),
      safeEmail,
      safePassword,
      safeName
    ),15000,'Konto erstellen');

    await withTimeout(account.createEmailPasswordSession(
      safeEmail,
      safePassword
    ),15000,'Automatischer Login');

    return currentUser();
  }

  async function login({email,password}){
    init();
    const safeEmail=normalizeEmail(email);
    const safePassword=String(password||'');
    if(!safeEmail || !validateEmail(safeEmail)) throw new Error('Bitte eine gültige E-Mail-Adresse eingeben.');
    if(!safePassword) throw new Error('Bitte dein Passwort eingeben.');

    await withTimeout(account.createEmailPasswordSession(
      safeEmail,
      safePassword
    ),15000,'Login');

    return currentUser();
  }

  async function logout(){
    init();
    try{await withTimeout(account.deleteSession('current'),10000,'Logout')}catch(e){console.warn(e)}
  }

  async function getPrefs(){
    init();
    try{return await withTimeout(account.getPrefs(),10000,'Preferences laden')}catch(e){return {}}
  }

  async function updatePrefs(prefs){
    init();
    return withTimeout(account.updatePrefs(prefs),10000,'Preferences speichern');
  }

  async function isAdmin(){
    init();
    const user=await currentUser();
    if(!user) return false;
    try{
      await withTimeout(teams.get(adminTeamId),10000,'Admin-Team prüfen');
      return true;
    }catch(e){
      return false;
    }
  }

  async function addToWaitlist({productId,productName,name,email,size='',color=''}){
    init();

    // PUBLIC WAITLIST:
    // No Appwrite login is required. Every valid submission creates a central row.
    const user=await currentUser(); // optional: used only for convenience when a customer is logged in

    const safeName=String(name||user?.name||'').trim();
    const safeEmail=normalizeEmail(email||user?.email||'');
    const safeProductId=String(productId||'unknown-product').trim();
    const safeProductName=String(productName||'Product').trim();
    const safeSize=String(size||'').trim() || 'Not selected';
    const safeColor=String(color||'').trim() || 'Not selected';

    if(!safeName) throw new Error('Bitte einen Namen eingeben.');
    if(!validateEmail(safeEmail)) throw new Error('Bitte eine gültige E-Mail-Adresse eingeben.');

    // Do NOT deduplicate here. Every successful form submission is a real waitlist signup.
    // This makes the admin list reflect every request that Appwrite accepted.
    const data={
      userId:user?.$id || 'guest',
      name:safeName,
      email:safeEmail,
      productId:safeProductId,
      productName:safeProductName,
      size:safeSize,
      color:safeColor,
      status:'waiting'
    };

    const args={
      databaseId,
      tableId:waitlistTableId,
      rowId:Appwrite.ID.unique(),
      data
    };

    // Logged-in customers may get their own row-level read/delete permissions.
    // Guests get no row-level permissions; the admin team's TABLE-level READ/UPDATE/DELETE
    // permissions are enough for the protected admin area.
    if(user){
      args.permissions=[
        Appwrite.Permission.read(Appwrite.Role.user(user.$id)),
        Appwrite.Permission.delete(Appwrite.Role.user(user.$id))
      ];
    }

    const row=await withTimeout(
      tablesDB.createRow(args),
      15000,
      'Warteliste speichern'
    );

    const entry={
      rowId:row.$id,
      productId:safeProductId,
      productName:safeProductName,
      name:safeName,
      email:safeEmail,
      size:safeSize,
      color:safeColor,
      status:'waiting',
      createdAt:row.$createdAt
    };

    // If a customer happens to be logged in, also mirror the signup into account preferences
    // for their personal account page. This step is optional and can never cancel the central row.
    if(user){
      try{
        const prefs=await getPrefs();
        const current=Array.isArray(prefs.waitlist)?prefs.waitlist:[];
        await updatePrefs({...prefs,waitlist:[...current,entry]});
      }catch(e){
        console.warn('Central waitlist row was saved, but account preferences could not be updated.',e);
      }
    }

    return entry;
  }

  async function removeFromWaitlist(productId,size='',color=''){
    init();
    const user=await currentUser();
    if(!user) throw new Error('Bitte zuerst einloggen.');

    const prefs=await getPrefs();
    const current=Array.isArray(prefs.waitlist)?prefs.waitlist:[];
    const target=current.find(x=>x.productId===productId&&(x.size||'')===size&&(x.color||'')===color);

    if(target?.rowId){
      await withTimeout(tablesDB.deleteRow({
        databaseId,
        tableId:waitlistTableId,
        rowId:target.rowId
      }),15000,'Wartelisteneintrag löschen');
    }

    const waitlist=current.filter(x=>!(x.productId===productId&&(x.size||'')===size&&(x.color||'')===color));
    await updatePrefs({...prefs,waitlist});
    return waitlist;
  }

  async function listAdminWaitlist(){
    init();
    if(!await isAdmin()) throw new Error('Du bist kein Mitglied des Appwrite-Admin-Teams.');

    const allRows=[];
    const pageSize=100;
    let offset=0;

    while(true){
      const result=await withTimeout(tablesDB.listRows({
        databaseId,
        tableId:waitlistTableId,
        queries:[
          Appwrite.Query.orderDesc('$createdAt'),
          Appwrite.Query.limit(pageSize),
          Appwrite.Query.offset(offset)
        ]
      }),15000,'Warteliste laden');

      const rows=result.rows || [];
      allRows.push(...rows);

      if(rows.length < pageSize) break;
      if(result.total && allRows.length >= result.total) break;

      offset += rows.length;
    }

    return allRows;
  }

  async function updateWaitlistStatus(rowId,status){
    init();
    if(!await isAdmin()) throw new Error('Keine Admin-Berechtigung.');
    return withTimeout(tablesDB.updateRow({
      databaseId,
      tableId:waitlistTableId,
      rowId,
      data:{status:String(status||'waiting')}
    }),15000,'Status aktualisieren');
  }

  async function deleteAdminWaitlistRow(rowId){
    init();
    if(!await isAdmin()) throw new Error('Keine Admin-Berechtigung.');
    return withTimeout(tablesDB.deleteRow({
      databaseId,
      tableId:waitlistTableId,
      rowId
    }),15000,'Wartelisteneintrag löschen');
  }


  const demoPrefix='cr-internal-sample-202610-';
  function isSampleRow(row){return String(row?.productId||'').startsWith(demoPrefix);}
  async function insertAdminSampleRows(rows,onProgress){
    init();
    if(!await isAdmin()) throw new Error('Admin-Berechtigung erforderlich.');
    const existing=await listAdminWaitlist();
    const ids=new Set(existing.filter(isSampleRow).map(x=>x.productId));
    let created=0,skipped=0,failed=0;
    for(let i=0;i<rows.length;i++){
      const r=rows[i],productId=demoPrefix+String(i+1).padStart(3,'0');
      if(ids.has(productId)){skipped++;continue;}
      try{
        await withTimeout(tablesDB.createRow({
          databaseId,tableId:waitlistTableId,rowId:Appwrite.ID.unique(),
          data:{userId:'internal_sample',name:r.name,email:r.email,productId,productName:r.productName,size:r.size||'Not selected',color:r.color||'Not selected',status:'waiting'}
        }),15000,'Beispiele speichern');
        created++;ids.add(productId);
      }catch(err){failed++;console.error('Sample import row '+(i+1),err);}
      if(onProgress)onProgress({created,skipped,failed,processed:i+1,total:rows.length});
    }
    return {created,skipped,failed};
  }
  async function deleteAdminSampleRows(onProgress){
    init();
    if(!await isAdmin())throw new Error('Admin-Berechtigung erforderlich.');
    const samples=(await listAdminWaitlist()).filter(isSampleRow);
    let deleted=0,failed=0;
    for(const row of samples){
      try{await deleteAdminWaitlistRow(row.$id);deleted++;}catch(err){failed++;console.error('Sample delete',err);}
      if(onProgress)onProgress({deleted,failed,total:samples.length});
    }
    return {deleted,failed};
  }

  return {
    isSampleRow,insertAdminSampleRows,deleteAdminSampleRows,
    endpoint,projectId,databaseId,waitlistTableId,adminTeamId,
    init,diagnose,currentUser,register,login,logout,getPrefs,updatePrefs,
    isAdmin,addToWaitlist,removeFromWaitlist,
    listAdminWaitlist,updateWaitlistStatus,deleteAdminWaitlistRow,
    explainError
  };
})();
