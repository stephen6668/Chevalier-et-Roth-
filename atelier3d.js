import * as THREE from 'three';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/loaders/GLTFLoader.js';
const box=document.getElementById('viewer'),status=document.getElementById('modelStatus'),progress=document.getElementById('loadProgress');
const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(34,1,.01,100);camera.position.set(0,.18,7.8);
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;box.prepend(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xc7d5ec,0x1d1017,2.1));const light=(color,intensity,x,y,z)=>{const l=new THREE.DirectionalLight(color,intensity);l.position.set(x,y,z);scene.add(l)};light(0xffe8da,3.8,-3,5,5);light(0xb3caff,2.2,4,2,1);light(0xe1adbf,3,0,4,-4);
const group=new THREE.Group();scene.add(group);let current=null,auto=true,angle=.25,last=performance.now(),dragging=false,lastX=0;
const fabric=new THREE.MeshStandardMaterial({color:0x692335,roughness:.94,metalness:0,side:THREE.DoubleSide});
function mount(model){if(current){group.remove(current);current.traverse(o=>{if(o.isMesh){o.geometry?.dispose();if(o.material&&o.material!==fabric){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose?.())}}})}
current=model;model.traverse(o=>{if(o.isMesh){o.material=fabric;o.castShadow=true;o.receiveShadow=true}});group.add(model);
model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model),sz=bounds.getSize(new THREE.Vector3()),m=Math.max(sz.x,sz.y,sz.z)||1;model.scale.multiplyScalar(3.45/m);model.updateMatrixWorld(true);const center=new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());model.position.sub(center);model.updateMatrixWorld(true);
const newSize=new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());const aspect=box.clientWidth/Math.max(1,box.clientHeight);const vertical=THREE.MathUtils.degToRad(camera.fov);const distance=Math.max(newSize.y/(2*Math.tan(vertical/2)),newSize.x/(2*Math.tan(vertical/2)*aspect))*1.48;camera.position.set(0,.12,Math.max(5.2,distance));camera.lookAt(0,0,0);status.textContent='BORDEAUX · 3D ORIGINALMODELL';progress.hidden=true;}
function load(url){status.textContent='3D-MODELL WIRD GELADEN …';new GLTFLoader().load(url,g=>mount(g.scene),e=>{if(e.total)status.textContent='LÄDT '+Math.round(e.loaded/e.total*100)+' %'},e=>{console.error(e);status.textContent='MODELL KONNTE NICHT GELADEN WERDEN';progress.hidden=true})}
load('chevalier-roth-halfzip-bordeaux.glb');
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
function resize(){const w=box.clientWidth,h=box.clientHeight;if(w&&h){camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false)}}new ResizeObserver(resize).observe(box);resize();
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;if(!reduced&&auto&&!dragging)angle+=dt*.28;group.rotation.y=angle;group.rotation.x=.035;renderer.render(scene,camera)}requestAnimationFrame(frame);
box.addEventListener('pointerdown',e=>{if(e.target.closest('a,button'))return;dragging=true;auto=false;lastX=e.clientX;box.setPointerCapture(e.pointerId)});box.addEventListener('pointermove',e=>{if(!dragging)return;angle+=(e.clientX-lastX)*.009;lastX=e.clientX});box.addEventListener('pointerup',()=>dragging=false);box.addEventListener('pointercancel',()=>dragging=false);
document.getElementById('spinToggle')?.addEventListener('click',e=>{auto=!auto;e.currentTarget.textContent=auto?'PAUSIEREN II':'AUTO-DREHUNG ▶'});
document.getElementById('resetView')?.addEventListener('click',()=>{angle=.25;auto=true;document.getElementById('spinToggle').textContent='PAUSIEREN II'});
document.addEventListener('visibilitychange',()=>{last=performance.now()});
