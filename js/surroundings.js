import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Atmospheric context only: no claim to reconstruct specific surrounding monuments.
const footprint={minX:-73,maxX:113,minZ:-47,maxZ:67};
let seed=8317;
function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
function height(x,z){
 const edge=Math.max(footprint.minX-x,x-footprint.maxX,footprint.minZ-z,z-footprint.maxZ,0);
 const ramp=THREE.MathUtils.smoothstep(edge,20,110);
 const hill=(cx,cz,sx,sz,h)=>h*Math.exp(-((x-cx)**2/sx**2+(z-cz)**2/sz**2));
 return -.15+ramp*(hill(-170,-100,100,105,25)+hill(190,130,130,95,30)+hill(10,-220,170,100,19));
}
function painted(geometry,color){
 const c=new THREE.Color(color),colors=new Float32Array(geometry.attributes.position.count*3);
 for(let i=0;i<colors.length;i+=3){colors[i]=c.r;colors[i+1]=c.g;colors[i+2]=c.b;}
 geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));return geometry;
}
function roofGeometry(w,d,rise){
 const x=w/2,z=d/2;
 const p=[[-x,0,-z],[x,0,-z],[x,0,z],[-x,0,z],[0,rise,-z],[0,rise,z]];
 const triangles=[0,3,5,0,5,4,4,5,2,4,2,1,0,4,1,3,2,5];
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(triangles.flatMap(i=>p[i]),3));geometry.computeVertexNormals();return geometry;
}
export function createSurroundings(){
 seed=8317;
 const group=new THREE.Group();group.name='Non-walkable Roman backdrop';
 const groundPositions=[],groundColors=[];
 const sand=new THREE.Color(0xc6bb9b),vegetation=new THREE.Color(0x83a982);
 for(let z=-310;z<310;z+=10)for(let x=-330;x<350;x+=10){
  // Leave the original model entirely uncovered, including its lowest surfaces.
  if(x+10>footprint.minX&&x<footprint.maxX&&z+10>footprint.minZ&&z<footprint.maxZ)continue;
  for(const [dx,dz] of [[0,0],[0,10],[10,0],[10,0],[0,10],[10,10]]){
   const xx=x+dx,zz=z+dz,h=height(xx,zz);groundPositions.push(xx,h,zz);
   const c=sand.clone().lerp(vegetation,Math.min(.65,Math.max(0,h/40)));groundColors.push(c.r,c.g,c.b);
  }
 }
 const groundGeometry=new THREE.BufferGeometry();groundGeometry.setAttribute('position',new THREE.Float32BufferAttribute(groundPositions,3));groundGeometry.setAttribute('color',new THREE.Float32BufferAttribute(groundColors,3));groundGeometry.computeVertexNormals();
 const ground=new THREE.Mesh(groundGeometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));ground.receiveShadow=true;group.add(ground);
 // Narrow apron matches the cut edge exactly; sits below the existing original ground.
 const apronParts=[];
 for(const [x,z,w,d] of [[20,-51.5,206,9],[20,71.5,206,9],[-77.5,10,9,114],[117.5,10,9,114]]){
  const plane=new THREE.PlaneGeometry(w,d);plane.rotateX(-Math.PI/2);plane.translate(x,-.16,z);apronParts.push(plane);
 }
 const apron=new THREE.Mesh(mergeGeometries(apronParts),new THREE.MeshStandardMaterial({color:0xc6bb9b,roughness:1}));apron.receiveShadow=true;group.add(apron);apronParts.forEach(g=>g.dispose());
 const geometries=[];let buildings=0;
 const wallColors=[0xebcda0,0xddbb96,0xf0d9b2,0xd6b18c,0xe5c398];
 const roofColors=[0xce7853,0xbd775c,0xc58467,0xd9936c];
 function building(x,z,w,d,h,angle){
  const y=height(x,z);
  const wall=painted(new THREE.BoxGeometry(w,h,d).toNonIndexed(),wallColors[Math.floor(random()*wallColors.length)]);
  wall.deleteAttribute('uv');
  wall.translate(0,h/2,0);wall.rotateY(angle);wall.translate(x,y,z);geometries.push(wall);
  const roof=painted(roofGeometry(w+.7,d+.7,w*.27),roofColors[Math.floor(random()*roofColors.length)]);
  roof.rotateY(angle);roof.translate(x,y+h,z);geometries.push(roof);
  buildings++;
 }
 for(let z=-223;z<=241;z+=24)for(let x=-249;x<=279;x+=24){
  if(x>-94&&x<134&&z>-68&&z<88)continue;
  // Gaps form alleys; paired wings suggest compact courtyard housing.
  if(random()<.13)continue;
  const xx=x+(random()-.5)*3,zz=z+(random()-.5)*3;
  const angle=(random()-.5)*.13;
  const h=5+random()*7;
  building(xx-6,zz,5.5+random()*2,14+random()*3,h,angle);
  building(xx+5,zz+4,5+random()*2,10+random()*3,h*.8,angle);
  if(random()>.4)building(xx,zz-7,7,5,h*.72,Math.PI/2+angle);
 }
 const architecture=new THREE.Mesh(mergeGeometries(geometries),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.96}));
 architecture.name='Courtyard houses and terracotta roofs';architecture.castShadow=false;architecture.receiveShadow=true;group.add(architecture);geometries.forEach(g=>g.dispose());
 // Horizon gradient, blended into the distance fog rather than a hard sky boundary.
 const skyGeometry=new THREE.SphereGeometry(410,32,18);
 const skyColors=[];const top=new THREE.Color(0x7eafd3),horizon=new THREE.Color(0xcbdde5);
 for(let i=0;i<skyGeometry.attributes.position.count;i++){
  const h=skyGeometry.attributes.position.getY(i)/410;
  const c=horizon.clone().lerp(top,THREE.MathUtils.smoothstep(h,.02,.8));skyColors.push(c.r,c.g,c.b);
 }
 skyGeometry.setAttribute('color',new THREE.Float32BufferAttribute(skyColors,3));
 const sky=new THREE.Mesh(skyGeometry,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,depthWrite:false,toneMapped:false}));sky.renderOrder=-1;group.add(sky);
 group.userData={buildings,triangles:architecture.geometry.attributes.position.count/3,walkable:false};
 return group;
}
