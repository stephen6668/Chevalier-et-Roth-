import {handleStripeRequest} from './stripe.mjs';

// STATIC_FILES and MODEL_FILES are generated from the authored dist/ directory.
// The deployed artifact is one self-contained Worker with embedded raster bytes.
// Large GLBs stream from an exact, build-pinned repository revision only.
function siteError(message, status = 404, extra = {}) {
 return new Response(message, {status, headers: {'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...extra}});
}

function sitePath(requestURL) {
 const url = new URL(requestURL);
 if (/%2f|%5c|%00/i.test(url.pathname)) return null;
 let path;
 try {path = decodeURIComponent(url.pathname);} catch {return null;}
 if (path.includes('\\') || path.includes('\0') || path.split('/').some(part => part === '.' || part === '..')) return null;
 if (path === '/') return '/index.html';
 return path;
}

function siteAssetHeaders(asset) {
 return new Headers({
  'content-type': asset.type,
  'content-length': String(asset.bytes),
  'etag': asset.etag,
  'cache-control': asset.type.startsWith('text/html') ? 'no-store' : 'public, max-age=300, must-revalidate',
  'x-content-type-options': 'nosniff'
 });
}

async function siteModel(request, path, model) {
 const headers = new Headers({'user-agent': 'Chevalier-Roth-3D/1.0'});
 for (const name of ['range', 'if-none-match', 'if-modified-since']) {
  const value = request.headers.get(name);
  if (value) headers.set(name, value);
 }
 const allowedHosts = new Set(['raw.githubusercontent.com', 'media.githubusercontent.com', 'objects.githubusercontent.com']);
 // If this hosting edge cannot fetch GitHub, browsers can load the same public,
 // CORS-enabled immutable file directly. The target never comes from user input.
 const failure = (reason, upstreamStatus, errorClass) => siteError('Die 3D-Datei wird direkt geladen.', 307, {
  'location': MODEL_SOURCE_ORIGIN + path,
  'referrer-policy': 'no-referrer',
  'x-model-proxy': '1',
  'x-model-error': reason,
  ...(Number.isInteger(upstreamStatus) ? {'x-model-upstream-status': String(upstreamStatus)} : {}),
  ...(typeof errorClass === 'string' && /^[A-Za-z][A-Za-z0-9]{0,39}$/.test(errorClass) ? {'x-model-error-class': errorClass} : {})
 });
 let upstream, target = new URL(MODEL_SOURCE_ORIGIN + path);
 for (let redirects = 0; redirects <= 3; redirects++) {
  if (target.protocol !== 'https:' || target.username || target.password || (target.port && target.port !== '443') || !allowedHosts.has(target.hostname)) return failure('unsafe-redirect', upstream?.status);
  try {
   upstream = await fetch(target.href, {method: request.method, headers, redirect: 'manual'});
  } catch (error) {return failure('network-error', upstream?.status, error?.name);}
  if (![301, 302, 303, 307, 308].includes(upstream.status)) break;
  if (redirects === 3) return failure('redirect-limit', upstream.status);
  const location = upstream.headers.get('location');
  if (!location) return failure('redirect-missing-location', upstream.status);
  try {target = new URL(location, target);} catch {return failure('invalid-redirect', upstream.status);}
  try {await upstream.body?.cancel();} catch {}
 }
 if (![200, 206, 304, 416].includes(upstream.status)) return failure('upstream-status', upstream.status);
 const responseHeaders = new Headers({
  'content-type': 'model/gltf-binary',
  'x-model-proxy': '1',
  'cache-control': 'public, max-age=3600, must-revalidate',
  'x-content-type-options': 'nosniff'
 });
 for (const name of ['content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']) {
  const value = upstream.headers.get(name);
  if (value) responseHeaders.set(name, value);
 }
 if (!responseHeaders.has('etag')) responseHeaders.set('etag', model.etag);
 return new Response(request.method === 'HEAD' || upstream.status === 304 ? null : upstream.body, {status: upstream.status, headers: responseHeaders});
}

export default {
 async fetch(request, env, ctx) {
  void ctx;
  const path = sitePath(request.url);
  if (path === null) return siteError('Ungültiger Pfad.', 400);
  if (path.startsWith('/api/')) {
   return (await handleStripeRequest(request, env)) || siteError('Nicht gefunden.');
  }
  if (!['GET', 'HEAD'].includes(request.method)) return siteError('Methode nicht erlaubt.', 405, {allow: 'GET, HEAD'});
  const model = Object.hasOwn(MODEL_FILES, path) ? MODEL_FILES[path] : null;
  if (model) return siteModel(request, path, model);
  const asset = Object.hasOwn(STATIC_FILES, path) ? STATIC_FILES[path] : null;
  if (!asset) return siteError('Nicht gefunden.');
  const headers = siteAssetHeaders(asset);
  if (request.headers.get('if-none-match') === asset.etag) {
   headers.delete('content-length');
   return new Response(null, {status: 304, headers});
  }
  if (request.method === 'HEAD') return new Response(null, {status: 200, headers});
  const body = asset.binary ? Uint8Array.from(atob(asset.body), character => character.charCodeAt(0)) : asset.body;
  return new Response(body, {status: 200, headers});
 }
};
