import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {createItineraries,advanceWalker} from './crowd-paths.js';

export async function populateBackground(scene,nav){
 const response=await fetch('./assets/background/placement.json');
 if(!response.ok)throw Error('Background placement unavailable');
 const plan=await response.json(),loader=new GLTFLoader(),assets=new Map();
 const files=new Set(plan.placements.map(p=>p.asset));
 for(const p of plan.pedestrians){files.add(p.asset);files.add(p.asset+'-lod1');}
 await Promise.all([...files].map(async file=>assets.set(file,await loader.loadAsync(`./assets/background/${file}.glb`))));
 // The supplied assets all use the same atlas. Keep one material/texture on the GPU.
 let material;
 for(const gltf of assets.values())gltf.scene.traverse(o=>{
  if(!o.isMesh)return;
  if(!material)material=o.material;
  else if(o.material!==material){o.material.map?.dispose();o.material.dispose();o.material=material;}
  o.castShadow=false;o.receiveShadow=true;o.userData.interactive=false;
 });
 const obstacles=[];
 for(const item of plan.placements){
  const root=assets.get(item.asset).scene.clone();root.position.fromArray(item.viewer_xyz);root.rotation.y=item.rotation_z;
  root.traverse(o=>{if(o.isMesh)o.castShadow=true;});scene.add(root);
  if(item.collision_radius)obstacles.push({x:item.viewer_xyz[0],z:item.viewer_xyz[2],r:item.collision_radius});
 }
 const paths=createItineraries(nav,plan),shadowGeometry=new THREE.CircleGeometry(.31,16);
 const shadowMaterial=new THREE.MeshBasicMaterial({color:0x38291d,transparent:true,opacity:.15,depthWrite:false});
 const walkers=plan.pedestrians.map((data,i)=>{
  const routeIndex=plan.routes.findIndex(r=>r.id===data.route_id),path=paths[routeIndex];
  // Spread the initial population over its home circuit, not just at its entrance.
  const start=Math.floor(data.start_fraction*(plan.routes[routeIndex].viewer_points.length-1));
  const [x,y,z]=path[start],group=new THREE.Group();scene.add(group);
  const variants=[data.asset,data.asset+'-lod1'].map(file=>{
   const gltf=assets.get(file),root=clone(gltf.scene),mixer=new THREE.AnimationMixer(root);
   const actions=Object.fromEntries(gltf.animations.map(clip=>[clip.name,mixer.clipAction(clip)]));
   actions.walk.setEffectiveTimeScale(data.speed_units_s/.52).play();group.add(root);
   return {root,mixer,actions};
  });
  const shadow=new THREE.Mesh(shadowGeometry,shadowMaterial);shadow.rotation.x=-Math.PI/2;scene.add(shadow);
  const p={x,y,z,path,next:start+1,speed:data.speed_units_s,heading:0,steps:i*7,pause:0,pauseEvery:31+i*3,group,variants,shadow,clock:i*.37,lod:-1,walking:true,animationDt:0,waiting:0};
  group.position.set(x,y,z);return p;
 });
 return {
  blocked(x,z){return obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<o.r+.22);},
  update(dt,camera){
   for(let i=0;i<walkers.length;i++){
    const p=walkers[i],target=p.path[p.next],dx=target[0]-p.x,dz=target[2]-p.z;
    const distance=Math.hypot(camera.position.x-p.x,camera.position.z-p.z);
    // Yield to the player; same-direction pedestrians keep a small following gap.
    const stop=distance<1.05||walkers.some((q,j)=>i!==j&&Math.hypot(q.x-p.x,q.z-p.z)<.75&&(q.x-p.x)*dx+(q.z-p.z)*dz>.08);
    p.waiting=stop?p.waiting+dt:0;
    // On narrow paths, turn back after waiting instead of remaining in a deadlock.
    if(p.waiting>3+i*.17){p.next=(p.path.length-p.next)%p.path.length;p.path=p.path.slice().reverse();p.waiting=0;p.pause=.6;}
    const moving=advanceWalker(p,dt,stop);
    if(moving!==p.walking){for(const v of p.variants){v.actions[p.walking?'walk':'idle'].fadeOut(.3);v.actions[moving?'walk':'idle'].reset().fadeIn(.3).play();}p.walking=moving;}
    p.clock+=dt;p.animationDt+=dt;p.group.position.set(p.x,p.y,p.z);
    const turn=Math.atan2(Math.sin(p.heading-p.group.rotation.y),Math.cos(p.heading-p.group.rotation.y));
    p.group.rotation.y+=turn*Math.min(1,dt*7);
    p.group.visible=distance<58;p.shadow.visible=distance<24;
    p.shadow.position.set(p.x,p.y+.025,p.z);
    const lod=distance>14?1:0;
    if(lod!==p.lod){p.variants.forEach((v,k)=>{v.root.visible=k===lod;});p.variants[lod].mixer.setTime(p.clock);p.lod=lod;}
    if(p.group.visible&&(lod===0||p.animationDt>.1)){p.variants[lod].mixer.update(p.animationDt);p.animationDt=0;}
    if(!p.group.visible)p.animationDt=0;
   }
  }
 };
}
