// Stripe test checkout. Secrets are supplied by the hosting runtime only.
const PRODUCTS = Object.freeze({
 body: {name: 'Le Body', backendId: 'p3'},
 halfzip: {name: 'Le Half-Zip', backendId: 'p1'},
 trousers: {name: 'Le Pantalon', backendId: 'p2'}
});
const COLORS = Object.freeze({bordeaux: 'Bordeaux', black: 'Schwarz', gray: 'Grau', beige: 'Beige', navy: 'Navyblau'});
const SIZES = new Set(['S', 'M', 'L', 'XL']);
const DEFAULT_SHIPPING_COUNTRIES = Object.freeze(['LU', 'BE', 'FR', 'DE']);
const MAX_BODY_BYTES = 16384;
const MAX_UNIT_AMOUNT = 1000000;
const MAX_SHIPPING_AMOUNT = 100000;
const MAX_TOTAL_AMOUNT = 10000000;
const SOURCE = 'chevalier-et-roth';
const SESSION_ID = /^cs_test_[a-zA-Z0-9_]{8,200}$/;
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

function getKey(env) {
 const value = typeof env?.STRIPE_SECRET_KEY === 'string' ? env.STRIPE_SECRET_KEY.trim() : '';
 return {present: Boolean(value), testMode: /^sk_test_[A-Za-z0-9]{4,300}$/.test(value), value};
}

function requireTestKey(env) {
 const key = getKey(env);
 if (!key.testMode) throw new CheckoutError(503, 'test_checkout_unconfigured', key.present
  ? 'Nur Stripe-Testzahlungen sind freigeschaltet.'
  : 'Stripe-Testzahlungen sind noch nicht eingerichtet.');
 return key.value;
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
 const validCountries = Array.isArray(inputCountries) && inputCountries.length > 0 && inputCountries.length <= 40 && inputCountries.every(code => typeof code === 'string' && /^[A-Z]{2}$/.test(code));
 const shippingCountries = validCountries ? [...new Set(inputCountries)] : [];
 const missingProducts = Object.keys(PRODUCTS).filter(id => !prices[id]);
 return {currency: 'eur', prices, shippingAmount, shippingCountries, missingProducts,
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
   method: options.method || 'GET', signal: controller.signal,
   headers: {'authorization': 'Bearer ' + key, 'stripe-version': '2024-06-20', ...options.headers},
   ...(options.body ? {body: options.body} : {})
  });
  let value;
  try {value = await response.json();} catch {throw new CheckoutError(502, 'stripe_unavailable', 'Stripe konnte die Anfrage gerade nicht bestätigen. Bitte versuche es erneut.');}
  if (!response.ok) {
   if (response.status === 404) throw new CheckoutError(404, 'session_not_found', 'Diese Testzahlung wurde nicht gefunden.');
   if (response.status === 429) throw new CheckoutError(429, 'stripe_rate_limited', 'Zu viele Checkout-Versuche. Bitte warte einen Moment.');
   if (response.status === 401 || response.status === 403) throw new CheckoutError(503, 'stripe_unconfigured', 'Die Stripe-Testverbindung ist noch nicht einsatzbereit.');
   throw new CheckoutError(502, 'stripe_unavailable', 'Stripe konnte die Anfrage gerade nicht bestätigen. Bitte versuche es erneut.');
  }
  return value;
 } catch (error) {
  if (error instanceof CheckoutError) throw error;
  throw new CheckoutError(503, 'stripe_unavailable', 'Stripe ist gerade nicht erreichbar. Bitte versuche es erneut.');
 } finally {clearTimeout(timeout);}
}

async function createCheckout(request, env, url) {
 if (request.headers.get('origin') !== url.origin) throw new CheckoutError(403, 'invalid_origin', 'Bitte starte den Checkout direkt auf dieser Website.');
 const body = await readJson(request), items = normalizedItems(body), key = requireTestKey(env), catalog = getCatalog(env);
 if (!catalog.configured || items.some(item => !catalog.prices[item.product])) throw new CheckoutError(409, 'prices_unconfigured', 'Preise noch nicht hinterlegt.');
 if (items.some(item => !catalog.prices[item.product].available)) throw new CheckoutError(409, 'product_unavailable', 'Ein ausgewähltes Produkt ist derzeit nicht für den Test-Checkout verfügbar.');
 const total = items.reduce((sum, item) => sum + catalog.prices[item.product].amount * item.qty, catalog.shippingAmount);
 if (!Number.isSafeInteger(total) || total < 50 || total > MAX_TOTAL_AMOUNT) throw new CheckoutError(400, 'invalid_total', 'Der Gesamtbetrag liegt außerhalb des erlaubten Testbereichs.');
 const cartHash = await digest(JSON.stringify({origin: url.origin, currency: catalog.currency, items: items.map(item => ({...item, amount: catalog.prices[item.product].amount})), shippingAmount: catalog.shippingAmount, shippingCountries: catalog.shippingCountries}));
 const form = new URLSearchParams();
 form.set('mode', 'payment'); form.set('payment_method_types[0]', 'card');
 form.set('success_url', url.origin + '/checkout.html?status=success&session_id={CHECKOUT_SESSION_ID}');
 form.set('cancel_url', url.origin + '/checkout.html?status=cancelled');
 form.set('client_reference_id', body.attemptId.toLowerCase());
 form.set('metadata[source]', SOURCE); form.set('metadata[site_origin]', url.origin); form.set('metadata[mode]', 'test');
 form.set('metadata[cart_hash]', cartHash); form.set('metadata[variant_count]', String(items.length));
 form.set('metadata[unit_count]', String(items.reduce((sum, item) => sum + item.qty, 0)));
 items.forEach((item, index) => {
  const prefix = 'line_items[' + index + ']';
  form.set(prefix + '[quantity]', String(item.qty));
  form.set(prefix + '[price_data][currency]', 'eur');
  form.set(prefix + '[price_data][unit_amount]', String(catalog.prices[item.product].amount));
  form.set(prefix + '[price_data][product_data][name]', PRODUCTS[item.product].name + ' · ' + COLORS[item.color] + ' / ' + item.size);
  form.set(prefix + '[price_data][product_data][metadata][product]', item.product);
  form.set(prefix + '[price_data][product_data][metadata][backend_id]', PRODUCTS[item.product].backendId);
  form.set(prefix + '[price_data][product_data][metadata][color]', item.color);
  form.set(prefix + '[price_data][product_data][metadata][size]', item.size);
 });
 catalog.shippingCountries.forEach((country, index) => form.set('shipping_address_collection[allowed_countries][' + index + ']', country));
 form.set('shipping_options[0][shipping_rate_data][type]', 'fixed_amount');
 form.set('shipping_options[0][shipping_rate_data][display_name]', 'Versand');
 form.set('shipping_options[0][shipping_rate_data][fixed_amount][amount]', String(catalog.shippingAmount));
 form.set('shipping_options[0][shipping_rate_data][fixed_amount][currency]', 'eur');
 const session = await stripeFetch(key, '/checkout/sessions', {method: 'POST', body: form, headers: {
  'content-type': 'application/x-www-form-urlencoded',
  'idempotency-key': 'cr_checkout_test_' + body.attemptId.toLowerCase() + '_' + cartHash
 }});
 let checkoutURL;
 try {checkoutURL = new URL(session.url);} catch {throw new CheckoutError(502, 'stripe_unavailable', 'Stripe hat keinen gültigen Test-Checkout zurückgegeben.');}
 if (!SESSION_ID.test(String(session.id || '')) || session.livemode !== false || checkoutURL.protocol !== 'https:' || checkoutURL.hostname !== 'checkout.stripe.com') {
  throw new CheckoutError(502, 'stripe_unavailable', 'Stripe hat keinen gültigen Test-Checkout zurückgegeben.');
 }
 return json({id: session.id, url: checkoutURL.href, mode: 'test'});
}

async function readSession(env, url) {
 const id = url.searchParams.get('session_id') || '';
 if (!SESSION_ID.test(id)) throw new CheckoutError(400, 'invalid_session', 'Die Testzahlungs-ID ist ungültig.');
 const session = await stripeFetch(requireTestKey(env), '/checkout/sessions/' + encodeURIComponent(id));
 if (session.id !== id || session.livemode !== false || session.metadata?.source !== SOURCE || session.metadata?.site_origin !== url.origin || session.currency !== 'eur' || !integerAmount(session.amount_total, MAX_TOTAL_AMOUNT, true)) {
  throw new CheckoutError(404, 'session_not_found', 'Diese Testzahlung wurde nicht gefunden.');
 }
 const status = ['open', 'complete', 'expired'].includes(session.status) ? session.status : 'unknown';
 const paymentStatus = ['paid', 'unpaid', 'no_payment_required'].includes(session.payment_status) ? session.payment_status : 'unknown';
 return json({id, status, paymentStatus, paid: status === 'complete' && paymentStatus === 'paid', amountTotal: session.amount_total, currency: 'eur', testMode: true});
}

export async function handleStripeRequest(request, env = {}) {
 const url = new URL(request.url);
 if (!['/api/stripe/status', '/api/checkout', '/api/checkout/session'].includes(url.pathname)) return null;
 const allowedMethod = url.pathname === '/api/checkout' ? 'POST' : 'GET';
 if (request.method !== allowedMethod) return json({error: 'method_not_allowed', message: 'Diese Methode wird nicht unterstützt.'}, 405, {allow: allowedMethod});
 try {
  if (url.pathname === '/api/stripe/status') {
   const key = getKey(env), catalog = getCatalog(env);
   return json({configured: key.testMode, testMode: key.testMode, ready: key.testMode && catalog.configured, mode: key.testMode ? 'test' : 'unconfigured', pricesConfigured: catalog.configured, currency: catalog.currency, prices: catalog.prices, shippingAmount: catalog.shippingAmount, shippingCountries: catalog.shippingCountries, missingProducts: catalog.missingProducts});
  }
  if (url.pathname === '/api/checkout') return await createCheckout(request, env, url);
  return await readSession(env, url);
 } catch (error) {
  if (error instanceof CheckoutError) return json({error: error.code, message: error.message}, error.status);
  return json({error: 'checkout_unavailable', message: 'Der Test-Checkout ist gerade nicht verfügbar. Bitte versuche es erneut.'}, 503);
 }
}

export default handleStripeRequest;
