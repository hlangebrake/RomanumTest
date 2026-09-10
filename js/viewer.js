import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {stickVector,displacement,cell,canMove} from './movement.js';
import {loadBakedLighting,setupLighting} from './lighting.js';
import {createSurroundings} from './surroundings.js';
import {populate} from './people.js';
import {createQuest} from './quest.js';
import {installViewport} from './viewport.js';
const viewport=installViewport();

const world=document.querySelector('#world'), loading=document.querySelector('#loading');
const progress=document.querySelector('#progress'),resetButton=document.querySelector('#reset');
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
world.append(renderer.domElement);
const scene=new THREE.Scene();setupLighting(renderer,scene);
const camera=new THREE.PerspectiveCamera(68,innerWidth/innerHeight,.08,700);camera.rotation.order='YXZ';
let nav,ready=false,yaw=0,pitch=0,last=0,drag=null,paused=false,inhabitants,nearby=null;
const quest=createQuest({restart:reset,pause:(value,id)=>{paused=value;releaseAll();document.body.classList.toggle('in-dialog',value);if(value)framePerson(id);},animate:(id,name)=>inhabitants?.animate(id,name)});
function framePerson(id){
 const person=inhabitants?.people.find(p=>p.id===id);if(!person)return;
 const away=new THREE.Vector2(camera.position.x-person.x,camera.position.z-person.z),distance=away.length();away.normalize();
 for(let d=distance;d<2.8;d+=.1){const x=camera.position.x+away.x*.1,z=camera.position.z+away.y*.1;if(!canMove(nav,camera.position.x,camera.position.z,x,z)||inhabitants.blocked(x,z))break;camera.position.x=x;camera.position.z=z;}
 camera.position.y=(cell(nav,camera.position.x,camera.position.z)?.height||0)+1.7;
 person.root.rotation.y=Math.atan2(camera.position.x-person.x,camera.position.z-person.z);
 yaw=Math.atan2(camera.position.x-person.x,camera.position.z-person.z)-(innerWidth>650?.3:0);pitch=-.13;camera.rotation.set(pitch,yaw,0);
}
const interact=document.querySelector('#interact'),labels=new Map();
interact.onclick=()=>{if(nearby)quest.open(nearby.id);};
const projected=new THREE.Vector3(),direction=new THREE.Vector3();
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
function reset(){if(!nav)return;releaseAll();const startX=quest.target==='sextus'?22.4:-6.85;camera.position.set(startX,cell(nav,startX,10.05).height+1.7,10.05);yaw=quest.target==='sextus'?1.89:Math.PI/2;pitch=-.04;camera.rotation.set(pitch,yaw,0);}
resetButton.onclick=()=>quest.startOver();
document.querySelector('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();}catch{}};
if(!document.documentElement.requestFullscreen)document.querySelector('#fullscreen').hidden=true;
document.addEventListener('contextmenu',e=>e.preventDefault());
for(const type of ['gesturestart','gesturechange','gestureend'])document.addEventListener(type,e=>e.preventDefault(),{passive:false});
document.addEventListener('touchmove',e=>{if(e.touches.length>1)e.preventDefault();},{passive:false});
document.addEventListener('wheel',e=>{if(e.ctrlKey)e.preventDefault();},{passive:false});
document.querySelector('#retry').onclick=()=>location.reload();
addEventListener('keydown',e=>{if(paused||e.target.closest('textarea,input'))return;if(e.code==='KeyE'&&nearby){e.preventDefault();quest.open(nearby.id);return;}if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();keys.add(e.code);}});
addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',releaseAll);
document.addEventListener('visibilitychange',()=>{releaseAll();last=0;});
world.addEventListener('pointerdown',e=>{if(!ready||paused||drag)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};world.setPointerCapture(e.pointerId);});
world.addEventListener('pointermove',e=>{if(drag?.id!==e.pointerId)return;yaw-=(e.clientX-drag.x)*.004;pitch-=(e.clientY-drag.y)*.004;pitch=Math.max(-1.35,Math.min(1.35,pitch));drag.x=e.clientX;drag.y=e.clientY;});
for(const type of ['pointerup','pointercancel','lostpointercapture'])world.addEventListener(type,()=>drag=null);
addEventListener('resize',()=>{releaseAll();requestAnimationFrame(()=>{const {width,height}=viewport.size;camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height);});});
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;releaseAll();fail('Die 3D-Ansicht wurde unterbrochen. Bitte erneut laden.');});
function fail(message){loading.hidden=false;progress.textContent=message;loading.querySelector('strong').textContent='Ansicht nicht verfügbar';document.querySelector('.loader').hidden=true;document.querySelector('#retry').hidden=false;}
async function start(){
 try{
  const [gltf, navigation, applyBakedLighting]=await Promise.all([
   new GLTFLoader().loadAsync('./assets/models/forum-romanum.glb',event=>{if(event.total)progress.textContent=`Modell laden · ${Math.round(event.loaded/event.total*100)} %`;}),
   fetch('./assets/navigation.json').then(r=>{if(!r.ok)throw Error('Navigation');return r.json();}),
   loadBakedLighting()
  ]);
  nav=navigation;
  const materials=new Set();
  gltf.scene.traverse(object=>{if(object.isMesh){object.frustumCulled=true;object.castShadow=true;object.receiveShadow=true;const mats=Array.isArray(object.material)?object.material:[object.material];for(const mat of mats){materials.add(mat);if(mat.map)mat.map.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());}}});
  materials.forEach(applyBakedLighting);
  scene.add(gltf.scene,createSurroundings());reset();progress.textContent='Die Menschen auf dem Forum kommen an …';inhabitants=await populate(scene,nav);progress.textContent='Gleich geht es los …';await renderer.compileAsync(scene,camera);
  renderer.shadowMap.needsUpdate=true;renderer.render(scene,camera);
  for(const person of inhabitants.people){const marker=document.createElement('div');marker.className='person-marker';marker.hidden=true;document.body.append(marker);labels.set(person.id,marker);}
  ready=true;resetButton.disabled=false;document.querySelector('#journal').disabled=false;loading.hidden=true;
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
  if(canMove(nav,camera.position.x,camera.position.z,camera.position.x+delta.x,camera.position.z)&&!inhabitants.blocked(camera.position.x+delta.x,camera.position.z))camera.position.x+=delta.x;
  if(canMove(nav,camera.position.x,camera.position.z,camera.position.x,camera.position.z+delta.z)&&!inhabitants.blocked(camera.position.x,camera.position.z+delta.z))camera.position.z+=delta.z;
  const ground=cell(nav,camera.position.x,camera.position.z);if(ground)camera.position.y+=(ground.height+1.7-camera.position.y)*(1-Math.exp(-12*dt));
  if(++frames<240){if(dt>.035)slow++;if(frames===180&&slow>70){renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);}}
 }
 if(ready){
  inhabitants.update(paused?0:dt,camera);
  const target=inhabitants.people.find(p=>p.id===quest.target);
  camera.getWorldDirection(direction);
  const candidates=inhabitants.people.map(p=>({p,d:Math.hypot(p.x-camera.position.x,p.z-camera.position.z)})).filter(({p,d})=>d<3&&direction.dot(new THREE.Vector3(p.x-camera.position.x,0,p.z-camera.position.z).normalize())>.45).sort((a,b)=>a.d-b.d);
  nearby=candidates[0]?.p||null;interact.hidden=!nearby||paused;
  if(nearby)interact.textContent=`Mit ${nearby.name} sprechen`;
  const distance=Math.hypot(target.x-camera.position.x,target.z-camera.position.z);
  document.querySelector('#objective-distance').textContent=quest.done?'✓':`${target.name} · ${Math.round(distance)} m`;
  const angle=Math.atan2(target.x-camera.position.x,-(target.z-camera.position.z))+yaw;
  document.querySelector('#direction-arrow').style.transform=`rotate(${angle}rad)`;
  for(const person of inhabitants.people){const marker=labels.get(person.id),isTarget=person.id===quest.target&&!quest.done;
   projected.copy(person.root.position);projected.y+=2.05;projected.project(camera);
   marker.hidden=paused||(!isTarget&&person.root.position.distanceTo(camera.position)>18)||projected.z>1||projected.z< -1||Math.abs(projected.x)>.94||Math.abs(projected.y)>.78;
   marker.style.left=`${(projected.x*.5+.5)*100}%`;marker.style.top=`${(-projected.y*.5+.5)*100}%`;
   marker.textContent=`${isTarget?'◆ ':''}${person.name}`;
  }
 }
 renderer.render(scene,camera);
}
requestAnimationFrame(frame);start();



