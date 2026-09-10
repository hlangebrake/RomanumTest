import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createItineraries,advanceWalker} from '../js/crowd-paths.js';
import {canMove} from '../js/movement.js';
const nav=JSON.parse(readFileSync(new URL('../assets/navigation.json',import.meta.url)));
const plan=JSON.parse(readFileSync(new URL('../assets/background/placement.json',import.meta.url)));
const paths=createItineraries(nav,plan);
test('Background circuits and excursions use valid navigation and keep story areas clear',()=>{
 for(const path of paths)for(let i=0;i<path.length;i++){
  const a=path[i],b=path[(i+1)%path.length];
  assert.ok(canMove(nav,a[0],a[2],b[0],b[2]),`Invalid edge ${a} -> ${b}`);
  assert.ok(plan.reserved_story_areas.every(r=>Math.hypot(a[0]-r.x,a[2]-r.z)>=r.radius-.001));
  assert.ok(plan.placements.every(p=>!p.collision_radius||Math.hypot(a[0]-p.viewer_xyz[0],a[2]-p.viewer_xyz[2])>=p.collision_radius+.39));
 }
});
test('Walkers finish excursions and return without jumping or getting stuck',()=>{
 for(const path of paths){
  const p={path,x:path[0][0],y:path[0][1],z:path[0][2],next:1,speed:.52,pause:0,steps:0,pauseEvery:37};
  for(let i=0;i<18000;i++){
   const {x,z}=p;advanceWalker(p,.05);
   assert.ok(Math.hypot(p.x-x,p.z-z)<=.026001);
  }
  assert.ok(p.steps>path.length*2);
  const before=[p.x,p.z];advanceWalker(p,.05,true);assert.deepEqual([p.x,p.z],before);
 }
});
test('All background assets ship with the expected animations and distant variants',()=>{
 const files=new Set(plan.placements.map(p=>p.asset));
 for(const p of plan.pedestrians){files.add(p.asset);files.add(p.asset+'-lod1');}
 assert.equal(plan.pedestrians.length,12);
 for(const file of files){
  const bytes=readFileSync(new URL(`../assets/background/${file}.glb`,import.meta.url));
  const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
  if(file.startsWith('p'))assert.deepEqual(gltf.animations.map(a=>a.name).sort(),['idle','walk']);
 }
});
