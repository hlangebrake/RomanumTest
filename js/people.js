import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {cell} from './movement.js';
import {populateBackground} from './crowd.js';

export const cast=[
 {id:'livia',file:'02-livia',name:'Livia',x:-12.05,z:10.05,rotation:Math.PI/2},
 {id:'flavia',file:'03-flavia',name:'Flavia',x:-12.05,z:13.3,rotation:Math.PI/2},
 {id:'sextus',file:'01-sextus',name:'Sextus',x:18.5,z:11.35,rotation:Math.PI/2},
 {id:'dama',file:'04-dama',name:'Dama',x:-12.7,z:-8.15,rotation:0},
 {id:'aulus',file:'05-aulus',name:'Aulus',x:32.15,z:-6.85,rotation:Math.PI},
 {id:'marcus',file:'06-marcus',name:'Marcus',x:30.2,z:-5.5,rotation:-Math.PI/2},
 {id:'rufus',file:'07-rufus',name:'Rufus',x:-17.9,z:2.25,rotation:Math.PI/2}
];
export async function populate(scene,nav){
 const loader=new GLTFLoader(),people=[],obstacles=[];
 function shadow(x,z,r){const mesh=new THREE.Mesh(new THREE.CircleGeometry(r,24),new THREE.MeshBasicMaterial({color:0x38291d,transparent:true,opacity:.17,depthWrite:false}));mesh.rotation.x=-Math.PI/2;mesh.position.set(x,(cell(nav,x,z)?.height||0)+.025,z);scene.add(mesh);}
 await Promise.all(cast.map(async data=>{
  const gltf=await loader.loadAsync(`./assets/people/${data.file}-animiert.glb`),root=gltf.scene;
  root.position.set(data.x,cell(nav,data.x,data.z)?.height||0,data.z);root.rotation.y=data.rotation;
  root.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;}});
  scene.add(root);shadow(data.x,data.z,.46);obstacles.push({x:data.x,z:data.z,r:.48});
  const mixer=new THREE.AnimationMixer(root),actions=Object.fromEntries(gltf.animations.map(c=>[c.name,mixer.clipAction(c)]));
  actions.idle?.play();mixer.update(Math.random()*4);
  people.push({...data,root,mixer,actions,current:'idle',timer:0});
 }));
 const props=[
  ['08-schreibtisch',-12.05,11.35,0],['17-kiste-offen',-13.35,10.05,0],['16-kiste-geschlossen',-13.35,11.35,0],
  ['18-amphore',-12.4,11.35,.81],['20-schale',-11.8,11.35,.81],['20-schale',-11.65,11.55,.81],
  ['21-stoffpaket-rot',-13.35,12.1,0],['22-stoffpaket-gruen',-13.9,12.1,0],
  ['08-schreibtisch',18.5,12.65,0],['10-wachstafel-offen',18.5,12.65,.81],['09-hocker',19.8,12.65,0]
 ];
 await Promise.all(props.map(async([file,x,z,up])=>{const {scene:root}=await loader.loadAsync(`./assets/props/${file}.glb`);root.position.set(x,(cell(nav,x,z)?.height||0)+up,z);root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(root);if(!up)obstacles.push({x,z,r:file.includes('schreibtisch')?.68:.38});}));
 function animate(id,name){const p=people.find(p=>p.id===id);if(!p||!p.actions[name]||p.current===name)return;p.actions[p.current]?.fadeOut(.25);p.actions[name].reset().fadeIn(.25).play();p.current=name;p.timer=['nod','doubt','greet'].includes(name)?4:0;}
 const background=await populateBackground(scene,nav);
 return {people,animate,
  blocked(x,z){return background.blocked(x,z)||obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<o.r+.22);},
  update(dt,camera){background.update(dt,camera);people.forEach(p=>{const distance=p.root.position.distanceTo(camera.position);p.root.visible=distance<65;if(distance<35){p.mixer.update(dt);if(p.timer>0){p.timer-=dt;if(p.timer<=0)animate(p.id,'idle');}}});}
 };
}
