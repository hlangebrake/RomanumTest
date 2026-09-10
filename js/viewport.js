/** Keep the scene at layout size; the keyboard only occludes it. */
export function keyboardOverlap(layoutHeight,visibleHeight,keyboardHeight=0){
 return Math.max(0,keyboardHeight,layoutHeight-visibleHeight>120?layoutHeight-visibleHeight:0);
}
export function scrollToReveal(rect,top,bottom){
 if(rect.top<top)return rect.top-top;
 if(rect.bottom>bottom)return Math.min(rect.bottom-bottom,rect.top-top);
 return 0;
}
export function installViewport(){
 const root=document.documentElement,dialog=document.querySelector('#dialog'),vv=window.visualViewport;
 let width=innerWidth,height=innerHeight,frame=0,anchor=null,keyboard=false;
 const editable=e=>e?.matches('textarea,input:not([type=checkbox]):not([type=button])')&&!e.readOnly&&!e.disabled;
 function pinPage(){if(window.scrollX||window.scrollY)window.scrollTo(0,0);}
 function update(){
  frame=0;
  const focused=editable(document.activeElement),rotated=Math.abs(innerWidth-width)>80;
  const overlap=keyboardOverlap(height,vv?.height||innerHeight,navigator.virtualKeyboard?.boundingRect?.height||0);
  keyboard=!rotated&&overlap>0&&(focused||keyboard);
  if(!keyboard){width=innerWidth;height=innerHeight;if(!focused)anchor=null;}
  root.style.setProperty('--scene-height',`${height}px`);
  root.style.setProperty('--usable-height',`${height}px`);
  root.style.setProperty('--viewport-pan',`${keyboard?(vv?.offsetTop||0):0}px`);
  if(keyboard&&dialog.open){
   anchor??={top:Math.max(12,dialog.getBoundingClientRect().top),height:dialog.offsetHeight};
   const top=Math.min(anchor.top,Math.max(12,height-overlap-260));
   dialog.style.setProperty('--dialog-top',`${top}px`);
   dialog.style.setProperty('--dialog-height',`${anchor.height}px`);
   // Extra scroll range, not a resized scene or recentered dialog.
   const cover=Math.max(0,top+anchor.height-(height-overlap));
   dialog.style.setProperty('--keyboard-cover',`${cover}px`);
  }else dialog.style.setProperty('--keyboard-cover','0px');
  dialog.classList.toggle('keyboard-overlay',keyboard&&dialog.open);
  pinPage();
  if(keyboard&&focused&&dialog.contains(document.activeElement)){
   const input=document.activeElement,r=input.getBoundingClientRect(),d=dialog.getBoundingClientRect();
   const top=d.top+16,bottom=Math.min(d.bottom,height-overlap+(vv?.offsetTop||0))-18;
   if(bottom>top)dialog.scrollTop+=scrollToReveal(r,top,bottom);
  }
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(update);}
 document.addEventListener('focusin',()=>{
  if(editable(document.activeElement)&&dialog.open&&!keyboard){const r=dialog.getBoundingClientRect();anchor={top:r.top,height:r.height};}
  schedule();
 });
 document.addEventListener('focusout',schedule);
 vv?.addEventListener('resize',schedule);vv?.addEventListener('scroll',schedule);
 navigator.virtualKeyboard?.addEventListener('geometrychange',schedule);
 window.addEventListener('resize',schedule);
 window.addEventListener('scroll',pinPage,{passive:true});
 // Prevent scroll chaining, including WebKit's root overscroll with a keyboard.
 let touch=null;
 document.addEventListener('touchstart',e=>{if(e.touches.length===1)touch={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
 document.addEventListener('touchmove',e=>{
  if(!dialog.open||!touch)return;
  if(e.touches.length!==1){e.preventDefault();return;}
  const p=e.touches[0],dy=touch.y-p.clientY,dx=touch.x-p.clientX;touch={x:p.clientX,y:p.clientY};
  if(!canScroll(e.target,dx,dy))e.preventDefault();
 },{passive:false});
 document.addEventListener('wheel',e=>{if(dialog.open&&!canScroll(e.target,e.deltaX,e.deltaY))e.preventDefault();},{passive:false});
 function canScroll(target,dx,dy){
  if(!dialog.contains(target))return false;
  for(let e=target;e&&dialog.contains(e);e=e.parentElement){
   const style=getComputedStyle(e),horizontal=Math.abs(dx)>Math.abs(dy),delta=horizontal?dx:dy;
   const overflow=horizontal?style.overflowX:style.overflowY;
   const pos=horizontal?e.scrollLeft:e.scrollTop,max=horizontal?e.scrollWidth-e.clientWidth:e.scrollHeight-e.clientHeight;
   if(/auto|scroll/.test(overflow)&&max>1&&((delta<0&&pos>0)||(delta>0&&pos<max-1)))return true;
  }
  return false;
 }
 update();
 return {get size(){return {width,height};}};
}
