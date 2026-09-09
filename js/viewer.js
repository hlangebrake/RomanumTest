import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {stickVector,displacement,cell,canMove} from './movement.js';

const world=document.querySelector('#world'), loading=document.querySelector('#loading');
const progress=document.querySelector('#progress'),resetButton=document.querySelector('#reset');
const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
world.append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0xb9d1df);scene.fog=new THREE.Fog(0xb9d1df,180,390);
const camera=new THREE.PerspectiveCamera(68,innerWidth/innerHeight,.08,450);camera.rotation.order='YXZ';
scene.add(new THREE.HemisphereLight(0xe9f5ff,0x918370,2.4));
const sun=new THREE.DirectionalLight(0xffedcf,2.4);sun.position.set(45,100,35);scene.add(sun);
let nav,ready=false,yaw=0,pitch=0,last=0,drag=null,paused=false;
const keys=new Set(),sticks=[];
const state={move:{x:0,y:0},look:{x:0,y:0}};
function releaseAll(){keys.clear();drag=null;for(const stick of sticks)stick.reset();}
function joystick(id){
 const element=document.getElementById(id),knob=element.querySelector('.knob');let pointer=null;
 const reset=()=>{pointer=null;state[id]={x:0,y:0};knob.style.transform='';element.classList.remove('active');};
 const update=e=>{const r=element.getBoundingClientRect(),radius=r.width*.34,dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2;
  state[id]=stickVector(dx,dy,radius);const length=Math.hypot(dx,dy),factor=length>radius?radius/length:1;
  knob.style.transform=`translate(${dx*factor}px,${dy*factor}px)`;};
 element.addEventListener('pointerdown',e=>{if(pointer!==null||!ready||paused)return;e.preventDefault();pointer=e.pointerId;element.setPointerCapture(pointer);element.classList.add('active');update(e);});
 element.addEventListener('pointermove',e=>{if(e.pointerId===pointer){e.preventDefault();update(e);}});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(event,e=>{if(e.pointerId===pointer)reset();});
 sticks.push({reset});
}
joystick('move');joystick('look');
function reset(){if(!nav)return;releaseAll();camera.position.set(20,cell(nav,20,10).height+1.7,10);yaw=Math.PI*.52;pitch=0;camera.rotation.set(pitch,yaw,0);}
resetButton.onclick=reset;
const help=document.querySelector('#help'),instructions=document.querySelector('#instructions');
function showHelp(value){instructions.hidden=!value;help.setAttribute('aria-expanded',String(value));paused=value;releaseAll();if(value)document.querySelector('#close-help').focus();else help.focus();}
help.onclick=()=>showHelp(instructions.hidden);document.querySelector('#close-help').onclick=()=>showHelp(false);
document.querySelector('#retry').onclick=()=>location.reload();
addEventListener('keydown',e=>{if(e.code==='Escape'){showHelp(false);return;}if(e.target.closest('button'))return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();keys.add(e.code);}});
addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',releaseAll);
document.addEventListener('visibilitychange',()=>{releaseAll();last=0;});
world.addEventListener('pointerdown',e=>{if(!ready||paused||e.pointerType==='touch')return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};world.setPointerCapture(e.pointerId);});
world.addEventListener('pointermove',e=>{if(drag?.id!==e.pointerId)return;yaw-=(e.clientX-drag.x)*.004;pitch-=(e.clientY-drag.y)*.004;pitch=Math.max(-1.35,Math.min(1.35,pitch));drag.x=e.clientX;drag.y=e.clientY;});
for(const type of ['pointerup','pointercancel','lostpointercapture'])world.addEventListener(type,()=>drag=null);
addEventListener('resize',()=>{releaseAll();camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;releaseAll();fail('Die 3D-Ansicht wurde unterbrochen. Bitte erneut laden.');});
function fail(message){loading.hidden=false;progress.textContent=message;loading.querySelector('strong').textContent='Ansicht nicht verfügbar';document.querySelector('.loader').hidden=true;document.querySelector('#retry').hidden=false;}
async function start(){
 try{
  const [gltf, navigation]=await Promise.all([
   new GLTFLoader().loadAsync('./assets/models/forum-romanum.glb',event=>{if(event.total)progress.textContent=`Modell laden · ${Math.round(event.loaded/event.total*100)} %`;}),
   fetch('./assets/navigation.json').then(r=>{if(!r.ok)throw Error('Navigation');return r.json();})
  ]);
  nav=navigation;
  gltf.scene.traverse(object=>{if(object.isMesh){object.frustumCulled=true;const mats=Array.isArray(object.material)?object.material:[object.material];for(const mat of mats){if(mat.map)mat.map.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());}}});
  scene.add(gltf.scene);reset();progress.textContent='Ansicht vorbereiten …';await renderer.compileAsync(scene,camera);
  ready=true;resetButton.disabled=false;loading.hidden=true;
 }catch(error){console.error(error);fail('Modell konnte nicht geladen werden. Prüfe die Verbindung und versuche es erneut.');}
}
let slow=0,frames=0;
function frame(now){
 requestAnimationFrame(frame);const dt=last?Math.min((now-last)/1000,.05):0;last=now;
 if(document.hidden)return;
 if(ready&&!paused){
  yaw-=(state.look.x+(keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0))*1.6*dt;
  pitch-=(state.look.y+(keys.has('ArrowDown')?1:0)-(keys.has('ArrowUp')?1:0))*1.25*dt;
  pitch=Math.max(-1.35,Math.min(1.35,pitch));camera.rotation.set(pitch,yaw,0);
  const x=state.move.x+(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),y=state.move.y+(keys.has('KeyS')?1:0)-(keys.has('KeyW')?1:0);
  const delta=displacement(x,y,yaw,4.5,dt);
  if(canMove(nav,camera.position.x,camera.position.z,camera.position.x+delta.x,camera.position.z))camera.position.x+=delta.x;
  if(canMove(nav,camera.position.x,camera.position.z,camera.position.x,camera.position.z+delta.z))camera.position.z+=delta.z;
  const ground=cell(nav,camera.position.x,camera.position.z);if(ground)camera.position.y+=(ground.height+1.7-camera.position.y)*(1-Math.exp(-12*dt));
  if(++frames<240){if(dt>.035)slow++;if(frames===180&&slow>70){renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);}}
 }
 renderer.render(scene,camera);
}
requestAnimationFrame(frame);start();
