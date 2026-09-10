import test from 'node:test';import assert from 'node:assert/strict';
import {rufusTasks,intro,glossary,wordKey,correctRufus,placeCard,assisted,freshRufus,progressFor,restoreRufus} from '../js/rufus-data.js';
test('All ten formats have valid solutions; partial or extra selections fail',()=>{
 assert.equal(new Set(rufusTasks.map(t=>t.type)).size,10);
 for(const t of rufusTasks){if(t.type==='translation')continue;const answer=t.type==='repair'?{index:t.wrongIndex,text:t.answer}:t.answer;assert.ok(correctRufus(t,answer),t.id);assert.equal(correctRufus(t,null),false,t.id);}
 const t=rufusTasks.find(t=>t.id==='reverse');assert.equal(correctRufus(t,[t.answer[0]]),false);assert.equal(correctRufus(t,[...t.answer,t.options[2]]),false);
 const repair=rufusTasks.find(t=>t.id==='repair');assert.equal(correctRufus(repair,{index:'0',text:'parva'}),false);
});
test('Card placement supports regrouping and swaps occupied single slots without losing cards',()=>{
 const t=rufusTasks.find(t=>t.id==='pairs');let a={big:'0',happy:'1',heavy:'2'};
 a=placeCard(t,a,'big','1');assert.deepEqual(a,{big:'1',happy:'0',heavy:'2'});
 assert.deepEqual(placeCard(t,a,'unknown','1'),a);
 const g=rufusTasks.find(t=>t.id==='group');assert.deepEqual(placeCard(g,{a:'0'},'d','0'),{a:'0',d:'0'});
});
test('Every clickable Latin word has a gloss, including Rufus speech and the translation source',()=>{
 for(const text of [intro.latin,...rufusTasks.flatMap(t=>[t.speech,t.source||''])])for(const token of text.split(/\s+/)){const k=wordKey(token);if(k)assert.ok(glossary[k],`Missing gloss: ${token}`);}
});
test('Translation budget counts distinct words, survives reload and never claims automatic validation',()=>{
 const s=freshRufus(),t=rufusTasks.find(t=>t.type==='translation'),p=progressFor(s,t);p.words=['mercator','amico','amico'];
 let restored=restoreRufus(s).tasks[t.id];assert.equal(restored.words.length,2);assert.equal(assisted(t,restored),false);
 restored.words.push('dama');assert.equal(assisted(t,restored),true);assert.equal(correctRufus(t,t.translation),false);
 p.words=[];p.answer=t.translation;p.example=true;p.review=[true,true];p.done=true;
 assert.equal(restoreRufus(s).tasks[t.id].done,true);assert.equal(assisted(t,p),false,'Required self-review alone is not extra assistance');
 p.full=true;assert.equal(assisted(t,p),true);p.review[1]=false;assert.equal(restoreRufus(s).tasks[t.id].done,false);
});
