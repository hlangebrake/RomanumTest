import {RUFUS_KEY,intro,glossary,rufusTasks,wordKey,correctRufus,placeCard,assisted,freshRufus,progressFor,restoreRufus} from './rufus-data.js';

export function createRufus({content,body,unlock,close,available=()=>true}){
 let state=freshRufus(),selectedCard=null,cleanupDrag=()=>{};
 try{state=restoreRufus(JSON.parse(localStorage.getItem(RUFUS_KEY)));}catch{}
 const save=()=>{try{localStorage.setItem(RUFUS_KEY,JSON.stringify(state));}catch{}};
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(text,fn,cls='secondary')=>{const b=el('button',text,cls);b.type='button';b.onclick=fn;return b;};
 function setAnswer(p,a){if(p.example)p.revisedAfterExample=true;p.answer=a;p.done=false;p.review=[];save();}
 function latin(text,translation,{task=null,p=null,label='Rufus'}={}){
  const box=el('section',null,'quest-source'),line=el('div',null,'rufus-latin'),meaning=el('p',null,'rufus-gloss');meaning.setAttribute('role','status');
  if(label==='Rufus')box.classList.add('rufus-speech');box.append(el('span',label,'source-label'));line.lang='la';
  for(const token of text.split(/\s+/)){
   const key=wordKey(token),gloss=glossary[key];if(!gloss){line.append(el('span',token+' '));continue;}
   const b=button(token,()=>{meaning.textContent=`${token} · ${gloss}`;if(task?.type==='translation'&&!p.words.includes(key)){p.words.push(key);p.done=false;save();updateBudget();}},'rufus-word');b.setAttribute('aria-label',`${token}: Wortbedeutung anzeigen`);line.append(b);
  }
  box.append(line,meaning);
  const budget=el('p',null,'word-help');
  function updateBudget(){if(task?.type==='translation')budget.textContent=p.full?'Mit Übersetzungshilfe':`${p.words.length} / ${task.budget} Worthilfen · ${p.words.length>task.budget?'Selbstständig-Ziel überschritten; mit Hilfe weiterarbeiten':'Selbstständig-Ziel'}`;}
  if(task?.type==='translation'){updateBudget();box.append(budget);}
  if(translation){const full=el('p',p?.full?translation:'','rufus-full');box.append(button('Alles übersetzen',()=>{full.textContent=translation;if(p){p.full=true;p.done=false;save();updateBudget();}},'text-button'),full);}
  content.append(box);
 }
 function speech(t){const translations={'Scribe, quaeso.':'Schreibe bitte.','Lege haec verba.':'Lies diese Wörter.','Elige, quaeso.':'Wähle bitte.','Lege, quaeso.':'Lies bitte.','Ordina haec verba.':'Ordne diese Wörter.','Ordina, quaeso.':'Ordne bitte.','Corrige tabulam, quaeso.':'Verbessere bitte die Tafel.'};latin(t.speech,translations[t.speech]);}
 function refresh(){const d=document.querySelector('#dialog'),y=d.scrollTop;render();d.scrollTop=y;}
 function menu(){state.selected=null;selectedCard=null;save();render();}
 function dragChip(chip,id,t,p){
  chip.addEventListener('pointerdown',e=>{
   if(e.button!==0)return;const start={x:e.clientX,y:e.clientY};let moving=false,ghost=null;
   chip.setPointerCapture(e.pointerId);
   const clean=()=>{ghost?.remove();chip.classList.remove('dragging');chip.removeEventListener('pointermove',move);chip.removeEventListener('pointerup',up);chip.removeEventListener('pointercancel',cancel);if(chip.hasPointerCapture(e.pointerId))chip.releasePointerCapture(e.pointerId);cleanupDrag=()=>{};};
   const move=event=>{if(Math.hypot(event.clientX-start.x,event.clientY-start.y)>7&&!moving){moving=true;ghost=el('div',chip.textContent,'rufus-drag-ghost');document.querySelector('#dialog').append(ghost);chip.classList.add('dragging');}
    if(!moving)return;event.preventDefault();ghost.style.left=event.clientX+10+'px';ghost.style.top=event.clientY+10+'px';
    const dialog=document.querySelector('#dialog'),rect=dialog.getBoundingClientRect();if(event.clientY>rect.bottom-50)dialog.scrollTop+=14;else if(event.clientY<rect.top+65)dialog.scrollTop-=14;
   };
   const up=event=>{const zone=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-rufus-slot]');clean();if(moving){chip.onclick=null;if(zone){setAnswer(p,placeCard(t,p.answer,id,zone.dataset.rufusSlot));selectedCard=null;}refresh();}};
   const cancel=()=>clean();cleanupDrag=clean;chip.addEventListener('pointermove',move);chip.addEventListener('pointerup',up);chip.addEventListener('pointercancel',cancel);
  });
 }
 function board(t,p){
  content.append(el('p','Ziehen oder Karte und Ziel antippen.','word-help'));
  const board=el('div',null,'rufus-board'),tray=el('div',null,'rufus-tray');
  const chip=(id,text)=>{const b=button(text,()=>{selectedCard=selectedCard===id?null:id;refresh();},'rufus-chip');b.setAttribute('aria-pressed',String(selectedCard===id));dragChip(b,id,t,p);return b;};
  for(const [id,text] of t.items)if(p.answer[id]===undefined)tray.append(chip(id,text));
  if(tray.children.length)board.append(tray);
  t.slots.forEach((label,i)=>{const zone=el('section',null,'rufus-zone');zone.dataset.rufusSlot=String(i);const target=button(label,()=>{if(selectedCard){setAnswer(p,placeCard(t,p.answer,selectedCard,String(i)));selectedCard=null;refresh();}},'rufus-zone-target');target.setAttribute('aria-label',`Ziel: ${label}`);zone.append(target);for(const [id,text] of t.items)if(p.answer[id]===String(i))zone.append(chip(id,text));board.append(zone);});
  content.append(board);
 }
 function inputField(p,t,multi=false){const label=el('label',multi?'Meine Übersetzung':'Meine Form');label.htmlFor='rufus-answer';const input=el(multi?'textarea':'input');input.id='rufus-answer';if(!multi)input.type='text';input.rows=3;input.maxLength=multi?1800:80;input.autocomplete='off';input.spellcheck=false;input.setAttribute('autocapitalize','none');input.value=t.type==='repair'?p.answer.text||'':p.answer;input.oninput=()=>{setAnswer(p,t.type==='repair'?{...p.answer,text:input.value}:input.value);const feedback=content.querySelector('.rufus-feedback');if(feedback)feedback.textContent='';content.querySelectorAll('input[type=checkbox]').forEach(c=>c.checked=false);const finish=content.querySelector('#rufus-finish');if(finish)finish.disabled=true;};content.append(label,input);}
 function render(){
  cleanupDrag();if(state.selected&&!available(rufusTasks.find(t=>t.id===state.selected))){state.selected=null;save();}const t=rufusTasks.find(t=>t.id===state.selected);
  if(!t){body('RUFUS · DIE LOSEN TAFELN','Ordnung vor Marktschluss','Rufus sammelt Aufschriften und kurze Nachrichten. Ein Windstoß hat seine Tafeln durcheinandergebracht. Hilf ihm bei einem Fundstück deiner Wahl.');latin(intro.latin,intro.translation);const grid=el('div',null,'rufus-menu');for(const task of rufusTasks){const p=state.tasks[task.id];const b=button(task.title,()=>{state.selected=task.id;selectedCard=null;save();render();},'rufus-menu-item');b.append(el('small',`${task.format}${p?.done?' · '+(assisted(task,p)?'mit Hilfe erledigt':'erledigt'):''}`));if(!available(task)){b.disabled=true;b.append(el('small',"Nach "+task.requiredQuest.toUpperCase()+" · "+task.topic));}grid.append(b);}content.append(grid,button('Zurück ins Forum',close),button('Rufus’ Tafeln neu beginnen',()=>{body('RUFUS','Alle Tafeln neu beginnen?','Deine Einträge bei Rufus werden gelöscht.');content.append(button('Tafeln zurücksetzen',()=>{state=freshRufus();save();render();},'primary'),button('Zurück',render));},'text-button'));return;}
  const p=progressFor(state,t);body(`RUFUS · ${t.format.toUpperCase()}`,t.title);content.append(button('‹ Alle Tafeln',menu,'text-button'),el('p',t.context,'scene-context'));speech(t);document.querySelector('#quest-topic')?.replaceChildren(el('span','Wiederholung · '+t.topic));
  if(t.source&&!['mark','repair'].includes(t.type))latin(t.source,t.translation,{task:t,p,label:'Auf der Tafel'});
  content.append(el('p',t.prompt,'dialog-copy'));
  if(['choice','reason','multi'].includes(t.type)){for(const option of t.options){const picked=t.type==='multi'?p.answer.includes(option):p.answer===option;const b=button(option,()=>{setAnswer(p,t.type==='multi'?picked?p.answer.filter(x=>x!==option):[...p.answer,option]:option);refresh();},'choice rufus-option');b.setAttribute('aria-pressed',String(picked));content.append(b);}}
  if(['mark','repair'].includes(t.type)){const line=el('div',null,'rufus-latin');line.lang='la';t.tokens.forEach((token,i)=>{const id=String(i),picked=t.type==='mark'?p.answer.includes(id):p.answer.index===id;const b=button(token,()=>{setAnswer(p,t.type==='mark'?picked?p.answer.filter(x=>x!==id):[...p.answer,id]:{...p.answer,index:id});refresh();},'choice');b.setAttribute('aria-pressed',String(picked));line.append(b);});content.append(line);}
  if(['order','group','pairs'].includes(t.type))board(t,p);
  if(['input','repair','translation'].includes(t.type))inputField(p,t,t.type==='translation');
  const feedback=el('p',p.done?`${assisted(t,p)?'Mit Hilfe festgehalten. ':''}${t.explain}`:'','feedback rufus-feedback');feedback.setAttribute('role','status');content.append(feedback);
  const finish=()=>{p.done=true;save();if(t.memory)unlock([t.memory]);refresh();};
  if(t.type==='translation'){
   content.append(button('Mit einer möglichen Übersetzung vergleichen',()=>{if(!p.answer.trim()){feedback.textContent='Notiere zuerst deine Übersetzung.';return;}p.example=true;p.done=false;save();refresh();},'primary'));
   if(p.example){content.append(el('p',t.translation,'source-card'),el('p','Selbstvergleich: Sinngemäße Formulierungen sind möglich.','word-help'));t.criteria.forEach((criterion,i)=>{const label=el('label',null,'criterion'),c=el('input');c.type='checkbox';c.checked=!!p.review[i];c.onchange=()=>{p.review[i]=c.checked;p.done=false;save();content.querySelector('#rufus-finish').disabled=!p.answer.trim()||!t.criteria.every((_,j)=>p.review[j]);};label.append(c,el('span',criterion));content.append(label);});const b=button('Übersetzung festhalten',finish,'primary');b.id='rufus-finish';b.disabled=!p.answer.trim()||!t.criteria.every((_,i)=>p.review[i]);content.append(b);}
  }else if(!p.done)content.append(button('Mit der Tafel abgleichen',()=>{p.attempts++;save();if(correctRufus(t,p.answer))finish();else feedback.textContent='Noch nicht stimmig. '+t.hint;},'primary'));
  if(p.done)content.append(button('Zurück zu den Tafeln',menu,'primary'));
  if(p.hint)content.append(el('p',t.hint,'source-card'));else content.append(button('Ein Denkanstoß',()=>{p.hint=true;p.done=false;save();refresh();},'text-button'));
 }
 return {render,dispose(){cleanupDrag();},get count(){return Object.values(state.tasks).filter(p=>p.done).length;}};
}





