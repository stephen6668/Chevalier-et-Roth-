// Chevalier & Roth · Appwrite authentication
const CRAppwrite = (() => {
  const endpoint = 'https://fra.cloud.appwrite.io/v1';
  const projectId = '6ac779cc001f0d093856';
  let client = null;
  let account = null;

  function init(){
    if(!window.Appwrite) throw new Error('Appwrite SDK konnte nicht geladen werden.');
    if(account) return {client,account};
    client = new Appwrite.Client().setEndpoint(endpoint).setProject(projectId);
    account = new Appwrite.Account(client);
    return {client,account};
  }
  async function currentUser(){
    try { init(); return await account.get(); } catch(e){ return null; }
  }
  async function register({name,email,password}){
    init();
    await account.create({userId: Appwrite.ID.unique(), email, password, name});
    await account.createEmailPasswordSession({email,password});
    return account.get();
  }
  async function login({email,password}){
    init();
    await account.createEmailPasswordSession({email,password});
    return account.get();
  }
  async function logout(){
    init();
    try{ await account.deleteSession({sessionId:'current'}); }catch(e){}
  }
  async function getPrefs(){
    init();
    try{return await account.getPrefs()}catch(e){return {}}
  }
  async function updatePrefs(prefs){
    init();
    return account.updatePrefs({prefs});
  }
  async function addToWaitlist({productId,productName,name,email,size='',color=''}){
    const user=await currentUser();
    if(!user) throw new Error('Bitte zuerst einloggen oder registrieren.');
    const prefs=await getPrefs();
    const current=Array.isArray(prefs.waitlist)?prefs.waitlist:[];
    const key=[productId,size,color].join('|');
    const exists=current.some(x=>[x.productId,x.size||'',x.color||''].join('|')===key);
    const entry={productId,productName,name:name||user.name,email:email||user.email,size,color,createdAt:new Date().toISOString()};
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
  return {endpoint,projectId,init,currentUser,register,login,logout,getPrefs,updatePrefs,addToWaitlist,removeFromWaitlist};
})();
