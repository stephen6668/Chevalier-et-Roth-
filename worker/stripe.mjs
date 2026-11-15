// Stripe Checkout. Secrets are supplied by the hosting runtime only.
// Live mode is gated until hosting, shipping and fulfillment are ready.
const PRODUCTS = Object.freeze({
 body: {name: 'Le Body', backendId: 'p3'},
 halfzip: {name: 'Le Half-Zip', backendId: 'p1'},
 trousers: {name: 'Le Pantalon Femme', backendId: 'p2'},
 'trousers-men': {name: 'Le Pantalon Homme', backendId: 'p4'}
});
const COLORS = Object.freeze({beige: 'Beige', navy: 'Navyblau', bordeaux: 'Bordeaux'});
const SIZES = new Set(['S', 'M', 'L']);
const DEFAULT_SHIPPING_COUNTRIES = Object.freeze(['LU', 'BE', 'FR', 'DE']);
const MAX_BODY_BYTES = 16384;
const MAX_UNIT_AMOUNT = 1000000;
const MAX_SHIPPING_AMOUNT = 100000;
const MAX_TOTAL_AMOUNT = 10000000;
const SOURCE = 'chevalier-et-roth';
const SESSION_ID = /^cs_(?:test|live)_[a-zA-Z0-9_]{8,200}$/;
const STRIPE_API_VERSION = '2026-10-28.endive';
const APPWRITE_ORIGIN = 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_DEFAULTS = {project:'6ac779cc001f0d093856',database:'6ac7d6740035408079f7',table:'6aca7cf00026558bc07f'};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class CheckoutError extends Error {
 constructor(status, code, message) {super(message); this.status = status; this.code = code;}
}

function json(value, status = 200, extraHeaders = {}) {
 return new Response(JSON.stringify(value), {status, headers: {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  ...extraHeaders
 }});
}

function getMode(env) {return env?.STRIPE_CHECKOUT_MODE === undefined ? 'test' : ['test','live'].includes(env.STRIPE_CHECKOUT_MODE) ? env.STRIPE_CHECKOUT_MODE : 'unconfigured';}
function getKey(env) {
 const value=typeof env?.STRIPE_SECRET_KEY==='string'?env.STRIPE_SECRET_KEY.trim():'';
 const mode=/^(?:sk|rk)_(test|live)_[A-Za-z0-9]{4,300}$/.exec(value)?.[1]||null;
 return {present:Boolean(value),testMode:mode==='test',mode,value};
}
function requireModeKey(env) {
 const key=getKey(env),mode=getMode(env);
 if(!key.mode||key.mode!==mode)throw new CheckoutError(503,'checkout_unconfigured','Die Zahlungsanbindung ist noch nicht freigeschaltet.');
 return {key:key.value,mode};
}
function storageConfig(env) {
 const id=value=>typeof value==='string'&&/^[A-Za-z0-9][A-Za-z0-9._-]{0,35}$/.test(value);
 const config={endpoint:env.APPWRITE_ENDPOINT||APPWRITE_ORIGIN,project:env.APPWRITE_PROJECT_ID||APPWRITE_DEFAULTS.project,database:env.APPWRITE_DATABASE_ID||APPWRITE_DEFAULTS.database,table:env.APPWRITE_ORDERS_TABLE_ID||APPWRITE_DEFAULTS.table,key:typeof env.APPWRITE_SERVER_KEY==='string'?env.APPWRITE_SERVER_KEY.trim():''};
 config.ready=config.endpoint===APPWRITE_ORIGIN&&[config.project,config.database,config.table].every(id)&&/^[A-Za-z0-9._-]{8,512}$/.test(config.key)&&env.STRIPE_FULFILLMENT_CONFIRMED==='true';
 return config;
}
function checkoutConfiguration(env,catalog) {
 const mode=getMode(env),key=getKey(env),webhookConfigured=/^whsec_[A-Za-z0-9]{8,300}$/.test(env.STRIPE_WEBHOOK_SECRET||''),orderStorageConfigured=storageConfig(env).ready,backendPublic=env.STRIPE_PUBLIC_BACKEND==='true';
 const blockedReasons=[];
 if(mode==='unconfigured')blockedReasons.push('mode_unconfigured');
 if(key.mode!==mode)blockedReasons.push('mode_matching_key_missing');
 if(!catalog.configured)blockedReasons.push('prices_unconfigured');
 if(mode==='live'){
  if(!/^acct_[A-Za-z0-9]{8,100}$/.test(env.STRIPE_EXPECTED_ACCOUNT||''))blockedReasons.push('merchant_account_unconfigured');
  if(!catalog.shippingConfirmed||!catalog.shippingCountriesConfigured)blockedReasons.push('shipping_unconfirmed');
  if(!webhookConfigured)blockedReasons.push('webhook_unconfigured');
  if(!orderStorageConfigured)blockedReasons.push('order_storage_unconfigured');
  if(!backendPublic)blockedReasons.push('backend_private');
 }
 return {mode,configured:key.mode===mode,testMode:mode==='test'&&key.mode==='test',shippingConfirmed:catalog.shippingConfirmed,webhookConfigured,orderStorageConfigured,backendPublic,blockedReasons};
}
async function verifyMerchant(env,key) {
 const account=await stripeFetch(key,'/account');
 if(account.id!==env.STRIPE_EXPECTED_ACCOUNT||account.charges_enabled!==true)throw new CheckoutError(503,'merchant_unavailable','Das Händlerkonto ist für diesen Checkout noch nicht bestätigt.');
}
function storefrontURL(env,url) {
 if(!env.STRIPE_STOREFRONT_URL)return new URL('/',url);
 let target;try{target=new URL(env.STRIPE_STOREFRONT_URL);}catch{return null;}
 const github=target.origin==='https://stephen6668.github.io'&&target.pathname==='/Chevalier-et-Roth-/';
 const same=target.origin===url.origin&&target.pathname==='/';
 return (github||same)&&!target.username&&!target.password&&!target.search&&!target.hash?target:null;
}
function integerAmount(value, maximum, allowZero = false) {
 return Number.isSafeInteger(value) && value >= (allowZero ? 0 : 1) && value <= maximum;
}

// Public price data is safe to return to the browser. Only this server-owned
// catalog is used for Stripe amounts; client-supplied prices are ignored.
function getCatalog(env) {
 let raw;
 try {raw = JSON.parse(env?.STRIPE_PRICE_CATALOG || '');} catch {raw = null;}
 const validBase = raw && typeof raw === 'object' && !Array.isArray(raw) && String(raw.currency || '').toLowerCase() === 'eur';
 const prices = {};
 for (const id of Object.keys(PRODUCTS)) {
  const item = validBase && raw.products && typeof raw.products === 'object' ? raw.products[id] : null;
  if (item && typeof item === 'object' && integerAmount(item.amount, MAX_UNIT_AMOUNT)) {
   prices[id] = {amount: item.amount, available: item.available !== false};
  }
 }
 const shippingAmount = validBase && integerAmount(raw.shippingAmount, MAX_SHIPPING_AMOUNT, true) ? raw.shippingAmount : null;
 const inputCountries = validBase && raw.shippingCountries !== undefined ? raw.shippingCountries : DEFAULT_SHIPPING_COUNTRIES;
 const validCountries = Array.isArray(inputCountries) && inputCountries.length > 0 && inputCountries.length <= 64 && inputCountries.every(code => typeof code === 'string' && /^[A-Z]{2}$/.test(code));
 const shippingCountries = validCountries ? [...new Set(inputCountries)] : [];
 const missingProducts = Object.keys(PRODUCTS).filter(id => !prices[id]);
 return {currency:'eur',prices,shippingAmount,shippingCountries,missingProducts,shippingConfirmed:raw?.shippingConfirmed===true,shippingCountriesConfigured:validBase&&raw.shippingCountries!==undefined&&validCountries,taxRegistered:raw?.taxRegistered===true,taxPresentation:'illustrative',illustrativeTaxRate:17,taxCollected:false,
  configured: Boolean(validBase && shippingAmount !== null && shippingCountries.length && Object.values(prices).some(item => item.available))};
}

async function readJson(request) {
 if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) {
  throw new CheckoutError(415, 'unsupported_content_type', 'Bitte sende den Checkout als JSON.');
 }
 const declaredLength = request.headers.get('content-length');
 if (declaredLength !== null && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > MAX_BODY_BYTES)) {
  throw new CheckoutError(413, 'request_too_large', 'Die Checkout-Anfrage ist zu groß.');
 }
 if (!request.body) throw new CheckoutError(400, 'invalid_request', 'Die Checkout-Auswahl fehlt.');
 const reader = request.body.getReader(), decoder = new TextDecoder('utf-8', {fatal: true});
 let text = '', bytes = 0;
 try {
  while (true) {
   const {done, value} = await reader.read();
   if (done) break;
   bytes += value.byteLength;
   if (bytes > MAX_BODY_BYTES) {
    await reader.cancel();
    throw new CheckoutError(413, 'request_too_large', 'Die Checkout-Anfrage ist zu groß.');
   }
   text += decoder.decode(value, {stream: true});
  }
  text += decoder.decode();
 } catch (error) {
  if (error instanceof CheckoutError) throw error;
  throw new CheckoutError(400, 'invalid_request', 'Die Checkout-Anfrage konnte nicht gelesen werden.');
 } finally {reader.releaseLock();}
 let body;
 try {body = JSON.parse(text);} catch {throw new CheckoutError(400, 'invalid_json', 'Die Checkout-Anfrage ist ungültig.');}
 if (!body || typeof body !== 'object' || Array.isArray(body)) throw new CheckoutError(400, 'invalid_request', 'Die Checkout-Auswahl ist ungültig.');
 return body;
}

function normalizedItems(body) {
 if (typeof body.attemptId !== 'string' || !UUID.test(body.attemptId)) throw new CheckoutError(400, 'invalid_attempt', 'Bitte starte den Checkout erneut.');
 if (!Array.isArray(body.items) || !body.items.length || body.items.length > 60) throw new CheckoutError(400, 'invalid_items', 'Bitte wähle zwischen einem und 60 Produktvarianten.');
 const items = new Map();
 for (const item of body.items) {
  if (!item || typeof item !== 'object' || Array.isArray(item) || typeof item.product !== 'string' || typeof item.color !== 'string' || typeof item.size !== 'string' || !Object.hasOwn(PRODUCTS, item.product) || !Object.hasOwn(COLORS, item.color) || !SIZES.has(item.size) || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 20) {
   throw new CheckoutError(400, 'invalid_variant', 'Eine Produktvariante oder Stückzahl ist ungültig.');
  }
  const id = item.product + '/' + item.color + '/' + item.size;
  const previous = items.get(id);
  const qty = (previous?.qty || 0) + item.qty;
  if (qty > 20) throw new CheckoutError(400, 'invalid_quantity', 'Pro Produktvariante sind höchstens 20 Stück möglich.');
  items.set(id, {product: item.product, color: item.color, size: item.size, qty});
 }
 return [...items.values()].sort((a, b) => (a.product + '/' + a.color + '/' + a.size).localeCompare(b.product + '/' + b.color + '/' + b.size));
}

async function digest(value) {
 const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
 return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function stripeFetch(key, path, options = {}) {
 const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 15000);
 try {
  const response = await fetch('https://api.stripe.com/v1' + path, {
   method:options.method||'GET',signal:controller.signal,redirect:'error',
   headers: {'authorization': 'Bearer ' + key, 'stripe-version': STRIPE_API_VERSION, ...options.headers},
   ...(options.body ? {body: options.body} : {})
  });
  let value;
  try {value = await response.json();} catch {throw new CheckoutError(502, 'stripe_unavailable', 'Stripe konnte die Anfrage gerade nicht bestätigen. Bitte versuche es erneut.');}
  if (!response.ok) {
   if (response.status === 404) throw new CheckoutError(404, 'session_not_found', 'Diese Zahlung wurde nicht gefunden.');
   if (response.status === 429) throw new CheckoutError(429, 'stripe_rate_limited', 'Zu viele Checkout-Versuche. Bitte warte einen Moment.');
   const error = response.status === 401 || response.status === 403 ? new CheckoutError(503, 'stripe_unconfigured', 'Die Stripe-Verbindung ist noch nicht einsatzbereit.') : new CheckoutError(502, 'stripe_unavailable', 'Stripe konnte die Anfrage gerade nicht bestätigen. Bitte versuche es erneut.');
   error.upstreamStatus=response.status;error.stripeCode=typeof value?.error?.code==='string'?value.error.code:'';throw error;
  }
  return value;
 } catch (error) {
  if (error instanceof CheckoutError) throw error;
  throw new CheckoutError(503, 'stripe_unavailable', 'Stripe ist gerade nicht erreichbar. Bitte versuche es erneut.');
 } finally {clearTimeout(timeout);}
}


// Stripe is authoritative for discounts. Browser flags and Appwrite code rows
// cannot activate a promotion or decide a final Checkout discount.
const DISCOUNT_KIND='discount-code';
const PROMOTION_ID=/^promo_[A-Za-z0-9_]{1,200}$/;
const ADMIN_TEAM_DEFAULT='6ac7d7fc0029522fc7bf';
const DISCOUNT_CODE=/^[A-Z0-9-]{1,64}$/;
function discountOrigin(request,env,url,allowAbsent=false){
 const origin=request.headers.get('origin'),storefront=storefrontURL(env,url);
 if(!storefront||(!origin&&!allowAbsent)||(origin&&origin!==url.origin&&origin!==storefront.origin))throw new CheckoutError(403,'invalid_origin','Bitte verwalte und prüfe Codes direkt auf dieser Website.');
}
async function discountStripe(key,path,options={}){
 try{return await stripeFetch(key,path,options);}catch(error){
  if(error.upstreamStatus===401||error.upstreamStatus===403)throw new CheckoutError(503,'stripe_discount_permissions','Stripe konnte die Rabattverwaltung nicht freigeben. Der serverseitige Stripe-Schlüssel benötigt Lese- und Schreibrechte für Coupons und Promotion Codes sowie Leserechte für das Konto.');
  if(error.upstreamStatus===400)throw new CheckoutError(409,'discount_configuration_invalid','Stripe hat diese Rabattbedingungen nicht bestätigt. Bitte prüfe Code, Gültigkeit und Nutzungslimit.');
  if(error.status===404)throw new CheckoutError(404,'discount_not_found','Dieser Rabattcode wurde in Stripe nicht gefunden.');
  throw error;
 }
}
async function discountAccount(env,key,mode){
 if(!/^acct_[A-Za-z0-9]{8,100}$/.test(env.STRIPE_EXPECTED_ACCOUNT||''))throw new CheckoutError(503,'discount_account_unconfigured','Das Stripe-Konto für Rabattcodes ist noch nicht bestätigt.');
 const account=await discountStripe(key,'/account');
 if(account.id!==env.STRIPE_EXPECTED_ACCOUNT)throw new CheckoutError(503,'discount_account_mismatch','Die Rabattverwaltung ist nicht mit dem bestätigten Stripe-Konto verbunden.');
 // charges_enabled remains a separate payment gate in verifyMerchant().
 return mode;
}
async function requireDiscountAdmin(request,env){
 const authorization=request.headers.get('authorization')||'',token=authorization.startsWith('Bearer ')?authorization.slice(7):'';
 if(token.length>8192||!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token))throw new CheckoutError(401,'admin_auth_required','Bitte erneut auf der Adminseite anmelden.');
 const endpoint=env.APPWRITE_ENDPOINT||APPWRITE_ORIGIN,project=env.APPWRITE_PROJECT_ID||APPWRITE_DEFAULTS.project,team=env.APPWRITE_ADMIN_TEAM_ID||ADMIN_TEAM_DEFAULT;
 const validId=value=>typeof value==='string'&&/^[A-Za-z0-9][A-Za-z0-9._-]{0,35}$/.test(value);
 if(endpoint!==APPWRITE_ORIGIN||![project,team].every(validId))throw new CheckoutError(503,'admin_auth_unconfigured','Die Admin-Prüfung ist noch nicht eingerichtet.');
 const headers={'X-Appwrite-Project':project,'X-Appwrite-JWT':token},controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{
  const userResponse=await fetch(endpoint+'/account',{headers,signal:controller.signal,redirect:'error'});
  if([401,403].includes(userResponse.status))throw new CheckoutError(401,'admin_auth_required','Die Admin-Sitzung ist abgelaufen. Bitte erneut anmelden.');
  if(!userResponse.ok)throw new CheckoutError(503,'admin_auth_unavailable','Die Admin-Berechtigung konnte gerade nicht geprüft werden.');
  const user=await userResponse.json();if(!validId(user.$id))throw new CheckoutError(401,'admin_auth_required','Bitte erneut anmelden.');
  const query=new URLSearchParams();query.append('queries[]',JSON.stringify({method:'equal',attribute:'userId',values:[user.$id]}));query.append('queries[]',JSON.stringify({method:'limit',values:[100]}));
  const membershipResponse=await fetch(endpoint+'/teams/'+encodeURIComponent(team)+'/memberships?'+query,{headers,signal:controller.signal,redirect:'error'});
  if([401,403,404].includes(membershipResponse.status))throw new CheckoutError(403,'admin_forbidden','Dieses Konto ist nicht für die Rabattverwaltung berechtigt.');
  if(!membershipResponse.ok)throw new CheckoutError(503,'admin_auth_unavailable','Die Admin-Berechtigung konnte gerade nicht geprüft werden.');
  const result=await membershipResponse.json();
  if(!Array.isArray(result.memberships)||!result.memberships.some(member=>member.userId===user.$id&&member.confirm===true&&(!member.teamId||member.teamId===team)))throw new CheckoutError(403,'admin_forbidden','Dieses Konto ist nicht für die Rabattverwaltung berechtigt.');
  return user.$id;
 }catch(error){if(error instanceof CheckoutError)throw error;throw new CheckoutError(503,'admin_auth_unavailable','Die Admin-Berechtigung konnte gerade nicht geprüft werden.');}finally{clearTimeout(timer);}
}
function isManagedPromotion(promotion,mode){return PROMOTION_ID.test(promotion?.id||'')&&promotion.livemode===(mode==='live')&&promotion.metadata?.source===SOURCE&&promotion.metadata?.kind===DISCOUNT_KIND;}
function nonemptyScope(value){
 if(value===undefined||value===null||value==='')return false;
 if(typeof value==='string'){try{value=JSON.parse(value);}catch{return true;}}
 return !Array.isArray(value)||value.length>0;
}
function normalizedDiscount(body){
 const code=typeof body.code==='string'?body.code.trim().toUpperCase():'';
 if(!DISCOUNT_CODE.test(code))throw new CheckoutError(400,'discount_invalid','Ein Code darf 1 bis 64 Buchstaben, Ziffern oder Bindestriche enthalten.');
 if(!Number.isInteger(body.percent)||body.percent<1||body.percent>100)throw new CheckoutError(400,'discount_percent_invalid','Bitte einen ganzzahligen Rabatt von 1 bis 100 Prozent eingeben.');
 if(typeof body.active!=='boolean')throw new CheckoutError(400,'discount_active_invalid','Bitte den Aktivstatus des Codes festlegen.');
 if(!Number.isFinite(body.minOrder)||body.minOrder<0||body.minOrder>100000||Math.abs(body.minOrder*100-Math.round(body.minOrder*100))>.000001)throw new CheckoutError(400,'discount_minimum_invalid','Bitte einen gültigen Mindestbestellwert mit höchstens zwei Nachkommastellen eingeben.');
 if(!Number.isInteger(body.maxUses)||body.maxUses<0||body.maxUses>1000000)throw new CheckoutError(400,'discount_limit_invalid','Bitte ein Nutzungslimit zwischen 0 und 1.000.000 eingeben.');
 if(nonemptyScope(body.products)||nonemptyScope(body.categories))throw new CheckoutError(400,'discount_scope_unsupported','Produkt- und Kategorieeinschränkungen werden für synchronisierte Codes noch nicht unterstützt. Bitte keinen solchen Code global aktivieren.');
 const spec={code,percent:body.percent,minOrderCents:Math.round(body.minOrder*100),start:'',end:'',maxUses:body.maxUses};
 for(const field of ['start','end']){
  const value=body[field]??'';
  if(typeof value!=='string'||value.length>40||(value&&!Number.isFinite(Date.parse(value))))throw new CheckoutError(400,'discount_date_invalid','Bitte Gültigkeitsdaten im ISO-Format eingeben.');
  if(value)spec[field]=new Date(Math.floor(Date.parse(value)/1000)*1000).toISOString();
 }
 if(spec.start&&spec.end&&Date.parse(spec.end)<=Date.parse(spec.start))throw new CheckoutError(400,'discount_date_invalid','Das Enddatum muss nach dem Startdatum liegen.');
 if(body.active&&spec.start&&Date.parse(spec.start)>Date.now())throw new CheckoutError(400,'discount_start_future','Eine zukünftige Aktivierung ist noch nicht verfügbar. Speichere den Code zunächst inaktiv und aktiviere ihn zum Start.');
 if(body.active&&spec.end&&Date.parse(spec.end)<=Date.now())throw new CheckoutError(400,'discount_expired','Ein abgelaufener Code kann nicht aktiviert werden.');
 return {...spec,active:body.active};
}
function promotionRecord(promotion,mode){
 const meta=promotion.metadata||{},prior=Number(meta.cr_prior_uses||0),current=Number(promotion.times_redeemed||0);
 return {id:promotion.id,code:String(promotion.code||'').toUpperCase(),percent:Number(meta.cr_percent||0),active:promotion.active===true,minOrder:Number(meta.cr_minimum||0)/100,start:meta.cr_start||'',end:meta.cr_end||(promotion.expires_at?new Date(promotion.expires_at*1000).toISOString():''),maxUses:Number(meta.cr_max_uses||0),uses:(Number.isSafeInteger(prior)&&prior>=0?prior:0)+(Number.isSafeInteger(current)&&current>=0?current:0),createdAt:new Date((Number(promotion.created)||0)*1000).toISOString(),mode};
}
function managedDiscountHistory(matches,mode){
 const managed=matches.filter(promotion=>isManagedPromotion(promotion,mode));
 // Stripe lists newest first. An explicit generation also disambiguates
 // replacements created in the same second; old records default to generation 0.
 managed.sort((a,b)=>Number(b.metadata?.cr_generation||0)-Number(a.metadata?.cr_generation||0)||Number(b.created||0)-Number(a.created||0));
 let nativeUses=0,watermark=0;
 for(const promotion of managed){
  const current=Number(promotion.times_redeemed||0),prior=Number(promotion.metadata?.cr_prior_uses||0);
  if(!Number.isSafeInteger(current)||current<0||!Number.isSafeInteger(prior)||prior<0||!Number.isSafeInteger(nativeUses+current)||!Number.isSafeInteger(prior+current))throw new CheckoutError(503,'discount_usage_unconfirmed','Die bisherigen Stripe-Einlösungen konnten nicht sicher bestätigt werden.');
  nativeUses+=current;watermark=Math.max(watermark,prior+current);
 }
 return {latest:managed[0]||null,uses:Math.max(nativeUses,watermark)};
}
async function promotionsByCode(key,code){
 const result=await discountStripe(key,'/promotion_codes?'+new URLSearchParams({code,limit:'100'}));
 if(result.has_more||!Array.isArray(result.data))throw new CheckoutError(503,'discount_lookup_unavailable','Der Code konnte gerade nicht eindeutig geprüft werden.');
 return result.data.filter(p=>String(p.code||'').toUpperCase()===code);
}
async function promotionCoupon(key,promotion){
 const reference=promotion.promotion?.type==='coupon'?promotion.promotion.coupon:promotion.coupon;
 if(reference&&typeof reference==='object')return reference;
 if(typeof reference!=='string'||!/^[A-Za-z0-9_-]{1,255}$/.test(reference))throw new CheckoutError(409,'discount_restricted','Dieser Rabatt kann nicht in diesem Checkout verwendet werden.');
 return await discountStripe(key,'/coupons/'+encodeURIComponent(reference));
}
async function listDiscounts(key,mode){
 const records=[],seen=new Set();let after='';
 for(let page=0;page<10;page++){
  const query=new URLSearchParams({limit:'100'});if(after)query.set('starting_after',after);
  const result=await discountStripe(key,'/promotion_codes?'+query);
  if(!Array.isArray(result.data))throw new CheckoutError(503,'discount_lookup_unavailable','Die Codes konnten gerade nicht geladen werden.');
  for(const promotion of result.data){if(!isManagedPromotion(promotion,mode))continue;const record=promotionRecord(promotion,mode);if(seen.has(record.code))continue;seen.add(record.code);records.push(record);}
  if(!result.has_more)return records;
  const next=result.data.at(-1)?.id;if(!PROMOTION_ID.test(next||'')||next===after)break;after=next;
 }
 throw new CheckoutError(503,'discount_list_limit','Zu viele Stripe-Codes für diese Ansicht. Bitte nutze das Stripe-Dashboard.');
}
async function saveDiscount(body,key,mode){
 const spec=normalizedDiscount(body),conditions={...spec};delete conditions.active;
 const specHash=await digest(JSON.stringify(conditions));
 let previous=null;
 if(body.id!==undefined&&body.id!==''){
  if(typeof body.id!=='string'||!PROMOTION_ID.test(body.id))throw new CheckoutError(400,'discount_id_invalid','Die Stripe-Code-ID ist ungültig.');
  previous=await discountStripe(key,'/promotion_codes/'+encodeURIComponent(body.id));
  if(!isManagedPromotion(previous,mode))throw new CheckoutError(403,'discount_unmanaged','Dieser Code wird nicht von dieser Adminseite verwaltet.');
  if(String(previous.code||'').toUpperCase()!==spec.code)throw new CheckoutError(400,'discount_code_immutable','Ein bestehender Stripe-Code kann nicht umbenannt werden. Bitte einen neuen Code anlegen.');
 }
 const matches=await promotionsByCode(key,spec.code);
 const active=matches.find(p=>p.active===true),history=managedDiscountHistory(matches,mode);
 // A prior response may have been lost after Stripe created the replacement.
 // Reconcile that exact configuration instead of duplicating it on retry.
 // Never revive an older matching specification or trust a stale submitted ID:
 // the latest generation owns the code's current terms and redemption history.
 if(history.latest)previous=history.latest;
 if(active&&(!isManagedPromotion(active,mode)||(previous&&active.id!==previous.id)))throw new CheckoutError(409,'discount_code_conflict','Dieser Code ist bereits in Stripe aktiv. Bitte zuerst den vorhandenen Code bearbeiten oder einen anderen Code wählen.');
 if(!previous){
  previous=active||matches.find(p=>isManagedPromotion(p,mode));
  if(previous&&!isManagedPromotion(previous,mode))throw new CheckoutError(409,'discount_code_conflict','Dieser Code ist bereits vergeben.');
 }
 const priorChanged=previous&&history.uses>promotionRecord(previous,mode).uses;
 if(previous&&previous.metadata?.cr_spec===specHash&&(!priorChanged||!spec.active)){
  const record={...promotionRecord(previous,mode),uses:history.uses};
  if(spec.active&&record.maxUses>0&&record.uses>=record.maxUses)throw new CheckoutError(409,'discount_exhausted','Das Nutzungslimit dieses Codes ist erreicht.');
  if(previous.active!==spec.active){
   const revision=Number(previous.metadata?.cr_revision||0);
   if(!Number.isSafeInteger(revision)||revision<0||revision>=1000000000)throw new CheckoutError(409,'discount_revision_invalid','Bitte diesen Code vor einer weiteren Änderung in Stripe prüfen.');
   const form=new URLSearchParams({active:String(spec.active),'metadata[cr_revision]':String(revision+1)});
   previous=await discountStripe(key,'/promotion_codes/'+encodeURIComponent(previous.id),{method:'POST',body:form,headers:{'content-type':'application/x-www-form-urlencoded','idempotency-key':'crdc_toggle_'+previous.id+'_'+spec.active+'_'+revision}});
  }
  if(previous.active!==spec.active)throw new CheckoutError(503,'discount_sync_unconfirmed','Stripe hat den gewünschten Aktivstatus noch nicht bestätigt.');
  return {...promotionRecord(previous,mode),uses:history.uses};
 }
 const priorUses=history.uses;
 if(spec.maxUses>0&&spec.maxUses<=priorUses)throw new CheckoutError(409,'discount_limit_used','Das neue Nutzungslimit muss über den bisherigen Stripe-Einlösungen liegen.');
 if(spec.end&&Date.parse(spec.end)<=Date.now())throw new CheckoutError(400,'discount_expired','Bitte für geänderte Rabattbedingungen ein zukünftiges Enddatum wählen.');
 const generation=await digest(JSON.stringify({previous:previous?.id||'',spec:conditions,priorUses}));
 const couponId='crdc_'+generation.slice(0,32),couponForm=new URLSearchParams({id:couponId,duration:'once',percent_off:String(spec.percent),name:'Chevalier & Roth · '+spec.code});
 couponForm.set('metadata[source]',SOURCE);couponForm.set('metadata[kind]',DISCOUNT_KIND);
 await discountStripe(key,'/coupons',{method:'POST',body:couponForm,headers:{'content-type':'application/x-www-form-urlencoded','idempotency-key':'crdc_coupon_'+generation}});
 if(previous?.active===true){
  const disabled=await discountStripe(key,'/promotion_codes/'+encodeURIComponent(previous.id),{method:'POST',body:new URLSearchParams({active:'false'}),headers:{'content-type':'application/x-www-form-urlencoded','idempotency-key':'crdc_replace_'+generation}});
  if(disabled.active!==false)throw new CheckoutError(503,'discount_sync_unconfirmed','Der bisherige Stripe-Code konnte nicht sicher deaktiviert werden.');
 }
 const form=new URLSearchParams({'promotion[type]':'coupon','promotion[coupon]':couponId,code:spec.code,active:String(spec.active)});
 if(spec.minOrderCents>0){form.set('restrictions[minimum_amount]',String(spec.minOrderCents));form.set('restrictions[minimum_amount_currency]','eur');}
 if(spec.end)form.set('expires_at',String(Math.floor(Date.parse(spec.end)/1000)));
 if(spec.maxUses>0)form.set('max_redemptions',String(spec.maxUses-priorUses));
 for(const [name,value]of Object.entries({source:SOURCE,kind:DISCOUNT_KIND,cr_spec:specHash,cr_percent:spec.percent,cr_minimum:spec.minOrderCents,cr_start:spec.start,cr_end:spec.end,cr_max_uses:spec.maxUses,cr_prior_uses:priorUses,cr_revision:0,cr_generation:Number(previous?.metadata?.cr_generation||0)+1}))form.set('metadata['+name+']',String(value));
 const created=await discountStripe(key,'/promotion_codes',{method:'POST',body:form,headers:{'content-type':'application/x-www-form-urlencoded','idempotency-key':'crdc_promotion_'+generation+'_'+spec.active}});
 if(!isManagedPromotion(created,mode)||created.active!==spec.active||String(created.code||'').toUpperCase()!==spec.code)throw new CheckoutError(503,'discount_sync_unconfirmed','Stripe hat den Rabattcode noch nicht vollständig bestätigt. Bitte den aktuellen Stand neu laden.');
 return promotionRecord(created,mode);
}
async function validatedDiscount(code,items,catalog,key,mode){
 if(typeof code!=='string'||!DISCOUNT_CODE.test(code.trim().toUpperCase()))throw new CheckoutError(400,'discount_invalid','Bitte einen gültigen Rabattcode eingeben.');
 code=code.trim().toUpperCase();
 const subtotal=items.reduce((sum,item)=>sum+catalog.prices[item.product].amount*item.qty,0);
 if(!integerAmount(subtotal,MAX_TOTAL_AMOUNT))throw new CheckoutError(400,'invalid_total','Der Warenwert liegt außerhalb des erlaubten Bereichs.');
 const matches=await promotionsByCode(key,code),promotion=matches.find(p=>p.active===true&&p.livemode===(mode==='live'));
 if(!promotion)throw new CheckoutError(409,matches.length?'discount_inactive':'discount_invalid',matches.length?'Dieser Rabattcode ist nicht aktiv.':'Dieser Rabattcode ist ungültig.');
 if(!PROMOTION_ID.test(promotion.id||''))throw new CheckoutError(503,'discount_unavailable','Der Rabattcode konnte gerade nicht bestätigt werden.');
 const coupon=await promotionCoupon(key,promotion),now=Date.now()/1000,meta=promotion.metadata||{},restrictions=promotion.restrictions||{};
 if(coupon.valid!==true)throw new CheckoutError(409,'discount_inactive','Dieser Rabattcode ist nicht mehr gültig.');
 if((promotion.expires_at&&promotion.expires_at<=now)||(coupon.redeem_by&&coupon.redeem_by<=now))throw new CheckoutError(409,'discount_expired','Dieser Rabattcode ist abgelaufen.');
 if(meta.cr_start&&(!Number.isFinite(Date.parse(meta.cr_start))||Date.parse(meta.cr_start)>Date.now()))throw new CheckoutError(409,'discount_not_started','Dieser Rabattcode ist noch nicht gültig.');
 if(meta.cr_end&&(!Number.isFinite(Date.parse(meta.cr_end))||Date.parse(meta.cr_end)<=Date.now()))throw new CheckoutError(409,'discount_expired','Dieser Rabattcode ist abgelaufen.');
 if(promotion.customer||promotion.customer_account||restrictions.first_time_transaction===true||Object.values(coupon.applies_to||{}).some(nonemptyScope)||Object.keys(restrictions.currency_options||{}).length>0||nonemptyScope(meta.products)||nonemptyScope(meta.categories))throw new CheckoutError(409,'discount_restricted','Dieser Rabattcode hat Bedingungen, die dieser Checkout noch nicht sicher bestätigen kann.');
 if(isManagedPromotion(promotion,mode)&&Number(meta.cr_max_uses)>0&&managedDiscountHistory(matches,mode).uses>=Number(meta.cr_max_uses))throw new CheckoutError(409,'discount_exhausted','Das Nutzungslimit dieses Rabattcodes ist erreicht.');
 if((promotion.max_redemptions&&promotion.times_redeemed>=promotion.max_redemptions)||(coupon.max_redemptions&&coupon.times_redeemed>=coupon.max_redemptions))throw new CheckoutError(409,'discount_exhausted','Das Nutzungslimit dieses Rabattcodes ist erreicht.');
 if(restrictions.minimum_amount&&(restrictions.minimum_amount_currency!=='eur'||subtotal<restrictions.minimum_amount))throw new CheckoutError(409,'discount_minimum','Der Mindestbestellwert dieses Rabattcodes ist noch nicht erreicht.');
 const percent=coupon.percent_off;
 if(!Number.isInteger(percent)||percent<1||percent>100||coupon.amount_off)throw new CheckoutError(409,'discount_restricted','Dieser Checkout unterstützt derzeit prozentuale Rabattcodes.');
 if(isManagedPromotion(promotion,mode)&&(Number(meta.cr_percent)!==percent||Number(meta.cr_minimum||0)!==Number(restrictions.minimum_amount||0)))throw new CheckoutError(409,'discount_conditions_changed','Die Bedingungen dieses Codes wurden geändert. Bitte prüfe den Code erneut in der Adminseite.');
 const discountAmount=Math.min(subtotal,Math.round(subtotal*percent/100));
 return {code,promotionCodeId:promotion.id,discountAmount,subtotal,totalAfterDiscount:subtotal-discountAmount,currency:'eur',percent,mode};
}
async function validateDiscountRequest(request,env,url){
 discountOrigin(request,env,url);const body=await readJson(request),items=normalizedItems({...body,attemptId:'00000000-0000-4000-8000-000000000000'}),catalog=getCatalog(env),{key,mode}=requireModeKey(env);
 if(items.some(item=>!catalog.prices[item.product]||catalog.prices[item.product].available===false))throw new CheckoutError(409,'prices_unconfigured','Für diese Auswahl ist noch kein bestätigter Preis hinterlegt.');
 await discountAccount(env,key,mode);
 return json(await validatedDiscount(body.code,items,catalog,key,mode));
}
async function adminDiscountRequest(request,env,url){
 discountOrigin(request,env,url,request.method==='GET');await requireDiscountAdmin(request,env);const {key,mode}=requireModeKey(env);await discountAccount(env,key,mode);
 if(request.method==='GET')return json({codes:await listDiscounts(key,mode),mode});
 return json({code:await saveDiscount(await readJson(request),key,mode),mode,synchronized:true});
}

async function createCheckout(request, env, url) {
 const storefront=storefrontURL(env,url),origin=request.headers.get('origin');
 if(!storefront||!(origin===url.origin||origin===storefront.origin))throw new CheckoutError(403,'invalid_origin','Bitte starte den Checkout direkt auf dieser Website.');
 const body=await readJson(request),items=normalizedItems(body),{key,mode}=requireModeKey(env),catalog=getCatalog(env);
 const locale = ['de', 'en', 'fr'].includes(body.locale) ? body.locale : 'auto';
 if (!catalog.configured || items.some(item => !catalog.prices[item.product])) throw new CheckoutError(409, 'prices_unconfigured', 'Preise noch nicht hinterlegt.');
 if (items.some(item => !catalog.prices[item.product].available)) throw new CheckoutError(409, 'product_unavailable', 'Ein ausgewähltes Produkt ist derzeit nicht für den Test-Checkout verfügbar.');
 const readiness=checkoutConfiguration(env,catalog);if(mode==='live'){if(readiness.blockedReasons.length)throw new CheckoutError(503,'live_checkout_unconfigured','Die Zahlung wird noch vorbereitet.');await verifyMerchant(env,key);}
 const total = items.reduce((sum, item) => sum + catalog.prices[item.product].amount * item.qty, catalog.shippingAmount);
 if (!Number.isSafeInteger(total) || total < 50 || total > MAX_TOTAL_AMOUNT) throw new CheckoutError(400, 'invalid_total', 'Der Gesamtbetrag liegt außerhalb des erlaubten Testbereichs.');
 if(body.discountCode!==undefined&&(typeof body.discountCode!=='string'||body.discountCode.length>64))throw new CheckoutError(400,'discount_invalid','Bitte einen gültigen Rabattcode eingeben.');
 const discount=body.discountCode?.trim()?await validatedDiscount(body.discountCode,items,catalog,key,mode):null;
 const payable=total-(discount?.discountAmount||0);
 if(payable!==0&&payable<50)throw new CheckoutError(409,'discount_total_too_small','Der Betrag nach Rabatt liegt unter dem Mindestbetrag für eine Stripe-Zahlung.');
 const cartHash = await digest(JSON.stringify({origin:url.origin,storefront:storefront.href,mode,locale,currency: catalog.currency, items: items.map(item => ({...item, amount: catalog.prices[item.product].amount})), shippingAmount: catalog.shippingAmount, shippingCountries: catalog.shippingCountries,discount:discount?{id:discount.promotionCodeId,code:discount.code,amount:discount.discountAmount}:null}));
 const form = new URLSearchParams();
 form.set('mode','payment');
 const integrationHash=await digest(body.attemptId.toLowerCase()+':'+cartHash);
 form.set('integration_identifier','chevalier_checkout_'+integrationHash.slice(0,16).match(/../g).map(value=>String.fromCharCode(97+parseInt(value,16)%26)).join(''));
 form.set('locale', locale);
 const returnLanguage = locale === 'auto' ? '' : '&lang=' + locale;
 form.set('success_url', storefront.href + 'checkout.html?status=success&session_id={CHECKOUT_SESSION_ID}' + returnLanguage);
 form.set('cancel_url', storefront.href + 'checkout.html?status=cancelled' + returnLanguage);
 form.set('client_reference_id', body.attemptId.toLowerCase());
 form.set('metadata[source]', SOURCE); form.set('metadata[site_origin]', url.origin); form.set('metadata[mode]',mode);form.set('metadata[tax_presentation]','illustrative');
 form.set('metadata[cart_hash]', cartHash); form.set('metadata[variant_count]', String(items.length));
 form.set('metadata[unit_count]', String(items.reduce((sum, item) => sum + item.qty, 0)));
 if(discount){form.set('discounts[0][promotion_code]',discount.promotionCodeId);form.set('metadata[discount_code]',discount.code);form.set('metadata[promotion_code]',discount.promotionCodeId);}
 items.forEach((item, index) => {
  const prefix = 'line_items[' + index + ']';
  form.set(prefix + '[quantity]', String(item.qty));
  form.set(prefix + '[price_data][currency]', 'eur');
  form.set(prefix + '[price_data][unit_amount]', String(catalog.prices[item.product].amount));
  const localizedColors = {en:{bordeaux:'Bordeaux',beige:'Beige',navy:'Navy blue'},fr:{bordeaux:'Bordeaux',beige:'Beige',navy:'Bleu marine'}};
  form.set(prefix + '[price_data][product_data][name]', PRODUCTS[item.product].name + ' · ' + (localizedColors[locale]?.[item.color] || COLORS[item.color]) + ' / ' + item.size);
  form.set(prefix + '[price_data][product_data][metadata][product]', item.product);
  form.set(prefix + '[price_data][product_data][metadata][backend_id]', PRODUCTS[item.product].backendId);
  form.set(prefix + '[price_data][product_data][metadata][color]', item.color);
  form.set(prefix + '[price_data][product_data][metadata][size]', item.size);
 });
 catalog.shippingCountries.forEach((country, index) => form.set('shipping_address_collection[allowed_countries][' + index + ']', country));
 form.set('shipping_options[0][shipping_rate_data][type]', 'fixed_amount');
 form.set('shipping_options[0][shipping_rate_data][display_name]', {en:'Shipping',fr:'Livraison'}[locale] || 'Versand');
 form.set('shipping_options[0][shipping_rate_data][fixed_amount][amount]', String(catalog.shippingAmount));
 form.set('shipping_options[0][shipping_rate_data][fixed_amount][currency]', 'eur');
 const session = await stripeFetch(key, '/checkout/sessions', {method: 'POST', body: form, headers: {
  'content-type': 'application/x-www-form-urlencoded',
  'idempotency-key': 'cr_checkout_'+mode+'_' + body.attemptId.toLowerCase() + '_' + cartHash
 }});
 let checkoutURL;
 try {checkoutURL = new URL(session.url);} catch {throw new CheckoutError(502, 'stripe_unavailable', 'Stripe hat keinen gültigen Test-Checkout zurückgegeben.');}
 if (!SESSION_ID.test(String(session.id || '')) || !String(session.id).startsWith('cs_'+mode+'_') || session.livemode !== (mode==='live') || checkoutURL.protocol !== 'https:' || checkoutURL.hostname !== 'checkout.stripe.com') {
  throw new CheckoutError(502, 'stripe_unavailable', 'Stripe hat keinen gültigen Test-Checkout zurückgegeben.');
 }
 return json({id:session.id,url:checkoutURL.href,mode});
}

async function readSession(env, url) {
 const id = url.searchParams.get('session_id') || '';
 const {key,mode}=requireModeKey(env);
 if(!SESSION_ID.test(id)||!id.startsWith('cs_'+mode+'_'))throw new CheckoutError(400,'invalid_session','Die Zahlungs-ID ist ungültig.');
 if(mode==='live')await verifyMerchant(env,key);
 const session=await stripeFetch(key,'/checkout/sessions/'+encodeURIComponent(id));
 if(session.id!==id||session.livemode!==(mode==='live') || session.metadata?.source !== SOURCE || session.metadata?.site_origin !== url.origin || session.currency !== 'eur' || !integerAmount(session.amount_total, MAX_TOTAL_AMOUNT, true)) {
  throw new CheckoutError(404, 'session_not_found', 'Diese Zahlung wurde nicht gefunden.');
 }
 const status = ['open', 'complete', 'expired'].includes(session.status) ? session.status : 'unknown';
 const paymentStatus = ['paid', 'unpaid', 'no_payment_required'].includes(session.payment_status) ? session.payment_status : 'unknown';
 return json({id, status, paymentStatus, paid: status === 'complete' && (paymentStatus === 'paid'||(paymentStatus==='no_payment_required'&&session.amount_total===0)), amountTotal: session.amount_total, currency:'eur',testMode:mode==='test',...(mode==='live'?{mode:'live'}:{})});
}

// Signature verification precedes JSON parsing and any storage/network effect.
async function webhook(request,env,url) {
 const secret=env.STRIPE_WEBHOOK_SECRET;
 if(!/^whsec_[A-Za-z0-9]{8,300}$/.test(secret||''))throw new CheckoutError(503,'webhook_unconfigured','Webhook noch nicht eingerichtet.');
 const parts=(request.headers.get('stripe-signature')||'').split(',').map(part=>part.split('=')),stamp=parts.find(part=>part[0]==='t')?.[1];
 if(!/^\d{1,12}$/.test(stamp||'')||Math.abs(Date.now()/1000-Number(stamp))>300)throw new CheckoutError(400,'invalid_signature','Ungültige Webhook-Signatur.');
 const reader=request.body?.getReader();if(!reader)throw new CheckoutError(400,'invalid_event','Webhook-Daten fehlen.');
 const chunks=[];let length=0;
 try{while(true){const part=await reader.read();if(part.done)break;length+=part.value.length;if(length>262144){await reader.cancel();throw new CheckoutError(413,'event_too_large','Webhook zu groß.');}chunks.push(part.value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(length);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.length;}
 const prefix=new TextEncoder().encode(stamp+'.'),signed=new Uint8Array(prefix.length+length);signed.set(prefix);signed.set(bytes,prefix.length);
 const hmac=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 let verified=false;
 for(const [name,value]of parts)if(name==='v1'&&/^[a-f0-9]{64}$/i.test(value||'')){
  const signature=Uint8Array.from(value.match(/../g),part=>parseInt(part,16));if(await crypto.subtle.verify('HMAC',hmac,signature,signed))verified=true;
 }
 if(!verified)throw new CheckoutError(400,'invalid_signature','Ungültige Webhook-Signatur.');
 let event;try{event=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw new CheckoutError(400,'invalid_event','Ungültige Webhook-Daten.');}
 if(!['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed'].includes(event.type))return json({received:true,action:'ignored'});
 const incoming=event.data?.object,mode=getMode(env);
 if(event.livemode!==(mode==='live')||incoming?.livemode!==(mode==='live'))throw new CheckoutError(400,'event_mode_mismatch','Falsche Zahlungsumgebung.');
 if(incoming?.metadata?.source!==SOURCE)return json({received:true,action:'ignored'});
 if(event.type==='checkout.session.async_payment_failed')return json({received:true,action:'payment_failed'});
 if(incoming.payment_status!=='paid'&&!(incoming.payment_status==='no_payment_required'&&incoming.amount_total===0))return json({received:true,action:'awaiting_payment'});
 const storage=storageConfig(env);if(!storage.ready)throw new CheckoutError(503,'order_storage_unconfigured','Bestellspeicherung noch nicht eingerichtet.');
 const {key}=requireModeKey(env);if(mode==='live')await verifyMerchant(env,key);
 const id=incoming.id;
 if(!SESSION_ID.test(id||'')||!id.startsWith('cs_'+mode+'_'))throw new CheckoutError(400,'invalid_session','Ungültige Zahlungs-ID.');
 const session=await stripeFetch(key,'/checkout/sessions/'+encodeURIComponent(id));
 if(session.id!==id||session.livemode!==(mode==='live')||session.metadata?.source!==SOURCE||session.metadata?.site_origin!==url.origin||session.status!=='complete'||!(session.payment_status==='paid'||(session.payment_status==='no_payment_required'&&session.amount_total===0))||session.currency!=='eur'||!integerAmount(session.amount_total,MAX_TOTAL_AMOUNT,true))throw new CheckoutError(409,'payment_unverified','Zahlung noch nicht bestätigt.');
 const lines=await stripeFetch(key,'/checkout/sessions/'+encodeURIComponent(id)+'/line_items?limit=100&expand%5B%5D=data.price.product');
 if(lines.has_more||!Array.isArray(lines.data)||!lines.data.length||lines.data.length>60)throw new CheckoutError(503,'order_items_unavailable','Bestellpositionen noch nicht verfügbar.');
 const items=lines.data.map(line=>{
  const meta=line.price?.product?.metadata,product=meta?.product;
  if(typeof product!=='string'||!Object.hasOwn(PRODUCTS,product)||!Object.hasOwn(COLORS,meta.color||'')||!SIZES.has(meta.size)||!Number.isInteger(line.quantity)||line.quantity<1||line.quantity>20||!integerAmount(line.price?.unit_amount,MAX_UNIT_AMOUNT))throw new CheckoutError(503,'order_items_invalid','Bestellpositionen konnten nicht bestätigt werden.');
  return {productId:PRODUCTS[product].backendId,name:PRODUCTS[product].name,color:COLORS[meta.color],size:meta.size,quantity:line.quantity,unitAmountCents:line.price.unit_amount,stripeSessionId:id};
 });
 const shipping=session.collected_information?.shipping_details||session.shipping_details;
 if(shipping)items[0].delivery={name:shipping.name||'',address:shipping.address||{},phone:session.customer_details?.phone||''};
 if(session.metadata?.discount_code&&integerAmount(session.total_details?.amount_discount,MAX_TOTAL_AMOUNT,true))items[0].discount={code:String(session.metadata.discount_code).slice(0,64),promotionCodeId:String(session.metadata.promotion_code||'').slice(0,206),amountCents:session.total_details.amount_discount};
 const rowId=(await digest('stripe-order:'+id)).slice(0,32),data={number:'CR-'+rowId.slice(0,12).toUpperCase(),customer:String(session.customer_details?.name||''),email:String(session.customer_details?.email||''),date:new Date(Number(session.created)*1000).toISOString(),status:'paid',items:JSON.stringify(items),total:session.amount_total/100};
 const endpoint=storage.endpoint+'/tablesdb/'+encodeURIComponent(storage.database)+'/tables/'+encodeURIComponent(storage.table)+'/rows';
 const headers={'content-type':'application/json','X-Appwrite-Project':storage.project,'X-Appwrite-Key':storage.key};
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
 try{
  const response=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify({rowId,data,permissions:[]}),signal:controller.signal,redirect:'error'});
  if(response.status===409){
   const existing=await fetch(endpoint+'/'+rowId,{headers,signal:controller.signal,redirect:'error'});let row;try{row=await existing.json();}catch{}
   let prior;try{prior=JSON.parse(row?.items||'null');}catch{}
   if(!existing.ok||row?.total!==data.total||!Array.isArray(prior)||!prior.length||!prior.every(item=>item.stripeSessionId===id))throw new Error('Conflicting order');
  }else{let row;try{row=await response.json();}catch{}if(!response.ok||row?.$id!==rowId)throw new Error('Order not acknowledged');}
 }catch{throw new CheckoutError(503,'order_storage_unavailable','Die Bestellspeicherung konnte noch nicht bestätigt werden.');}finally{clearTimeout(timeout);}
 return json({received:true,action:'order_saved'});
}

export async function handleStripeRequest(request,env={}) {
 const url=new URL(request.url),hook=url.pathname==='/api/stripe/webhook';
 if(!hook&&!['/api/stripe/status','/api/checkout','/api/checkout/session','/api/discount/validate','/api/admin/codes'].includes(url.pathname))return null;
 const storefront=storefrontURL(env,url),origin=request.headers.get('origin'),cors=origin&&storefront?.origin===origin&&origin!==url.origin;
 const decorate=response=>{if(cors){response.headers.set('access-control-allow-origin',origin);response.headers.set('vary','Origin');}return response;};
 if(request.method==='OPTIONS'&&!hook&&cors)return new Response(null,{status:204,headers:{'access-control-allow-origin':origin,'access-control-allow-methods':'GET, POST','access-control-allow-headers':'content-type, authorization','vary':'Origin'}});
 const allowedMethod=url.pathname==='/api/admin/codes'?'GET, POST':hook||url.pathname==='/api/checkout'||url.pathname==='/api/discount/validate'?'POST':'GET';
 if(!allowedMethod.split(', ').includes(request.method))return decorate(json({error:'method_not_allowed',message:'Diese Methode wird nicht unterstützt.'},405,{allow:allowedMethod}));
 try{
  if(hook)return await webhook(request,env,url);
  if(url.pathname==='/api/admin/codes')return decorate(await adminDiscountRequest(request,env,url));
  if(url.pathname==='/api/discount/validate')return decorate(await validateDiscountRequest(request,env,url));
  if(url.pathname==='/api/stripe/status'){
   const catalog=getCatalog(env),state=checkoutConfiguration(env,catalog);let accountVerified=false;
   if(state.mode==='live'&&!state.blockedReasons.length){try{await verifyMerchant(env,getKey(env).value);accountVerified=true;}catch{state.blockedReasons.push('merchant_unverified');}}
   const ready=!state.blockedReasons.length;
   return decorate(json({...state,ready,canCharge:state.mode==='live'&&ready,accountVerified,pricesConfigured:catalog.configured,currency:catalog.currency,prices:catalog.prices,shippingAmount:catalog.shippingAmount,shippingCountries:catalog.shippingCountries,missingProducts:catalog.missingProducts,taxRegistered:catalog.taxRegistered,taxPresentation:catalog.taxPresentation,illustrativeTaxRate:catalog.illustrativeTaxRate,taxCollected:false}));
  }
  return decorate(url.pathname==='/api/checkout'?await createCheckout(request,env,url):await readSession(env,url));
 }catch(error){
  if(error instanceof CheckoutError)return decorate(json({error:error.code,message:error.message},error.status));
  return decorate(json({error:'checkout_unavailable',message:'Der Checkout ist gerade nicht verfügbar. Bitte versuche es erneut.'},503));
 }
}

export default handleStripeRequest;
