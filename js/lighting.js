import * as THREE from 'three';
import {addSurfaceDetails,surfaceKind} from './surface-details.js';

export async function loadBakedLighting(){
 const [meta,data]=await Promise.all([
  fetch('./assets/lighting/sky-visibility.json').then(r=>{if(!r.ok)throw Error('Lighting metadata');return r.json();}),
  fetch('./assets/lighting/sky-visibility.bin').then(r=>{if(!r.ok)throw Error('Lighting data');return r.arrayBuffer();})
 ]);
 const [x,y,z]=meta.dimensions;
 if(data.byteLength!==x*y*z)throw Error('Invalid baked lighting size');
 const texture=new THREE.Data3DTexture(new Uint8Array(data),x,y,z);
 texture.format=THREE.RedFormat;texture.type=THREE.UnsignedByteType;
 texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.unpackAlignment=1;texture.needsUpdate=true;
 const uniforms={bakedSky:{value:texture},bakedOrigin:{value:new THREE.Vector3(...meta.origin)},bakedSize:{value:new THREE.Vector3(...meta.size)},bakedDimensions:{value:new THREE.Vector3(x,y,z)}};
 return material=>{
  if(!material.isMeshStandardMaterial)return;
  material.onBeforeCompile=shader=>{
   Object.assign(shader.uniforms,uniforms);
   shader.vertexShader='varying vec3 vBakedWorld;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
    vec4 bakePosition = vec4(transformed, 1.0);
    #ifdef USE_INSTANCING
      bakePosition = instanceMatrix * bakePosition;
    #endif
    vBakedWorld = (modelMatrix * bakePosition).xyz;`);
   shader.fragmentShader=`uniform highp sampler3D bakedSky;
    uniform vec3 bakedOrigin;
    uniform vec3 bakedSize;
    uniform vec3 bakedDimensions;
    varying vec3 vBakedWorld;\n`+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <aomap_fragment>',`#include <aomap_fragment>
    vec3 bakeNormal = inverseTransformDirection(normal, viewMatrix);
    vec3 bakeUV = (vBakedWorld + bakeNormal * 0.8 - bakedOrigin) / bakedSize;
    float bakeInside = float(all(greaterThanEqual(bakeUV, vec3(0.0))) && all(lessThanEqual(bakeUV, vec3(1.0))));
    bakeUV = (clamp(bakeUV, 0.0, 1.0) * (bakedDimensions - 1.0) + 0.5) / bakedDimensions;
    float skyVisibility = texture(bakedSky, bakeUV).r;
    float bakedAmbient = mix(1.0, mix(0.40, 1.0, skyVisibility), bakeInside);
    reflectedLight.indirectDiffuse *= bakedAmbient;
    reflectedLight.indirectSpecular *= bakedAmbient;`);
   addSurfaceDetails(material,shader);
  };
  material.customProgramCacheKey=()=> 'forum-cartoon-surface-v3-'+surfaceKind(material.name);material.needsUpdate=true;
 };
}

export function setupLighting(renderer,scene){
 renderer.toneMappingExposure=1.06;
 // Prefilter once at load. VSM avoids the widely spaced PCF tap pattern at soft edges.
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.VSMShadowMap;
 renderer.shadowMap.autoUpdate=false;
 scene.background=new THREE.Color(0xcbdde5);
 scene.fog=new THREE.FogExp2(0xcbdde5,0.0032);
 scene.add(new THREE.HemisphereLight(0xd7eaff,0xc6a17e,1.05));
 const sun=new THREE.DirectionalLight(0xffe8c8,2.25);
 sun.position.set(-55,105,60);sun.target.position.set(20,0,9);
 sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
 Object.assign(sun.shadow.camera,{left:-126,right:126,top:100,bottom:-100,near:1,far:300});
 sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.00012;sun.shadow.normalBias=.06;
 sun.shadow.radius=3.0;sun.shadow.blurSamples=8;
 scene.add(sun,sun.target);
 return sun;
}
