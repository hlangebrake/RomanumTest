// The overview previews topics, never the explanations of undiscovered entries.
export const memoryGroups = [
 {id:'learning',title:'Neues Lateinwissen',subtitle:'Adjektive und Adverbien',entries:[
  ['endungen','Adjektivtypen','Q2 · Livia'],['i-formen','Stamm und Formen','Q3 · Livia'],
  ['funktion','Adjektive im Satz','Q4 · Marcus'],['adverb','Adjektiv und Adverb','Q5 · Flavia'],
  ['rsa','Relativsatz und Satzanschluss','Q6 · Dama'],['rsa-kasus','Bezug und Satzfunktion','Q7 · Dama'],
  ['rufus-form','Formen entschlüsseln','Wiederholung · Rufus'],['rufus-read','Zusammenhänge lesen','Wiederholung · Rufus']]},
 {id:'prior',title:'Grundlagen',subtitle:'Vorwissen wieder aufnehmen',entries:[
  ['basis','Nomen und Adjektiv','Q1 · Sextus'],['kng','Kasus · Numerus · Genus','Q3 · Livia']]},
 {id:'story',title:'Auftrag & Spuren',subtitle:'Was bisher bekannt ist',entries:[
  ['auftrag','Dein Auftrag','Q1 · Sextus'],['waren','Die vorgesehene Lieferung','Q2 · Livia'],
  ['liste','Das Lieferverzeichnis','Q5 · Livia'],['zeugin','Die Zeugenaussage','Q5 · Flavia'],
  ['beleg','Beobachtung und Schlussfolgerung','Q5 · Bericht'],['nachrichten','Erwartung und Versprechen','Q7 · Sextus']]}];

export function renderMemory({parent,cards,known,unread}){
 const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text)node.textContent=text;if(cls)node.className=cls;return node;};
 const grid=el('div',null,'memory-grid');
 for(const group of memoryGroups){
  const column=el('section',null,`memory-column memory-${group.id}`);
  const entries=[...group.entries];
  if(group.id==='learning')for(const id of ['plural','abl','gen'])if(known.includes(id))entries.push([id,cards[id].title,'Formen nachschlagen']);
  const count=entries.filter(([id])=>known.includes(id)).length;
  const header=el('div',null,'memory-column-heading');
  header.append(el('p',group.subtitle,'eyebrow'),el('h3',group.title),el('span',`${count} / ${entries.length} Einträge`,'memory-progress'));
  column.append(header);
  for(const [id,title,origin] of entries){
   const available=known.includes(id),fresh=unread.includes(id),data=cards[id];
   const box=el('article',null,`memory-entry${available?'':' is-locked'}${fresh?' is-new':''}`);
   box.dataset.memoryId=id;
   box.append(el('p',origin,'memory-origin'));
   box.append(el('h4',available?data.title:title));
   if(!available){box.append(el('span','Noch nicht entdeckt','memory-state'));column.append(box);continue;}
   if(fresh)box.append(el('span','Neu im Gedächtnis','memory-fresh'));
   if(data.source){const latin=el('p',data.source,'memory-latin');latin.lang='la';box.append(latin);}
   box.append(el('p',data.text,'memory-explanation'));
   if(data.example)box.append(el('p',data.example,'memory-example'));
   if(data.table){const wrap=el('div',null,'table-scroll'),table=el('table');for(const [i,row] of data.table.entries()){const tr=el('tr');row.forEach(x=>tr.append(el(i?'td':'th',x)));table.append(tr);}wrap.append(table);box.append(wrap);}
   column.append(box);
  }
  grid.append(column);
 }
 parent.append(grid);
}
