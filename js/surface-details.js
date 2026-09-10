// Lightweight world-space material marks: no added geometry, images or UV seams.
export function surfaceKind(name=''){
 const key=name.split('·').at(-1).trim();
 if(key==='paving'||key==='basalt')return 1;
 if(['ivory','limestone','warmstone','rose','relief','accent'].includes(key))return 2;
 if(key==='brick')return 3;
 if(key==='terracotta')return 4;
 return 0;
}
export function addSurfaceDetails(material,shader){
 const kind=surfaceKind(material.name);if(!kind)return;
 shader.fragmentShader=`#define FORUM_SURFACE_KIND ${kind}
 float stoneHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float stoneNoise(vec2 p){
  vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
  return mix(mix(stoneHash(i),stoneHash(i+vec2(1.,0.)),f.x),mix(stoneHash(i+vec2(0.,1.)),stoneHash(i+vec2(1.,1.)),f.x),f.y);
 }
 float stoneSegment(vec2 p,vec2 a,vec2 b){vec2 v=b-a;return length(p-a-v*clamp(dot(p-a,v)/dot(v,v),0.0,1.0));}
 vec2 forumStoneDetail(vec3 world,vec3 worldNormal){
  vec3 n=abs(worldNormal);
  float horizontal=smoothstep(.65,.9,n.y);
  vec2 verticalUV=n.x>n.z?world.zy:world.xy;
  vec2 uv=mix(verticalUV,world.xz,horizontal);
  vec2 tileSize=mix(vec2(2.8,1.25),vec2(1.75,1.2),horizontal);
  float jointStrength=mix(.035,.12,horizontal);
  float variation=.055;
  #if FORUM_SURFACE_KIND == 3
   tileSize=vec2(.85,.42);jointStrength=.065;variation=.07;
  #elif FORUM_SURFACE_KIND == 4
   tileSize=vec2(.45,.72);jointStrength=.045;variation=.055;
  #endif
  vec2 grid=uv/tileSize;
  grid.x+=mod(floor(grid.y),2.0)*.5;
  vec2 tile=floor(grid),f=fract(grid),edge=min(f,1.0-f)*tileSize;
  float pixel=max(length(fwidth(uv)),.001);
  float joint=1.0-smoothstep(.007,.007+pixel*1.3,min(edge.x,edge.y));
  float h=stoneHash(tile+vec2(61.,17.));
  float detailFade=1.0-smoothstep(.045,.18,pixel);
  float tone=1.0+(h-.5)*variation;
  tone+=(stoneNoise(uv*.32)-.5)*.027;
  tone-=joint*jointStrength*detailFade;
  #if FORUM_SURFACE_KIND <= 2
   // Quiet, broad marble ribbons. Derivative fading prevents distant sparkle.
   float phase=uv.x*1.8+uv.y*.72+sin(uv.y*1.25)*.65+sin(uv.x*.47+uv.y*.8)*.8;
   float vein=smoothstep(.90,.995,sin(phase*3.1));
   tone-=vein*.037*detailFade;
   // Short hairline fissures near a few plate corners, never a crack on every tile.
   if(h>.965){
    vec2 p=f*tileSize;if(stoneHash(tile+9.)>.5)p.x=tileSize.x-p.x;
    float crack=min(stoneSegment(p,vec2(.025,.03),vec2(.11,.12)),stoneSegment(p,vec2(.11,.12),vec2(.085,.23)));
    float mark=1.0-smoothstep(.0025,.0025+pixel,crack);
    tone-=mark*.13*detailFade;
   }
  #endif
  return vec2(clamp(tone,.78,1.06),(h-.5)*.055);
 }
 `+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
  vec2 stoneDetail=forumStoneDetail(vBakedWorld,inverseTransformDirection(normal,viewMatrix));
  diffuseColor.rgb*=stoneDetail.x;
  roughnessFactor=clamp(roughnessFactor+stoneDetail.y,.35,1.0);`);
}
