// Chevalier & Roth · Appwrite authentication
const CRAppwrite = (() => {
  const endpoint = 'https://fra.cloud.appwrite.io/v1';
  const projectId = '6ac779cc001f0d093856';
  let client = null;
  let account = null;

  function init(){
    if(!window.Appwrite) throw new Error('Appwrite SDK konnte nicht geladen werden. Prüfe deine Internetverbindung.');
    if(account) return {client,account};
    client = new Appwrite.Client()
      .setEndpoint(endpoint)
      .setProject(projectId);
    account = new Appwrite.Account(client);
    return {client,account};
  }

  function normalizeEmail(value){
    return String(value || '').trim().toLowerCase();
  }

  function validateEmail(email){
    return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
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

  async function diagnose(){
    const result={
      hostname: location.hostname || '(local file)',
      protocol: location.protocol,
      endpoint,
      projectId,
      sdkLoaded: !!window.Appwrite
    };
    try{
      const response=await withTimeout(fetch(endpoint+'/account',{
        method:'GET',
        headers:{'X-Appwrite-Project':projectId},
        credentials:'include'
      }),8000,'Verbindungstest');
      result.httpStatus=response.status;
      result.reachable=true;
    }catch(e){
      result.reachable=false;
      result.error=e.message || String(e);
    }
    return result;
  }

  function explainError(err, fallback='Unbekannter Fehler'){
    console.error('[Chevalier & Roth / Appwrite]', err);
    const code = err && (err.code ?? err.status);
    const type = err && err.type;
    const message = err && err.message ? err.message : fallback;
    let friendly = message;

    if(message.includes('Missing required parameter')) {
      friendly = 'Ein Pflichtfeld wurde nicht an Appwrite übergeben. Bitte prüfe E-Mail und Passwort.';
    } else if(type === 'user_invalid_credentials') {
      friendly = 'E-Mail oder Passwort ist falsch.';
    } else if(type === 'user_already_exists') {
      friendly = 'Für diese E-Mail existiert bereits ein Konto.';
    } else if(type === 'password_recently_used') {
      friendly = 'Bitte verwende ein anderes Passwort.';
    } else if(type === 'general_argument_invalid') {
      friendly = 'Mindestens eine Eingabe ist ungültig. Bitte prüfe E-Mail, Passwort und Name.';
    } else if(type === 'appwrite_timeout') {
      friendly = 'Appwrite antwortet nicht. Meist ist die GitHub-Pages-Domain in Appwrite noch nicht korrekt als Web Platform eingetragen oder die Verbindung wird blockiert.';
    } else if(message.toLowerCase().includes('failed to fetch') || message.toLowerCase().includes('networkerror')) {
      friendly = 'Die Verbindung zu Appwrite wurde vom Browser blockiert. Prüfe die Web Platform / Domain in Appwrite.';
    } else if(message.toLowerCase().includes('cors') || message.toLowerCase().includes('hostname')) {
      friendly = 'Appwrite blockiert die Domain. Füge deine GitHub-Pages-Domain als Web Platform in Appwrite hinzu.';
    }

    const details = [type ? `Typ: ${type}` : '', code ? `Code: ${code}` : '', message ? `Appwrite: ${message}` : ''].filter(Boolean).join(' · ');
    return {friendly, details};
  }

  async function currentUser(){
    try { init(); return await withTimeout(account.get(),10000,'Account-Status'); } catch(e){ return null; }
  }

  async function register({name,email,password}){
    init();
    const safeName = String(name || '').trim();
    const safeEmail = normalizeEmail(email);
    const safePassword = String(password || '');

    if(!safeName) throw new Error('Bitte deinen Namen eingeben.');
    if(!safeEmail) throw new Error('Bitte deine E-Mail-Adresse eingeben.');
    if(!validateEmail(safeEmail)) throw new Error('Bitte eine gültige E-Mail-Adresse eingeben.');
    if(!safePassword) throw new Error('Bitte ein Passwort eingeben.');
    if(safePassword.length < 8) throw new Error('Das Passwort muss mindestens 8 Zeichen lang sein.');

    await withTimeout(account.create({
      userId: Appwrite.ID.unique(),
      email: safeEmail,
      password: safePassword,
      name: safeName
    }),15000,'Konto-Erstellung');

    await withTimeout(account.createEmailPasswordSession({
      email: safeEmail,
      password: safePassword
    }),15000,'Automatischer Login');

    return withTimeout(account.get(),10000,'Account laden');
  }

  async function login({email,password}){
    init();
    const safeEmail = normalizeEmail(email);
    const safePassword = String(password || '');

    if(!safeEmail) throw new Error('Bitte deine E-Mail-Adresse eingeben.');
    if(!validateEmail(safeEmail)) throw new Error('Bitte eine gültige E-Mail-Adresse eingeben.');
    if(!safePassword) throw new Error('Bitte dein Passwort eingeben.');

    await withTimeout(account.createEmailPasswordSession({
      email: safeEmail,
      password: safePassword
    }),15000,'Login');
    return withTimeout(account.get(),10000,'Account laden');
  }

  async function logout(){
    init();
    try{ await withTimeout(account.deleteSession({sessionId:'current'}),10000,'Logout'); }catch(e){ console.warn(e); }
  }

  async function getPrefs(){
    init();
    try{return await withTimeout(account.getPrefs(),10000,'Preferences laden')}catch(e){return {}}
  }

  async function updatePrefs(prefs){
    init();
    return withTimeout(account.updatePrefs({prefs}),10000,'Preferences speichern');
  }

  async function addToWaitlist({productId,productName,name,email,size='',color=''}){
    const user=await currentUser();
    if(!user) throw new Error('Bitte zuerst einloggen oder registrieren.');
    const prefs=await getPrefs();
    const current=Array.isArray(prefs.waitlist)?prefs.waitlist:[];
    const key=[productId,size,color].join('|');
    const exists=current.some(x=>[x.productId,x.size||'',x.color||''].join('|')===key);
    const entry={
      productId,
      productName,
      name:String(name||user.name||'').trim(),
      email:normalizeEmail(email||user.email),
      size,
      color,
      createdAt:new Date().toISOString()
    };
    const waitlist=exists?current.map(x=>[x.productId,x.size||'',x.color||''].join('|')===key?entry:x):[...current,entry];
    await updatePrefs({...prefs,waitlist});
    return waitlist;
  }

  async function removeFromWaitlist(productId,size='',color=''){
    const prefs=await getPrefs();
    const waitlist=(Array.isArray(prefs.waitlist)?prefs.waitlist:[]).filter(x=>!(x.productId===productId&&(x.size||'')===size&&(x.color||'')===color));
    await updatePrefs({...prefs,waitlist});
    return waitlist;
  }

  return {endpoint,projectId,init,currentUser,register,login,logout,getPrefs,updatePrefs,addToWaitlist,removeFromWaitlist,explainError,diagnose};
})();
