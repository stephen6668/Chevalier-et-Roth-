// Chevalier & Roth · Giveaway -> Appwrite direct bridge
// This file intentionally overrides submitGiveawayEntry after app.js.
// It does not depend on CRCommerce, so an old cached commerce/app bundle cannot block giveaway saving.
window.submitGiveawayEntry = async function submitGiveawayEntry(){
  const msg=document.getElementById('giveawayMsg');
  const btn=document.getElementById('giveawaySubmitBtn');

  const target=new Date(window.CRSiteConfig?.launchAt || '2027-01-02T00:00:00+01:00').getTime();
  if(Date.now()>=target){
    if(msg)msg.textContent='Das Gewinnspiel ist bereits beendet.';
    return;
  }

  const designs=(typeof giveawayDesigns==='function'?giveawayDesigns():[]);
  const prize=designs.find(p=>p.id===window._giveawayPrizeId || p.id===globalThis._giveawayPrizeId);
  // _giveawayPrizeId is declared with let in app.js and is not a window property.
  // Access it directly when available.
  let selectedPrize=prize;
  try{
    if(typeof _giveawayPrizeId!=='undefined'){
      selectedPrize=designs.find(p=>p.id===_giveawayPrizeId);
    }
  }catch(e){}

  if(!selectedPrize){
    if(msg)msg.textContent='Bitte zuerst einen Gewinn auswählen.';
    return;
  }

  const tiktokOk=!!document.getElementById('giveawayTikTokFollow')?.checked;
  const instagramOk=!!document.getElementById('giveawayInstagramFollow')?.checked;
  const privacyOk=!!document.getElementById('giveawayConsent')?.checked;
  if(!tiktokOk || !instagramOk){
    if(msg)msg.textContent='Bitte bestätige zuerst, dass du uns auf TikTok und Instagram folgst.';
    return;
  }
  if(!privacyOk){
    if(msg)msg.textContent='Bitte die Teilnahme- und Datenschutzhinweise akzeptieren.';
    return;
  }

  const firstName=String(document.getElementById('giveawayFirstName')?.value||'').trim();
  const lastName=String(document.getElementById('giveawayLastName')?.value||'').trim();
  const email=String(document.getElementById('giveawayEmail')?.value||'').trim().toLowerCase();

  if(!firstName || !lastName){
    if(msg)msg.textContent='Bitte Vor- und Nachname eingeben.';
    return;
  }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    if(msg)msg.textContent='Bitte eine gültige E-Mail-Adresse eingeben.';
    return;
  }

  if(btn)btn.disabled=true;
  if(msg)msg.textContent='Teilnahme wird in Appwrite gespeichert…';

  try{
    if(!window.Appwrite || typeof Appwrite.Client!=='function' || typeof Appwrite.TablesDB!=='function'){
      throw new Error('Appwrite SDK konnte nicht geladen werden.');
    }

    const endpoint=window.CRSiteConfig?.appwriteEndpoint || 'https://fra.cloud.appwrite.io/v1';
    const projectId=window.CRSiteConfig?.appwriteProjectId || '6ac779cc001f0d093856';
    const databaseId=window.CRSiteConfig?.commerceDatabaseId || '6ac7d6740035408079f7';
    const tableId=window.CRSiteConfig?.giveawayTableId || 'cr_giveaway';

    const client=new Appwrite.Client().setEndpoint(endpoint).setProject(projectId);
    const tables=new Appwrite.TablesDB(client);

    const row=await Promise.race([
      tables.createRow({
        databaseId,
        tableId,
        rowId:Appwrite.ID.unique(),
        data:{
          firstName:firstName.slice(0,120),
          lastName:lastName.slice(0,120),
          email:email.slice(0,320),
          prizeId:String(selectedPrize.id||'').slice(0,255),
          prizeName:String(selectedPrize.name||'').slice(0,255),
          status:'entered',
          source:'website-giveaway-2027',
          privacyAccepted:true
        }
      }),
      new Promise((_,reject)=>setTimeout(()=>reject(new Error('Appwrite antwortet nicht. Bitte erneut versuchen.')),15000))
    ]);

    localStorage.setItem('cr_giveaway_entered','1');
    if(row?.$id)localStorage.setItem('cr_giveaway_entry_id',row.$id);

    if(msg)msg.textContent='Erfolgreich in Appwrite gespeichert. Du bist dabei – viel Glück!';
    ['giveawayFirstName','giveawayLastName','giveawayEmail','giveawayConsent','giveawayTikTokFollow','giveawayInstagramFollow']
      .forEach(id=>{const el=document.getElementById(id);if(el)el.disabled=true;});
    setTimeout(()=>{if(typeof closeGiveawayEntry==='function')closeGiveawayEntry();},1800);
  }catch(e){
    console.error('[Giveaway/Appwrite direct bridge]',e);
    const code=e?.code??e?.status;
    let message=e?.message||'Die Teilnahme konnte nicht gespeichert werden.';
    if(code===404)message='Appwrite findet die Tabelle cr_giveaway nicht.';
    else if(code===401||code===403)message='Appwrite blockiert das Speichern. In cr_giveaway muss Any die Berechtigung CREATE haben.';
    else if(code===400 && /column|attribute|schema/i.test(String(message)))message='Die Tabelle cr_giveaway hat nicht alle benötigten Spalten.';
    if(msg)msg.textContent=message;
  }finally{
    if(btn)btn.disabled=false;
  }
};
