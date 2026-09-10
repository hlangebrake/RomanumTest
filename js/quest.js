import {SAVE_KEY,quests,messageTasks,warmupSteps,steps,witnessSteps,allTasks,memoryCards,claims,finalWriting,freshState,restoreState,checkAnswer,normalize,correctClaims} from './quest-data.js';
import {createRufus} from './rufus.js';
import {assignmentBoard} from './assignment-board.js';
import {renderMemory} from './memory-view.js';
export function createQuest({pause,animate,restart,storage}){
 try{storage??=localStorage;}catch{storage={getItem(){return null;},setItem(){}};}
 let state=freshState(),active=null,backTo=null,returnFocus=null,speaker=null,trackRufus=false,renderedKey=null,disposeTask=()=>{};
 try{state=restoreState(JSON.parse(storage.getItem(SAVE_KEY)));}catch{}
 const dialog=document.querySelector('#dialog'),content=document.querySelector('#dialog-content');
 const rufus=createRufus({content,body,unlock,close,available:t=>t.requiredQuest?chapterDone(t.requiredQuest):true});
 function chapter(){if(['messages','messagesDone'].includes(state.stage))return quests.find(q=>q.id===messageTasks[state.messageIndex].chapter);const id=['intro','warmup'].includes(state.stage)?'q1':state.stage==='learn'?taskNow().chapter:'q5';return quests.find(q=>q.id===id);}
 function chapterDone(id){return allTasks.filter(t=>t.chapter===id).every(t=>state.solved[t.id])&&(id!=='q5'||['done','messages','messagesDone'].includes(state.stage));}
 function owner(){if(state.stage==='messages')return taskNow().person;if(state.stage==='messagesDone')return 'sextus';return ['intro','warmup','report','done'].includes(state.stage)?'sextus':state.stage==='evidence'?'livia':taskNow().person;}
 function showTopic(){const q=chapter(),topic=active==='rufus'?'Wiederholung · freigeschaltete Lateinthemen':q.topic;document.querySelector('#quest-topic').textContent=active==='rufus'?topic:`${q.id.toUpperCase()} · ${q.title} — ${topic}`;document.querySelector('#objective-topic').textContent=trackRufus?'Wiederholung · bekannte Lateinthemen':`${q.id.toUpperCase()} · ${q.topic}`;}
 function record(t){state.attempts[t.id]=(state.attempts[t.id]||0)+1;(state.history[t.id]??=[]).push({answer:JSON.parse(JSON.stringify(state.answers[t.id]??'')),help:state.help[t.id]||0});}
 function save(){try{storage.setItem(SAVE_KEY,JSON.stringify(state));}catch{}update();}
 function update(){const q=chapter();document.querySelector('#objective-text').textContent=trackRufus?'Rufus · Die losen Tafeln':state.stage==='intro'?'Sprich mit Sextus':state.stage==='report'?'Bring Sextus den Zwischenbericht':state.stage==='messagesDone'?'Nachrichten geklärt · Bericht ergänzt':state.stage==='done'?'Sextus · Damas Nachrichten abholen':q.title;document.querySelector('#journal-count').textContent=String(quests.filter(q=>chapterDone(q.id)).length);document.querySelector('#memory-count').textContent=String(state.memory.length);showTopic();memoryNotice();}
 function unlock(ids){let changed=false;for(const id of ids)if(!state.memory.includes(id)){state.memory.push(id);state.unreadMemory.push(id);changed=true;}if(changed)save();else memoryNotice();}
 function memoryNotice(){if(trackRufus)document.querySelector('#objective-text').textContent='Hilf Rufus mit den losen Tafeln';const notice=document.querySelector('#memory-notice'),fresh=state.unreadMemory;notice.hidden=!fresh.length||active==='memory';document.querySelector('#memory').classList.toggle('has-new-memory',!!fresh.length);document.querySelector('#dialog-memory').classList.toggle('has-new-memory',!!fresh.length);document.querySelector('#memory-new-title').textContent=fresh.map(id=>memoryCards[id].title).join(' · ');}
 function el(tag,text,cls){const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;}
 function button(text,fn,cls='primary'){const b=el('button',text,cls);b.type='button';b.onclick=fn;return b;}
 function body(kicker,title,text){dialog.classList.toggle('memory-view',active==='memory');disposeTask();disposeTask=()=>{};content.replaceChildren();content.append(el('p',kicker,'eyebrow'),el('h2',title));if(text)content.append(el('p',text,'dialog-copy'));dialog.scrollTop=0;memoryNotice();showTopic();}
 function open(person){renderedKey=null;returnFocus=document.activeElement;active=person;speaker=person;backTo=null;pause(true,person);animate(person,'talk');render();if(!dialog.open)dialog.showModal();document.querySelector('#close-dialog').focus({preventScroll:true});}
 function close(){disposeTask();rufus.dispose();dialog.close();pause(false);animate(speaker,'idle');speaker=null;active=null;backTo=null;returnFocus?.focus({preventScroll:true});}
 function memory(){rufus.dispose();if(active==='memory')return;backTo=active;active='memory';render();}
 function source(label,text,translation,parent=content){const box=el('section',null,'quest-source');box.append(el('span',label,'source-label'));const latin=el('p',text,'source-latin');latin.lang='la';box.append(latin);if(translation){const d=el('details');d.append(el('summary','Bedeutung nachsehen'),el('p',translation));box.append(d);}parent.append(box);}
 function card(id,parent=content){const data=memoryCards[id],box=el('section',null,'memory-card');box.append(el('h3',data.title));if(data.source)source(data.sourceLabel,data.source,data.text,box);else box.append(el('p',data.text));if(data.example)box.append(el('p',data.example,'latin-example'));if(data.table){const wrap=el('div',null,'table-scroll'),table=el('table');data.table.forEach((row,i)=>{const tr=el('tr');row.forEach(x=>tr.append(el(i?'td':'th',x)));table.append(tr);});wrap.append(table);const fold=el('details');fold.append(el('summary','Formen nachschlagen'),wrap);box.append(fold);}parent.append(box);}
 function field(id,label,value,multiline=false){const l=el('label',label);l.htmlFor=id;const input=el(multiline?'textarea':'input');input.id=id;input.value=value||'';input.maxLength=multiline?2500:70;input.autocomplete='off';input.spellcheck=false;input.setAttribute('autocapitalize','none');input.setAttribute('autocorrect','off');if(multiline)input.rows=4;else input.type='text';content.append(l,input);return input;}
 function taskNow(){if(state.stage==='messages')return messageTasks[state.messageIndex];return state.stage==='warmup'?warmupSteps[state.warmupIndex]:state.stage==='witness'?witnessSteps[state.witnessIndex]:steps[state.index];}
 function advance(task){state.solved[task.id]=true;if(state.stage==='messages'){if(state.messageIndex<messageTasks.length-1)state.messageIndex++;else state.stage='messagesDone';save();if(task.end||task.person!==owner()){close();return;}render();return;}if(state.stage==='warmup'){if(state.warmupIndex<warmupSteps.length-1)state.warmupIndex++;else{state.stage='learn';save();close();return;}}else if(state.stage==='learn'){if(state.index<steps.length-1)state.index++;else{state.stage='witness';save();close();return;}}else if(state.stage==='witness'){if(state.witnessIndex<witnessSteps.length-1)state.witnessIndex++;else{state.stage='evidence';save();close();return;}}else if(state.stage==='report')state.stage='done';save();if(task.end||task.travel){close();return;}render();}
 function tools(){content.append(button('Im Gedächtnis nachsehen',memory,'text-button'));}
 function renderTask(t){
  animate(active,'idle');
  body(({sextus:'SEXTUS · SCHREIBSTUBE',livia:'LIVIA · WARENSTAND',marcus:'MARCUS · AM PLATZRAND',flavia:'FLAVIA · AM WARENSTAND',dama:'DAMA · DIE NACHRICHTEN'})[active],t.title);
  if(t.context)content.append(el('p',t.context,'scene-context'));
  if(t.source&&t.type!=='mark')source(t.sourceLabel,t.type==='input'&&state.solved[t.id]?t.source.replace('___',t.answer):t.source,t.translation);
  const thought=el('section',null,'quest-thought');thought.append(el('span',t.type==='input'?'Dein Eintrag':'Deine Überlegung','source-label'),el('p',t.text||t.prompt));content.append(thought);
  if(t.type==='lesson'){
   unlock(t.cards);t.cards.forEach(id=>card(id));if(t.end)content.append(el('p',chapter().result,'source-card'));content.append(button(t.end?'Quest abschließen':t.travel?'Marcus aufsuchen':t.id==='testimony'?'Mit Livia den Beleg prüfen':'Weiter',()=>advance(t)));tools();return;
  }
  if(t.word&&t.type!=='input')content.append(el('p',t.word,'word-help'));
  if(t.type==='reflection'){const input=field('reflection','Meine erste Frage',state.answers[t.id],true);const next=button('Frage im Journal festhalten',()=>{if(input.value.trim())advance(t);});next.disabled=!input.value.trim();input.oninput=()=>{state.answers[t.id]=input.value;save();next.disabled=!input.value.trim();};content.append(next);return;}
  if(['multi','mark','group'].includes(t.type)){
   const feedback=el('p',null,'feedback');feedback.setAttribute('role','status');
   state.answers[t.id]??=t.type==='group'?{}:[];
   const change=a=>{state.answers[t.id]=a;state.solved[t.id]=false;save();feedback.textContent='';};
   if(t.type==='group'){content.append(el('p','Ziehen oder Karte und Ziel antippen.','word-help'));const board=assignmentBoard(t,state.answers[t.id],change);if(state.solved[t.id]||state.clarified[t.id])board.root.querySelectorAll('button').forEach(b=>b.disabled=true);content.append(board.root);disposeTask=board.dispose;}
   else{const options=t.type==='mark'?t.tokens:t.options;const optionHost=t.type==='mark'?el('div',null,'text-marking'):content;if(t.type==='mark'){optionHost.lang='la';optionHost.setAttribute('role','group');optionHost.setAttribute('aria-label',t.prompt);content.append(optionHost);}options.forEach((text,i)=>{const value=t.type==='mark'?String(i):text,b=button(text,()=>{const old=state.answers[t.id];change(old.includes(value)?old.filter(x=>x!==value):[...old,value]);b.setAttribute('aria-pressed',String(state.answers[t.id].includes(value)));},'choice');b.setAttribute('aria-pressed',String(state.answers[t.id].includes(value)));b.disabled=!!state.solved[t.id]||!!state.clarified[t.id];optionHost.append(b);});}
   const check=button('Abgleichen',()=>{record(t);if(checkAnswer(t,state.answers[t.id])){state.solved[t.id]=true;save();render();}else{feedback.textContent='Noch nicht stimmig. '+(t.hints?.[0]||t.explain);save();if(state.attempts[t.id]>=2)content.append(button('Lösung nachvollziehen',()=>{state.clarified[t.id]=true;state.answers[t.id]=JSON.parse(JSON.stringify(t.answer));save();render();},'secondary'));}});
   if(state.solved[t.id]||state.clarified[t.id]){feedback.textContent=t.explain;content.append(button('Weiter',()=>advance(t)));}else content.append(check);content.append(feedback);tools();return;
  }

  if(t.type==='choice'){
   const feedback=el('p',null,'feedback');feedback.setAttribute('role','status');
   const check=button('Abgleichen',()=>{record(t);if(checkAnswer(t,state.answers[t.id])){state.solved[t.id]=true;save();render();}else{feedback.textContent=t.diagnostic?t.explain:'Ich schaue noch einmal hin: '+t.explain;save();if(t.diagnostic){state.clarified[t.id]=true;unlock(['basis']);render();}else if(state.attempts[t.id]>=2)content.append(button('Lösung nachvollziehen',()=>{state.clarified[t.id]=true;save();render();},'secondary'));}});
   for(const option of t.options){const b=button(option,()=>{state.answers[t.id]=option;save();render();},'choice');b.setAttribute('aria-pressed',String(state.answers[t.id]===option));b.disabled=!!state.solved[t.id];content.append(b);}
   check.disabled=!state.answers[t.id];content.append(feedback);
   if(state.solved[t.id]){feedback.textContent=t.explain;feedback.classList.add('success');content.append(button('Weiter',()=>advance(t)));}
   else if(state.clarified[t.id]){feedback.textContent=t.explain;content.append(button('So halte ich es fest',()=>advance(t)));}
   else content.append(check);tools();return;
  }
  if(t.type==='input'){
   content.append(el('p',t.word,'word-help'));
   const input=field('answer','Lateinischer Eintrag',state.answers[t.id]);input.readOnly=!!state.solved[t.id];
   const feedback=el('p',null,'feedback');feedback.setAttribute('role','status');content.append(feedback);
   input.oninput=()=>{state.answers[t.id]=input.value;save();check.disabled=!input.value.trim();feedback.textContent='';};
   const check=button('Eintrag abgleichen',()=>{if(!input.value.trim())return;record(t);if(checkAnswer(t,input.value)){state.solved[t.id]=true;save();render();}else{feedback.textContent=t.wrong?.[normalize(input.value)]||'Die Form passt noch nicht zum Eintrag. '+t.hints[0];save();if(t.diagnostic){state.clarified[t.id]=true;unlock(['basis']);render();}else if(state.attempts[t.id]>=2)content.append(button('Lösung nachvollziehen',()=>{state.clarified[t.id]=true;save();render();},'secondary'));}});check.disabled=!input.value.trim();
   input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();if(!state.solved[t.id])check.click();}};
   if(state.solved[t.id]){feedback.textContent=t.explain;feedback.classList.add('success');content.append(button('Weiter',()=>advance(t)));}
   else if(state.clarified[t.id]){feedback.textContent=t.explain;card('basis');content.append(button('So halte ich es fest',()=>advance(t)));}
   else{
    content.append(check);const helpers=el('div',null,'hint-stack');const count=state.help[t.id]||0;
    for(let i=0;i<count;i++)helpers.append(el('p',`${i+1}. ${t.hints[i]}`));content.append(helpers);
    if(count<3)content.append(button(count?'Nächster Hinweis':'Ein Hinweis',()=>{state.help[t.id]=count+1;save();render();},'secondary'));
   }
   tools();return;
  }
  const input=field('written',t.inputLabel||'Meine Notiz',state.answers[t.id],true);
  input.oninput=()=>{state.answers[t.id]=input.value;state.solved[t.id]=false;state.review[t.id]=t.criteria.map(()=>false);save();content.querySelectorAll('input[type=checkbox]').forEach(e=>e.checked=false);const finish=content.querySelector('#finish-writing');if(finish)finish.disabled=true;const compare=content.querySelector('#compare-writing');if(compare)compare.disabled=!input.value.trim();};
  if(!state.revealed[t.id]){const compare=button('Mit einem Beispiel vergleichen',()=>{state.revealed[t.id]=true;save();render();});compare.id='compare-writing';compare.disabled=!input.value.trim();content.append(compare);}
  else{
   const box=el('section',null,'memory-card');box.append(el('h3','Vergleiche deinen Text'),el('p',t.model));content.append(box);
   content.append(el('p','Sinngemäße Formulierungen sind möglich. Prüfe deinen Text und überarbeite ihn bei Bedarf.','word-help'));
   const finish=button(t.id==='report'?'Bericht übergeben':'Notiz übernehmen',()=>{if(!input.value.trim()||!t.criteria.every((_,i)=>state.review[t.id]?.[i]))return;advance(t);});finish.id='finish-writing';
   t.criteria.forEach((criterion,i)=>{const l=el('label',null,'criterion'),c=el('input');c.type='checkbox';c.checked=!!state.review[t.id]?.[i];c.onchange=()=>{state.review[t.id]??=[];state.review[t.id][i]=c.checked;save();finish.disabled=!input.value.trim()||!t.criteria.every((_,j)=>state.review[t.id]?.[j]);};l.append(c,el('span',criterion));content.append(l);});finish.disabled=!input.value.trim()||!t.criteria.every((_,i)=>state.review[t.id]?.[i]);content.append(finish);
  }tools();
 }
 function renderRestart(){body('NEUER ANFANG','Zurück zum ersten Gespräch?','Deine Antworten, Notizen und Erinnerungen an diese Lieferung werden zurückgesetzt.');content.append(button('Von vorne beginnen',()=>{animate(speaker,'idle');state=freshState();save();restart?.();active='sextus';speaker='sextus';pause(true,'sextus');animate('sextus','talk');render();}),button('Zurück',()=>render(),'secondary'));}
 function render(){
  const key=[active,state.stage,state.warmupIndex,state.index,state.witnessIndex,state.messageIndex].join(':');
  const keep=key===renderedKey,y=dialog.scrollTop;
  const folds=keep?[...content.querySelectorAll('details')].map(e=>e.open):[];
  renderContent();
  if(keep){content.querySelectorAll('details').forEach((e,i)=>{if(folds[i]!==undefined)e.open=folds[i];});dialog.scrollTop=y;}
  renderedKey=key;
 }
 function renderContent(){
  if(active==='rufus'){animate('rufus','idle');rufus.render();return;}
  if(active==='memory'){
   body('DEIN GEDÄCHTNIS','Wissen & Spuren',state.memory.length?null:'Sprich mit Sextus, um deinen Auftrag zu erfahren.');
   if(backTo)content.append(button('Zurück',()=>{active=backTo;backTo=null;render();},'secondary'));
   renderMemory({parent:content,cards:memoryCards,known:state.memory,unread:state.unreadMemory});state.unreadMemory=[];save();return;
  }
  if(active==='journal'){
   body('DEINE SCHREIBTAFEL','Journal');
   for(const q of quests){const d=el('details');d.append(el('summary',`${q.id.toUpperCase()} · ${q.title} · ${chapterDone(q.id)?'abgeschlossen':q.id===chapter().id?'aktuell':'später'}`),el('p',q.topic,'quest-topic-copy'));if(chapterDone(q.id))d.append(el('p',q.result));content.append(d);}
   if(state.answers['first-question'])content.append(el('h3','Meine erste Frage'),el('p',state.answers['first-question']));
   if(state.stage==='done'){content.append(el('p',state.answers.report,'source-card'));}
   else content.append(el('p',state.memory.includes('auftrag')?'Prüfe, ob die Lieferung nur für Marcus bestimmt war oder auch an ihn übergeben wurde.':'Dein Auftrag beginnt bei Sextus.'));
   const entries=allTasks.filter(t=>t.type==='input'&&state.solved[t.id]);if(entries.length){const d=el('details');d.append(el('summary','Meine Einträge'));for(const t of entries){const line=el('p',(t.source||t.prompt).replace('___',state.clarified[t.id]?t.answer:state.answers[t.id]));line.lang='la';d.append(line);}content.append(d);}
   for(const t of allTasks.filter(t=>t.type==='writing'&&state.answers[t.id])){const d=el('details');d.append(el('summary',t.title+(state.solved[t.id]?' · selbst verglichen':' · in Arbeit')),el('p',state.answers[t.id]));content.append(d);}
   const n=field('note','Meine Notiz',state.note,true);n.oninput=()=>{state.note=n.value;save();};
   content.append(el('h3','Rufus · Die losen Tafeln'),el('p',`${rufus.count} von 10 Fundstücken geordnet.`));
   content.append(button(trackRufus?'Wieder dem Hauptauftrag folgen':'Rufus aufsuchen',()=>{trackRufus=!trackRufus;save();if(trackRufus)document.querySelector('#objective-text').textContent='Hilf Rufus mit den losen Tafeln';close();},'secondary'));
   content.append(button('Szenario neu beginnen',renderRestart,'secondary'));return;
  }

  if(state.stage==='intro'||state.stage==='warmup'){
   if(active!=='sextus'){body('DER AUFTRAG','Sextus wartet','„Melde dich zuerst bei Sextus in der Schreibstube. Er erklärt dir, was geprüft werden muss.“');content.append(button('Sextus aufsuchen',close));return;}
   if(state.stage==='warmup'){renderTask(taskNow());return;}
   body('SEXTUS · DIE SCHREIBSTUBE','Ein Gerücht auf dem Forum','„Marcus soll Geschenke angenommen und dafür Hilfe versprochen haben. Für unseren Bericht brauchen wir Belege. Prüfe bei Livia die Lieferung und frage Flavia, was sie gesehen hat.“');
   content.append(el('p','„Nimm eine neue Schreibtafel mit und halte fest, was du herausfindest. Livia braucht gerade Hilfe mit ihrem Warenverzeichnis.“','scene-context'));
   content.append(button('Den Auftrag annehmen',()=>{unlock(['auftrag']);state.stage='warmup';save();render();}));return;
  }
  if(state.stage==='messagesDone'){body('SEXTUS · SCHREIBSTUBE','Die Nachrichten sind geklärt','„Der Händler erwartet Hilfe. Ein Versprechen von Marcus ist damit nicht bewiesen. Die nächste Spur führt zu seiner Amtsbewerbung.“');content.append(button('Aufzeichnungen lesen',()=>{active='journal';render();}),button('Das Forum erkunden',close,'secondary'));return;}
  if(state.stage==='report'||state.stage==='done'){
   if(active!=='sextus'){body(active.toUpperCase(),'Zurück zur Schreibstube','„Bring Sextus die Aufzeichnungen. Er wartet auf deinen Bericht.“');content.append(button('Sextus aufsuchen',close));return;}
   if(state.stage==='report'){renderTask(finalWriting);return;}
   body('SEXTUS · SCHREIBSTUBE','Der Zwischenbericht ist übergeben','„Danke. Die Ankunft können wir belegen. Ob Marcus die Waren angenommen hat, bleibt offen. Die Nachrichten und die Amtsfrage müssen wir später noch untersuchen.“');animate('sextus','nod');content.append(el('p',state.answers.report,'source-card'),button('Damas Nachrichten nachgehen',()=>{state.stage='messages';state.messageIndex=0;save();close();}),button('Journal öffnen',()=>{active='journal';render();}),button('Das Forum erkunden',close,'secondary'));return;
  }
  if(active!==owner()){body(active.toUpperCase(),chapter().title,`Deine nächste Spur führt zu ${{livia:'Livia',marcus:'Marcus',flavia:'Flavia',sextus:'Sextus',dama:'Dama'}[owner()]}. Dort geht es um: ${chapter().topic}.`);content.append(button('Der Spur folgen',close));return;}
  if(state.stage==='learn'||state.stage==='witness'||state.stage==='messages'){renderTask(taskNow());return;}
  if(state.stage==='evidence'){
   body('LIVIA · WARENSTAND','Was kommt in den Bericht?','Livia: „Du hast das Verzeichnis und Flavias Aussage. Lass uns festhalten, was wir Sextus sicher sagen können.“');
   for(const id of ['liste','zeugin']){const d=el('details');d.append(el('summary',memoryCards[id].title));card(id,d);content.append(d);}
   const feedback=el('p',null,'feedback');feedback.setAttribute('role','status');
   const check=button('Für den Bericht festhalten',()=>{if(correctClaims(state.claims)){state.stage='report';save();close();}else feedback.textContent=claims.find((q,i)=>state.claims[i]!==q.answer).feedback;});check.disabled=state.claims.some(x=>!x);
   claims.forEach((q,i)=>{const group=el('fieldset');group.append(el('legend',q.text));q.options.forEach(option=>{const b=button(option,()=>{state.claims[i]=option;group.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));feedback.textContent='';save();check.disabled=state.claims.some(x=>!x);},'choice');b.setAttribute('aria-pressed',String(state.claims[i]===option));group.append(b);});content.append(group);});content.append(feedback,check);tools();return;
  }
 }
 document.querySelector('#memory-notice-open').onclick=memory;document.querySelector('#memory-notice-dismiss').onclick=()=>{state.unreadMemory=[];save();};document.querySelector('#dialog-memory').onclick=memory;document.querySelector('#close-dialog').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 document.querySelector('#journal').onclick=()=>open('journal');document.querySelector('#memory').onclick=()=>open('memory');update();
 return {open,startOver(){trackRufus=false;open('journal');renderRestart();},get target(){return trackRufus?'rufus':owner();},get done(){return !trackRufus&&state.stage==='messagesDone';},get isOpen(){return dialog.open;}};
}







