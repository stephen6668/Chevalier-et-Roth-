import * as THREE from 'three';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/loaders/GLTFLoader.js';
const root=document.querySelector('.cr-3d-showcase'),canvas=document.getElementById('cr3dCanvas');
if(root&&canvas){
const products=[
{id:'p1',name:'HERITAGE<br>HALF-ZIP',label:'Heritage Half-Zip',type:'MENSWEAR',description:'An expression of modern heritage. Discover the signature Half-Zip in deep Bordeaux.',image:'images/produkt1-bordo.jpg.png',files:['Chevalier_Roth_Halfzip_Bordeaux_Referenz.glb','chevalier-roth-halfzip-bordeaux.glb','halfzip.glb']},
{id:'p2',name:'TAILORED<br>TROUSER',label:'Tailored Trouser',type:'MENSWEAR',description:'Clean lines. Considered proportions. A contemporary wardrobe essential.',image:'images/produkt2-bordo.jpg',files:['tailored-trouser.glb','trouser.glb','produkt2.glb']},
{id:'p3',name:'MAISON<br>BODYSUIT',label:'Maison Bodysuit',type:'WOMENSWEAR',description:'A timeless silhouette, shaped by understated elegance.',image:'images/produkt3-bordo.jpg.png',files:['maison-bodysuit.glb','bodysuit.glb','produkt3.glb']}];
const status=document.getElementById('cr3dStatus'),fallback=document.getElementById('cr3dFallback'),fallbackImg=document.getElementById('cr3dFallbackImage');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let scene,camera,renderer,stage,active=0,angle=0,loading=0,dragStart=null,auto=true,modelReady=false,modelDims=null;
try{scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(32,1,.1,100);renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
scene.add(new THREE.HemisphereLight(0xffe7d6,0x28101a,2.15));
function light(color,intensity,x,y,z){const l=new THREE.DirectionalLight(color,intensity);l.position.set(x,y,z);scene.add(l)}
light(0xffe1bd,3.2,-4,6,7);light(0xe1a3a3,1.8,5,2,4);light(0xffd8aa,3.1,2,5,-5);
stage=new THREE.Group();scene.add(stage);camera.position.set(0,.12,8.5);
}catch(err){console.error('WebGL unavailable',err);canvas.hidden=true;}
const fabric=new THREE.MeshStandardMaterial({color:0x722638,roughness:.93,metalness:0,side:THREE.DoubleSide});
function setFallback(p,message){modelReady=false;fallback.hidden=false;fallbackImg.src=p.image;fallbackImg.alt=p.label+' in Bordeaux';status.textContent=message||'3D MODEL COMING SOON';status.hidden=false;canvas.style.opacity='0';}
function orient(model){model.updateMatrixWorld(true);let box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3());
// Most STL-to-GLB exports are Z-up. Rotate the garment upright only when Z is its dominant axis.
if(size.z>size.y*1.16&&size.z>size.x*1.12){model.rotation.x=-Math.PI/2;model.updateMatrixWorld(true);box=new THREE.Box3().setFromObject(model);size=box.getSize(new THREE.Vector3())}
const scale=3.75/Math.max(size.x,size.y,size.z,1e-6);model.scale.multiplyScalar(scale);model.updateMatrixWorld(true);box=new THREE.Box3().setFromObject(model);model.position.sub(box.getCenter(new THREE.Vector3()));model.updateMatrixWorld(true);
modelDims=new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());fitCamera();
}
function fitCamera(){if(!modelDims||!camera)return;const aspect=Math.max(.2,canvas.clientWidth/Math.max(canvas.clientHeight,1)),halfFov=THREE.MathUtils.degToRad(camera.fov)/2;const distance=Math.max(modelDims.y/(2*Math.tan(halfFov)),modelDims.x/(2*Math.tan(halfFov)*aspect))*1.38;camera.position.set(0,.12,Math.max(6,distance));camera.lookAt(0,0,0)}
function mount(g,token){if(token!==loading)return;stage.clear();const model=g.scene;model.traverse(o=>{if(o.isMesh){if(!o.material)o.material=fabric;o.material.side=THREE.DoubleSide;o.material.roughness=.92;o.material.metalness=0}});stage.add(model);orient(model);modelReady=true;fallback.hidden=true;canvas.style.opacity='1';status.hidden=true;angle=.18;}
async function loadModel(p,token){if(!renderer){setFallback(p,'3D PREVIEW UNAVAILABLE');return}for(const path of p.files){if(token!==loading)return;try{const response=await fetch(path,{cache:'default'});if(!response.ok)continue;const data=await response.arrayBuffer();if(token!==loading)return;const gltf=await new GLTFLoader().parseAsync(data,'');mount(gltf,token);return}catch(e){console.warn('3D candidate failed:',path,e)}}if(token===loading)setFallback(p,'3D MODEL COMING SOON');}
function select(index){active=(index+products.length)%products.length;const p=products[active],token=++loading;document.getElementById('cr3dTitle').innerHTML=p.name;document.getElementById('cr3dDescription').textContent=p.description;document.getElementById('cr3dProductNo').textContent=String(active+1).padStart(2,'0')+' / 03 — '+p.type;document.getElementById('cr3dProductLink').href='product.html?id='+p.id;document.getElementById('cr3dActiveLabel').textContent=String(active+1).padStart(2,'0');document.getElementById('cr3dTrackFill').style.width=(100*(active+1)/3)+'%';root.dataset.active=String(active);modelReady=false;status.hidden=false;status.textContent='LOADING 3D MODEL';canvas.style.opacity='0';fallback.hidden=true;loadModel(p,token);}
document.getElementById('cr3dPrev').addEventListener('click',()=>select(active-1));document.getElementById('cr3dNext').addEventListener('click',()=>select(active+1));
root.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();select(active-1)}if(e.key==='ArrowRight'){e.preventDefault();select(active+1)}});
root.addEventListener('pointerdown',e=>{if(e.target.closest('button,a'))return;dragStart={x:e.clientX,y:e.clientY}});root.addEventListener('pointerup',e=>{if(!dragStart)return;const dx=e.clientX-dragStart.x,dy=e.clientY-dragStart.y;dragStart=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.2)select(active+(dx<0?1:-1))});
function resize(){if(!renderer)return;const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();fitCamera()}if(renderer){new ResizeObserver(resize).observe(canvas);resize();let prev=performance.now();const clock=(now)=>{requestAnimationFrame(clock);const dt=Math.min(.05,(now-prev)/1000);prev=now;if(document.hidden||!modelReady)return;if(!reduced&&auto)angle+=dt*.20;stage.rotation.y=angle;renderer.render(scene,camera)};requestAnimationFrame(clock)}
select(0);
}
