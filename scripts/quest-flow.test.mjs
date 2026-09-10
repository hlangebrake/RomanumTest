import test from 'node:test';
import assert from 'node:assert/strict';
import {createQuest} from '../js/quest.js';
import {SAVE_KEY,messageTasks,warmupSteps,steps,witnessSteps,allTasks,claims,finalWriting,restoreState,freshState} from '../js/quest-data.js';
import {rufusTasks,RUFUS_KEY} from '../js/rufus-data.js';

// Minimal DOM port: exercise real event handlers and persisted state independently
// of WebGL. Browser layout and native form behavior are checked in the viewer.
class Element{
 constructor(tag='div'){this.tag=tag;this.children=[];this.textContent='';this.value='';this.disabled=false;this.dataset={};this.classList={add(){},toggle(){},remove(){}};}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(){this.children=[];}
 setAttribute(){} addEventListener(){} focus(){}
 showModal(){this.open=true;} close(){this.open=false;}
 all(){return this.children.flatMap(c=>[c,...c.all()]);}
 querySelectorAll(selector){return this.all().filter(e=>selector==='button'?e.tag==='button':selector==='input[type=checkbox]'?e.type==='checkbox':selector.startsWith('#')?e.id===selector.slice(1):false);}
 querySelector(s){return this.querySelectorAll(s)[0]||null;}
}
test('Quest follows the full errand, returns to Sextus, announces new memories once and resets cleanly',()=>{
 const nodes=new Map(),storage=new Map(),animations=[];
 const node=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);};
 globalThis.document={createElement:tag=>new Element(tag),querySelector:s=>s==='#answer'||s==='#written'?node('#dialog-content').querySelector(s):node(s),activeElement:null};
 globalThis.localStorage={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};
 const quest=createQuest({pause(){},animate:(...args)=>animations.push(args),restart(){}});
 const content=node('#dialog-content'),saved=()=>JSON.parse(storage.get(SAVE_KEY));
 const click=(text,root=content)=>{const b=root.all().find(e=>e.tag==='button'&&e.textContent===text);assert.ok(b,`Missing button: ${text}`);assert.ok(!b.disabled,`Disabled: ${text}`);b.onclick();};
 function complete(t){
  if(!quest.isOpen)quest.open(t.person);
  assert.ok(node('#quest-topic').textContent.includes(t.chapter.toUpperCase()));
  if(t.type==='lesson'){const b=content.all().find(e=>e.tag==='button'&&e.className==='primary');b.onclick();return;}
  if(t.type==='reflection'){const input=content.querySelector('#reflection');input.value='Wer hat die Übergabe gesehen?';input.oninput();click('Frage im Journal festhalten');return;}
  if(['mark','multi','group'].includes(t.type)){if(t.type==='group')for(const [id,text] of t.items){click(text);click(t.slots[Number(t.answer[id])]);}else for(const value of t.answer)click(t.type==='mark'?t.tokens[Number(value)]:value);click('Abgleichen');click('Weiter');return;}
  if(t.type==='choice'){click(t.answer);click('Abgleichen');click('Weiter');return;}
  const input=content.querySelector(t.type==='input'?'#answer':'#written');
  input.value=t.type==='input'?t.answer:'Meine eigene Zusammenfassung mit Quelle und Grenze.';input.oninput();
  if(t.type==='input'){click('Eintrag abgleichen');assert.ok(content.all().some(e=>e.className==='source-latin'&&e.textContent===t.source.replace('___',t.answer)));click('Weiter');}
  else{click('Mit einem Beispiel vergleichen');for(const c of content.querySelectorAll('input[type=checkbox]')){c.checked=true;c.onchange();}click(t.id==='report'?'Bericht übergeben':'Notiz übernehmen');}
 }
 try{
  quest.open('sextus');click('Den Auftrag annehmen');
  assert.deepEqual(saved().unreadMemory,['auftrag']);assert.equal(node('#memory-notice').hidden,false);
  node('#memory-notice-open').onclick();assert.deepEqual(saved().unreadMemory,[]);click('Zurück');
  for(const t of warmupSteps)complete(t);
  assert.equal(quest.target,'livia');assert.equal(quest.isOpen,false);
  quest.open('livia');for(const t of steps)complete(t);
  assert.equal(quest.target,'flavia');quest.open('flavia');for(const t of witnessSteps)complete(t);
  assert.equal(quest.target,'livia');quest.open('livia');
  const groups=content.all().filter(e=>e.tag==='fieldset');claims.forEach((q,i)=>click(q.answer,groups[i]));
  click('Für den Bericht festhalten');assert.equal(quest.target,'sextus');assert.equal(quest.isOpen,false);
  quest.open('livia');assert.equal(content.querySelector('#written'),null);
  quest.open('sextus');complete(finalWriting);assert.equal(quest.done,false);
  assert.equal(restoreState(saved()).stage,'done');
  click('Damas Nachrichten nachgehen');assert.equal(quest.target,'dama');
  for(const t of messageTasks)complete(t);
  assert.ok(quest.done);assert.equal(restoreState(saved()).stage,'messagesDone');
  assert.ok(saved().memory.includes('nachrichten'));
  const partial=saved();partial.solved['rsa-cui']=false;partial.answers['rsa-cui']='quam';assert.equal(restoreState(partial).stage,'messages');assert.equal(messageTasks[restoreState(partial).messageIndex].id,'rsa-cui');
  assert.equal(new Set(saved().memory).size,saved().memory.length);
  assert.ok(!animations.some(([,name])=>name==='doubt'),'NPC must not react as an examiner');
  quest.startOver();click('Von vorne beginnen');assert.deepEqual(saved(),freshState());assert.equal(quest.target,'sextus');
 }finally{delete globalThis.document;delete globalThis.localStorage;}
});

test('Unread memory markers survive reload, reject unknown entries and do not reappear after reading',()=>{
 const s=freshState();s.memory=['auftrag'];s.unreadMemory=['auftrag','auftrag','not-a-card'];
 assert.deepEqual(restoreState(s).unreadMemory,['auftrag']);s.unreadMemory=[];
 assert.deepEqual(restoreState(s).unreadMemory,[]);
});

test('Rufus gates unseen grammar; all formats unlock after the corresponding quests',()=>{
 const nodes=new Map(),storage=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);};
 globalThis.document={createElement:tag=>new Element(tag),querySelector:node,activeElement:null};
 globalThis.localStorage={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};
 const content=node('#dialog-content');let q=createQuest({pause(){},animate(){},restart(){}});
 const click=text=>{const b=content.all().find(e=>e.tag==='button'&&e.textContent===text);assert.ok(b,text);assert.ok(!b.disabled,text);b.onclick();};
 try{
  q.open('rufus');
  assert.ok(content.all().find(e=>e.textContent===rufusTasks[0].title).disabled);
  const seed=freshState();seed.stage='done';seed.claims=claims.map(c=>c.answer);for(const t of allTasks){seed.solved[t.id]=true;seed.answers[t.id]=t.type==='reflection'?'Eigene Frage':t.type==='writing'?'Eigener Text':t.answer;if(t.type==='writing'){seed.revealed[t.id]=true;seed.review[t.id]=t.criteria.map(()=>true);}}
  storage.set(SAVE_KEY,JSON.stringify(seed));q=createQuest({pause(){},animate(){},restart(){}});q.open('rufus');
  for(const t of rufusTasks){
   click(t.title);
   if(['choice','reason'].includes(t.type))click(t.answer);
   if(t.type==='multi')for(const a of t.answer)click(a);
   if(t.type==='mark')for(const i of t.answer)click(t.tokens[Number(i)]);
   if(t.items)for(const [id,text] of t.items){click(text);click(t.slots[Number(t.answer[id])]);}
   if(t.type==='repair')click(t.tokens[Number(t.wrongIndex)]);
   if(['input','repair','translation'].includes(t.type)){const input=content.querySelector('#rufus-answer');input.value=t.type==='translation'?t.translation:t.answer;input.oninput();}
   if(t.type==='translation'){click('Mit einer möglichen Übersetzung vergleichen');for(const c of content.querySelectorAll('input[type=checkbox]')){c.checked=true;c.onchange();}click('Übersetzung festhalten');}
   else click('Mit der Tafel abgleichen');
   assert.ok(JSON.parse(storage.get(RUFUS_KEY)).tasks[t.id].done,t.id);click('Zurück zu den Tafeln');
  }
  assert.equal(JSON.parse(storage.get(SAVE_KEY)).stage,'done');
  assert.deepEqual(JSON.parse(storage.get(SAVE_KEY)).memory,['rufus-form','rufus-read']);
  assert.equal(q.target,'sextus');
 }finally{delete globalThis.document;delete globalThis.localStorage;}
});
