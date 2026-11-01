import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/loaders/GLTFLoader.js';
import {STLLoader} from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/loaders/STLLoader.js';
const canvas=document.getElementById('cr3dCanvas'),status=document.getElementById('cr3dStatus');
if(canvas){const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(30,1,.1,100),renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
scene.add(new THREE.HemisphereLight(0xc6d7f8,0x121622,2.1));
const key=new THREE.SpotLight(0xffe8d7,100,20,Math.PI/5,.65);key.position.set(-3,7,7);scene.add(key);
const fill=new THREE.DirectionalLight(0xa9c8ff,3);fill.position.set(5,1,3);scene.add(fill);
const rim=new THREE.DirectionalLight(0xc8d5ff,4);rim.position.set(1,4,-5);scene.add(rim);
const stage=new THREE.Group();scene.add(stage);camera.position.set(0,0,9);
const fabric=new THREE.MeshStandardMaterial({color:0x713047,metalness:0,roughness:.93,side:THREE.DoubleSide});
function mount(model){stage.clear();stage.add(model);model.updateMatrixWorld(true);let bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),longest=Math.max(size.x,size.y,size.z)||1;model.scale.multiplyScalar(4.1/longest);model.updateMatrixWorld(true);bounds=new THREE.Box3().setFromObject(model);model.position.sub(bounds.getCenter(new THREE.Vector3()));status.hidden=true;}
function parse(file,bytes){if(file.toLowerCase().endsWith('.stl')){const geo=new STLLoader().parse(bytes);geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,fabric);mesh.rotation.x=-Math.PI/2;mount(mesh)}else{new GLTFLoader().parse(bytes,'',g=>{mount(g.scene)},e=>{console.error(e);status.textContent='3D-MODELL KONNTE NICHT GELADEN WERDEN'})}}
async function load(){const candidates=['halfzip.glb','chevalier-roth-halfzip-bordeaux.glb','chevalier-roth-product-model.glb','models/halfzip.glb','halfzip.stl','remeshy_print_1793551640141.stl'];for(const path of candidates){try{const r=await fetch(path);if(!r.ok)continue;parse(path,await r.arrayBuffer());return}catch(e){console.warn(path,e)}}status.textContent='3D-DATEI AUSWÄHLEN ↑';}
document.getElementById('cr3dUpload')?.addEventListener('change',async e=>{const f=e.target.files?.[0];if(f)try{parse(f.name,await f.arrayBuffer())}catch(err){console.error(err);status.textContent='DATEI KONNTE NICHT GELESEN WERDEN'}});
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches,clock=new THREE.Clock();let angle=.24;
function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();camera.position.z=w<700?11.5:9;}
new ResizeObserver(resize).observe(canvas);
let running=true;const observer=new IntersectionObserver(entries=>{running=entries[0]?.isIntersecting??true},{threshold:0});observer.observe(canvas);
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);if(!running)return;if(!reduced)angle+=dt*.22;stage.rotation.y=angle;stage.rotation.x=.015;renderer.render(scene,camera)}resize();animate();load();
}
