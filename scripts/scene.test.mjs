import {test} from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../../node_modules/three/build/three.module.js';
import {createSurroundings} from '../js/surroundings.js';
import {loadBakedLighting,setupLighting} from '../js/lighting.js';
import {surfaceKind} from '../js/surface-details.js';

test('Low-poly backdrop has finite geometry and remains outside navigation',()=>{
 const group=createSurroundings();assert.equal(group.userData.walkable,false);assert.ok(group.userData.triangles<30000);assert.ok(group.userData.buildings>100);
 const architecture=group.children.find(o=>o.name==='Courtyard houses and terracotta roofs');
 const p=architecture.geometry.attributes.position;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i);assert.ok(Number.isFinite(x+y+z));
  assert.ok(x < -73 || x >113 || z < -47 || z >67,'Backdrop must not intersect the original bounds');
 }
 console.log('Backdrop:',group.userData);
 group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
});
test('Baked lighting is complete, contains occlusion, and supports instanced materials',async()=>{
 const originalFetch=globalThis.fetch;
 globalThis.fetch=async url=>{const data=await readFile(new URL('../'+String(url).replace('./',''),import.meta.url));return {ok:true,json:async()=>JSON.parse(data),arrayBuffer:async()=>data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)};};
 try{
  const apply=await loadBakedLighting();const material=new THREE.MeshStandardMaterial();material.name='Cartoon · paving';apply(material);
  const shader={uniforms:{},vertexShader:THREE.ShaderLib.standard.vertexShader,fragmentShader:THREE.ShaderLib.standard.fragmentShader};material.onBeforeCompile(shader);
  const data=shader.uniforms.bakedSky.value.image.data;
  assert.ok(data.some(v=>v<50));assert.ok(data.some(v=>v>240));assert.equal(data.length,128*22*81);
  assert.ok(shader.vertexShader.includes('instanceMatrix * bakePosition'));
  assert.ok(shader.fragmentShader.includes('reflectedLight.indirectDiffuse *= bakedAmbient'));
  assert.ok(shader.fragmentShader.includes('#include <aomap_fragment>'));
  assert.ok(shader.fragmentShader.includes('forumStoneDetail(vBakedWorld'));
  assert.ok(shader.fragmentShader.indexOf('vec2 stoneDetail=')>shader.fragmentShader.indexOf('#include <normal_fragment_begin>'));
  const metal=new THREE.MeshStandardMaterial();metal.name='Cartoon · gold';apply(metal);
  assert.notEqual(metal.customProgramCacheKey(),material.customProgramCacheKey(),'Stone and metal must not reuse different shader sources under one cache key');
  assert.equal(surfaceKind(metal.name),0);assert.equal(surfaceKind('Cartoon · water'),0);
 }finally{globalThis.fetch=originalFetch;}
});
test('Shadows remain cached and fog is present at walking distances',()=>{
 const renderer={shadowMap:{}};const scene=new THREE.Scene();const sun=setupLighting(renderer,scene);
 assert.equal(renderer.shadowMap.autoUpdate,false);assert.equal(sun.castShadow,true);assert.equal(sun.shadow.mapSize.x,2048);
 assert.equal(renderer.shadowMap.type,THREE.VSMShadowMap);assert.equal(sun.shadow.blurSamples,8);
 assert.ok(scene.fog.isFogExp2);const fadeAt100=1-Math.exp(-((scene.fog.density*100)**2));assert.ok(fadeAt100>.05&&fadeAt100<.2);
});
