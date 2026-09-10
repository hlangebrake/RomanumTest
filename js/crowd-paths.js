import {cell,canMove} from './movement.js';

// All paths stay on the same reciprocal navigation edges as the player.
export function connectRoutes(nav,from,to,blocked){
 const start=cell(nav,from[0],from[2]),end=cell(nav,to[0],to[2]);
 if(!start||!end)return [];
 const parent=new Int32Array(nav.heights.length).fill(-1),queue=[start.index];parent[start.index]=start.index;
 const point=i=>[nav.x0+(i%nav.nx)*nav.step,nav.heights[i],nav.z0+Math.floor(i/nav.nx)*nav.step];
 for(let head=0;head<queue.length;head++){
  const i=queue[head];if(i===end.index)break;
  const a=point(i);
  for(const j of [i+1,i-1,i+nav.nx,i-nav.nx]){
   if(j<0||j>=parent.length||parent[j]!==-1||nav.heights[j]===null)continue;
   const b=point(j);
   if(blocked(b[0],b[2])||!canMove(nav,a[0],a[2],b[0],b[2]))continue;
   parent[j]=i;queue.push(j);
  }
 }
 if(parent[end.index]===-1)return [];
 const path=[];for(let i=end.index;;i=parent[i]){path.push(point(i));if(i===start.index)break;}
 return path.reverse();
}

export function createItineraries(nav,plan){
 const blocked=(x,z)=>plan.reserved_story_areas.some(a=>Math.hypot(x-a.x,z-a.z)<a.radius)
  ||plan.placements.some(a=>a.collision_radius>0&&Math.hypot(x-a.viewer_xyz[0],z-a.viewer_xyz[2])<a.collision_radius+.4);
 return plan.routes.map((route,i)=>{
  const home=route.viewer_points,away=plan.routes[(i+1)%plan.routes.length].viewer_points;
  const link=connectRoutes(nav,home[0],away[0],blocked);
  if(!link.length)throw Error(`No connecting path for ${route.id}`);
  // A familiar circuit, an excursion into another part of the forum, then back.
  return [...home,...link.slice(1),...away.slice(1),...link.slice().reverse().slice(1)];
 });
}

export function advanceWalker(p,dt,stop=false){
 if(p.pause>0){p.pause=Math.max(0,p.pause-dt);return false;}
 if(stop)return false;
 let remaining=p.speed*dt;
 while(remaining>0){
  const b=p.path[p.next],dx=b[0]-p.x,dz=b[2]-p.z,distance=Math.hypot(dx,dz);
  if(distance>0){const amount=Math.min(remaining,distance),t=amount/distance;
   p.x+=dx*t;p.z+=dz*t;p.y+=(b[1]-p.y)*t;p.heading=Math.atan2(dx,dz);remaining-=amount;
  }
  if(Math.hypot(b[0]-p.x,b[2]-p.z)<1e-7){
   p.next=(p.next+1)%p.path.length;p.steps++;
   if(p.steps%p.pauseEvery===0){p.pause=2+(p.steps%5);break;}
  }else break;
 }
 return true;
}
