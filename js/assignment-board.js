// Pointer dragging plus a keyboard/tap alternative share the same assignment data.
export function assignmentBoard(task,initial,onChange){
 const root=document.createElement('div');root.className='rufus-board';let answer={...initial},selected=null,cleanup=()=>{};
 const button=(text,fn,cls)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.className=cls;b.onclick=fn;return b;};
 const place=(id,slot)=>{answer[id]=slot;selected=null;onChange({...answer});draw();};
 function draw(){root.replaceChildren();const tray=document.createElement('div');tray.className='rufus-tray';
  function chip(id,text){const b=button(text,()=>{selected=selected===id?null:id;draw();},'rufus-chip');b.setAttribute('aria-pressed',String(selected===id));
   b.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;const start={x:event.clientX,y:event.clientY};let moving=false,ghost=null;b.setPointerCapture(event.pointerId);
    const clean=()=>{ghost?.remove();b.classList.remove('dragging');b.removeEventListener('pointermove',move);b.removeEventListener('pointerup',up);b.removeEventListener('pointercancel',cancel);if(b.hasPointerCapture(event.pointerId))b.releasePointerCapture(event.pointerId);cleanup=()=>{};};
    const move=e=>{if(!moving&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>7){moving=true;ghost=document.createElement('div');ghost.className='rufus-drag-ghost';ghost.textContent=text;document.querySelector('#dialog').append(ghost);b.classList.add('dragging');}if(!moving)return;e.preventDefault();ghost.style.left=e.clientX+8+'px';ghost.style.top=e.clientY+8+'px';const d=document.querySelector('#dialog'),r=d.getBoundingClientRect();if(e.clientY>r.bottom-45)d.scrollTop+=14;if(e.clientY<r.top+65)d.scrollTop-=14;};
    const up=e=>{const zone=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-assignment-slot]');clean();if(moving){b.onclick=null;if(zone&&root.contains(zone))place(id,zone.dataset.assignmentSlot);else draw();}};
    const cancel=()=>{clean();draw();};cleanup=clean;b.addEventListener('pointermove',move);b.addEventListener('pointerup',up);b.addEventListener('pointercancel',cancel);
   });return b;
  }
  for(const [id,text] of task.items)if(answer[id]===undefined)tray.append(chip(id,text));if(tray.children.length)root.append(tray);
  task.slots.forEach((name,i)=>{const zone=document.createElement('section');zone.className='rufus-zone';zone.dataset.assignmentSlot=String(i);const target=button(name,()=>{if(selected)place(selected,String(i));},'rufus-zone-target');target.setAttribute('aria-label',`Ziel: ${name}`);zone.append(target);for(const [id,text] of task.items)if(answer[id]===String(i))zone.append(chip(id,text));root.append(zone);});
 }draw();return {root,dispose(){cleanup();}};
}
