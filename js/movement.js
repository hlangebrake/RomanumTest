export function stickVector(dx, dy, radius, deadzone = 0.07) {
  const length = Math.hypot(dx,dy), distance = Math.min(length / radius, 1);
  if (distance <= deadzone) return {x:0,y:0};
  const strength = (distance-deadzone)/(1-deadzone);
  return {x:dx/length*strength, y:dy/length*strength};
}
export function displacement(x,y,yaw,speed,dt) {
  const length = Math.hypot(x,y), scale = length>1 ? 1/length : 1;
  return {x:(Math.cos(yaw)*x+Math.sin(yaw)*y)*scale*speed*dt,
          z:(-Math.sin(yaw)*x+Math.cos(yaw)*y)*scale*speed*dt};
}
export function cell(nav,x,z){
  const ix=Math.round((x-nav.x0)/nav.step),iz=Math.round((z-nav.z0)/nav.step);
  if(ix<0||iz<0||ix>=nav.nx||iz>=nav.nz)return null;
  const index=iz*nav.nx+ix;
  return nav.heights[index]===null?null:{ix,iz,index,height:nav.heights[index]};
}
export function canMove(nav,x,z,xx,zz){
  const a=cell(nav,x,z),b=cell(nav,xx,zz);
  if(!a||!b||Math.abs(a.height-b.height)>.65)return false;
  const dx=b.ix-a.ix,dz=b.iz-a.iz;
  if(dx===0&&dz===0)return true;
  if(Math.abs(dx)+Math.abs(dz)!==1)return false;
  const bit=dx===1?0:dx===-1?1:dz===1?2:3;
  return Boolean(nav.edges[a.index]&(1<<bit))&&Boolean(nav.edges[b.index]&(1<<(bit^1)));
}
