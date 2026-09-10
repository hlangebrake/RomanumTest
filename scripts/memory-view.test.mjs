import test from 'node:test';
import assert from 'node:assert/strict';
import {renderMemory,memoryGroups} from '../js/memory-view.js';
import {memoryCards} from '../js/quest-data.js';
class Node {constructor(tag){this.tag=tag;this.children=[];this.dataset={};}append(...n){this.children.push(...n);}all(){return this.children.flatMap(n=>[n,...n.all()]);}}
test('Memory shows only discovered explanations, with inert previews and one category per entry',()=>{
 globalThis.document={createElement:t=>new Node(t)};
 try{
  const parent=new Node('div'),known=['auftrag','basis','endungen'],unread=['endungen'];
  renderMemory({parent,cards:memoryCards,known,unread});
  const nodes=parent.all(),entries=nodes.filter(n=>n.tag==='article');
  assert.equal(entries.length,16);
  assert.equal(new Set(entries.map(n=>n.dataset.memoryId)).size,16);
  for(const e of entries){const texts=e.all().map(n=>n.textContent);const data=memoryCards[e.dataset.memoryId];
   assert.equal(texts.includes(data.text),known.includes(e.dataset.memoryId));
   assert.ok(!e.all().some(n=>['button','details','a','input'].includes(n.tag)));
  }
  assert.ok(entries.find(e=>e.dataset.memoryId==='endungen').className.includes('is-new'));
  assert.deepEqual(known,['auftrag','basis','endungen']);assert.deepEqual(unread,['endungen']);
  assert.ok(memoryGroups.every(g=>g.entries.every(([id])=>memoryCards[id])));
 }finally{delete globalThis.document;}
});
