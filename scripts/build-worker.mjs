import {readFile, writeFile, mkdir, readdir, rm, lstat} from 'node:fs/promises';
import {resolve, relative, extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
async function runtimeFile(path) {
 try {
  const status = await lstat(path);
  if (status.isSymbolicLink()) throw new Error('Runtime source files cannot be symlinks.');
  return status.isFile();
 } catch (error) {if (error.code === 'ENOENT') return false; throw error;}
}
// Sites keeps authored pages under dist/. The GitHub mirror keeps them flat.
// Enumerate only shipped runtime files so root PNG/GLB uploads and build tools
// never become accidental public assets in the flat-repository layout.
const sourceDirectory = await runtimeFile(resolve(root, 'dist/index.html')) ? resolve(root, 'dist') : root;
const runtimeNames = [
 'index.html', 'styles.css', 'app.js', 'catalog.js', 'gallery.js', 'viewer-setup.js',
 'site-config.js', 'appwrite-client.js', 'launch.js', 'launch.css',
 'admin.html', 'admin.js', 'admin.css', 'product.html', 'product.js', 'product.css',
 'checkout.html', 'checkout.js', 'checkout.css', 'store-prices.js',
 'fonts.css','footer.js','footer.css','privacy.js','privacy.css',
 'legal.html','legal.js','legal.css','legal-config.js',
 'i18n.js','i18n.css','translations-store.js','translations-legal.js',
 'intro.js','intro.css','motion.js','motion.css'
];
const output = resolve(root, '.worker-output/dist');
const modelRef = process.argv.find(value => value.startsWith('--model-ref='))?.slice('--model-ref='.length) || '78f52028a6a6b18ca8a7c5fa401bf6a0c62cdc77';
if (!/^[a-f0-9]{40}$/.test(modelRef)) throw new Error('The model source must be an exact Git commit SHA.');
const modelOrigin = 'https://raw.githubusercontent.com/stephen6668/Chevalier-et-Roth-/' + modelRef;
// Original studio photographs stay byte-for-byte PNGs outside the compressed
// Worker. Only this checked source manifest can create photo routes. The fixed
// main-branch filenames let future user uploads appear without a redeployment.
const photoManifest = JSON.parse(await readFile(resolve(sourceDirectory, 'studio-photos.json'), 'utf8'));
const requiredPhotoNames = new Set(['body', 'halfzip', 'hose'].flatMap(product => ['mannequin', 'black', 'gray', 'beige', 'navy'].map(color => product + '_' + color + '_studio.png')));
if (photoManifest.version !== 1 || photoManifest.repository !== 'stephen6668/Chevalier-et-Roth-' || !/^(?:main|[a-f0-9]{40})$/.test(photoManifest.sourceRef) || !Array.isArray(photoManifest.photos) || photoManifest.photos.length !== requiredPhotoNames.size) throw new Error('Invalid studio-photo source manifest.');
const photoRef = photoManifest.sourceRef;
const photoOrigin = 'https://raw.githubusercontent.com/stephen6668/Chevalier-et-Roth-/' + photoRef;
const photoFiles = {};
let photoBytes = 0, verifiedPhotos = 0;
for (const photo of photoManifest.photos) {
 if (!requiredPhotoNames.has(photo.file)) throw new Error('Unexpected studio-photo filename.');
 const route = '/assets/gallery/' + photo.file;
 if (Object.hasOwn(photoFiles, route)) throw new Error('Duplicate studio-photo route.');
 const observed = photo.bytes !== undefined || photo.sha256 !== undefined || photo.git_blob_sha !== undefined;
 if (observed && (!Number.isSafeInteger(photo.bytes) || photo.bytes <= 0 || photo.bytes > 32 * 1024 * 1024 || !/^[a-f0-9]{64}$/.test(photo.sha256) || !/^[a-f0-9]{40}$/.test(photo.git_blob_sha))) throw new Error('Invalid observed studio-photo metadata.');
 // main can change after this build. Its response must use the upstream ETag,
 // rather than the hashes recorded when the six available PNGs were checked.
 photoFiles[route] = {sourcePath: '/' + photo.file, ...(photoRef !== 'main' && observed ? {bytes: photo.bytes, etag: '"' + photo.sha256 + '"'} : {})};
 if (observed) {photoBytes += photo.bytes;verifiedPhotos++;}
}

const mime = {
 '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
 '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8',
 '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.avif': 'image/avif',
 '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2'
};
const textExtensions = new Set(['.html', '.css', '.js', '.json', '.txt', '.md', '.svg']);
async function files(directory) {
 const result = [];
 for (const entry of await readdir(directory, {withFileTypes: true})) {
  if (entry.isSymbolicLink()) throw new Error('Symlinks cannot be embedded in the Worker.');
  const path = resolve(directory, entry.name);
  if (entry.isDirectory()) result.push(...await files(path));
  else if (entry.isFile()) result.push(path);
 }
 return result.sort();
}
const staticFiles = {}, modelFiles = {};
let staticBytes = 0, modelBytes = 0;
const runtimePaths = [];
for (const name of runtimeNames) {
 const path = resolve(sourceDirectory, name);
 if (await runtimeFile(path)) runtimePaths.push(path);
}
runtimePaths.push(...await files(resolve(sourceDirectory, 'assets')), ...await files(resolve(sourceDirectory, 'vendor')));
for (const path of runtimePaths.sort()) {
 const name = '/' + relative(sourceDirectory, path).replaceAll('\\', '/');
 if (name.split('/').some(part => part.startsWith('.'))) throw new Error('Hidden files cannot be embedded: ' + name);
 const bytes = await readFile(path), extension = extname(path).toLowerCase();
 const etag = '"' + createHash('sha256').update(bytes).digest('hex') + '"';
 if (Object.hasOwn(photoFiles, name)) {
  if (photoRef !== 'main' && (photoFiles[name].etag !== etag || photoFiles[name].bytes !== bytes.length)) throw new Error('A local studio PNG differs from its pinned original: ' + name);
  continue;
 }

 if (extension === '.glb') {
  if (!/^\/assets\/models\/(?:body|halfzip|trousers)-(?:bordeaux|black|gray|beige|navy)-studio\.glb$/.test(name)) throw new Error('Unexpected model asset: ' + name);
  modelFiles[name] = {bytes: bytes.length, etag}; modelBytes += bytes.length; continue;
 }
 const license = /\/LICENSE[-A-Za-z0-9.]*$/.test(name);
 if (!mime[extension] && !license) throw new Error('Unsupported asset type: ' + name);
 const binary = !textExtensions.has(extension) && !license;
 const body = bytes.toString(binary ? 'base64' : 'utf8');
 if (!binary && /\b(?:sk|rk)_(?:test|live)_[A-Za-z0-9]{20,}\b/.test(body)) throw new Error('A secret-like value was found in a public asset: ' + name);
 staticFiles[name] = {type: license ? 'text/plain; charset=utf-8' : mime[extension], bytes: bytes.length, etag, binary, body};
 staticBytes += bytes.length;
}
if (Object.keys(modelFiles).length !== 15) throw new Error('Expected all 15 optimized product models.');
for (const name of ['index.html', 'product.html', 'checkout.html']) {
 if (!staticFiles['/' + name]) throw new Error('Required storefront page is missing: ' + name);
}
// Fail the build if an HTML page references a missing local script, stylesheet,
// image or page, rather than publishing a partially copied runtime.
for (const [name, asset] of Object.entries(staticFiles)) {
 if (!name.endsWith('.html')) continue;
 for (const match of asset.body.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
  const target = match[1];
  if (target.startsWith('#')) continue;
  const url = new URL(target, 'https://runtime.invalid' + name);
  if (url.origin !== 'https://runtime.invalid') continue;
  const dependency = url.pathname === '/' ? '/index.html' : url.pathname;
  if (!Object.hasOwn(staticFiles, dependency) && !Object.hasOwn(modelFiles, dependency) && !Object.hasOwn(photoFiles, dependency)) {
   throw new Error('Missing local dependency in ' + name + ': ' + dependency);
  }
 }
}
const [router, stripe, manifestText] = await Promise.all([
 readFile(resolve(root, 'worker/index.mjs'), 'utf8'), readFile(resolve(root, 'worker/stripe.mjs'), 'utf8'), readFile(resolve(root, '.openai/hosting.json'), 'utf8')
]);
const manifest = JSON.parse(manifestText);
if (typeof manifest.project_id !== 'string' || !manifest.project_id) throw new Error('The existing Site identity is required.');
delete manifest.static;
const stripeSource = stripe.replace(/^export default handleStripeRequest;\s*$/m, '').replace(/^export async function handleStripeRequest/m, 'async function handleStripeRequest');
if (/^\s*import\s/m.test(stripeSource)) throw new Error('The Stripe handler must not have external imports.');
const routerSource = router.replace(/^import \{handleStripeRequest\} from '\.\/stripe\.mjs';\s*$/m, '');
const source = '// Generated from authored dist/ assets and worker modules. No runtime secrets are embedded.\n' +
 'const STATIC_FILES=' + JSON.stringify(staticFiles) + ';\n' +
 'const MODEL_FILES=' + JSON.stringify(modelFiles) + ';\n' +
 'const PHOTO_FILES=' + JSON.stringify(photoFiles) + ';\n' +
 'const PHOTO_SOURCE_ORIGIN=' + JSON.stringify(photoOrigin) + ';\n' +
 'const MODEL_SOURCE_ORIGIN=' + JSON.stringify(modelOrigin) + ';\n' + stripeSource + '\n' + routerSource;
const parsed = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
if (typeof parsed.default?.fetch !== 'function') throw new Error('The artifact must export default.fetch.');
const gzipBytes = gzipSync(source, {level: 9}).length;
if (gzipBytes > 3 * 1024 * 1024) throw new Error('The self-contained Worker exceeds the conservative 3 MiB compressed limit.');
await rm(output, {recursive: true, force: true});
await mkdir(resolve(output, 'server'), {recursive: true});
await mkdir(resolve(output, '.openai'), {recursive: true});
await writeFile(resolve(output, 'server/index.js'), source);
await writeFile(resolve(output, '.openai/hosting.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({sourceDirectory, output, workerBytes: Buffer.byteLength(source), gzipBytes, embeddedFiles: Object.keys(staticFiles).length, embeddedBytes: staticBytes, streamedModels: Object.keys(modelFiles).length, modelBytes, modelRef, streamedPhotos: Object.keys(photoFiles).length, verifiedPhotos, photoBytes, photoRef, project_id: manifest.project_id}));
