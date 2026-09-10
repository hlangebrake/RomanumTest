import {quests as earlyQuests,openingTasks,listTasks,witnessTasks,closingTask} from './early-quests.js';
import {messageQuests,messageTasks,messageMemory} from './message-quests.js';
export {messageTasks};
export const quests=[...earlyQuests,...messageQuests];
// Die Lieferung: Auftrag, lateinische Quellen und eigene Sprachnotizen.
import {rufusMemory} from './rufus-data.js';
export const SAVE_KEY="forum-livia-v5";
export const memoryCards={
  "auftrag": {
    "title": "Der Auftrag",
    "text": "Du hilfst Sextus in der Schreibstube. Auf dem Forum heißt es, Marcus habe Geschenke angenommen. Prüfe bei Livia die Waren, lies das Verzeichnis und befrage Flavia. Eine Behauptung ist noch kein Beleg."
  },
  "endungen": {
    "title": "Ein-, zwei-, dreiendig",
    "text": "Gezählt werden die Formen im Nominativ Singular für Maskulinum, Femininum und Neutrum. felix (Genitiv felicis): eine Form für alle drei Genera. gravis, grave: zwei Formen. celer, celeris, celere: drei Formen. Einendig bedeutet nicht unveränderlich.",
    "example": "felix → felic- ist der Stamm. Der Genitiv felicis hilft, ihn zu erkennen."
  },
  "kng": {
    "title": "KNG: Was gehört zusammen?",
    "text": "Ein Adjektiv stimmt mit seinem Bezugswort in Kasus, Numerus und Genus überein. Suche zuerst das Nomen, bestimme seine Merkmale und bilde dann die Adjektivform. Gleiche Merkmale verlangen nicht gleiche Endungen.",
    "example": "vas grande: Beide Wörter stehen im Nominativ Singular Neutrum. Sie müssen nicht gleich enden."
  },
  "funktion": {
    "title": "Was leistet das Adjektiv?",
    "text": "Als Attribut gehört es zu einem Nomen: vir clarus – ein berühmter Mann. Als Prädikatsnomen macht es mit est eine Aussage: Vir clarus est – der Mann ist berühmt. Substantiviert steht es selbst für Personen oder Dinge: boni – die Guten."
  },
  "adverb": {
    "title": "Eigenschaft oder Handlung?",
    "text": "Ein Adjektiv beschreibt eine Person oder Sache. Ein Adverb beschreibt hier, wie etwas geschieht. Es stimmt nicht nach KNG mit der Person überein. Bildung: clarus → clare; gravis → graviter; celer → celeriter; prudens → prudenter (prudent- + -er). Diese Muster gelten nicht ausnahmslos für alle Adverbien.",
    "example": "Livia clara est: Livia ist berühmt. Livia clare narrat: Livia erzählt deutlich."
  },
  "liste": {
    "title": "Livias Lieferverzeichnis",
    "text": "Lieferung L: zwei Kisten mit einem großen Gefäß, zwei kleinen Gefäßen und zwei Stoffpaketen. L-1: Ankunft bei Livia bestätigt. L-2: vorgesehener Empfänger Marcus. L-3: „Übergabe an Marcus bestätigt“ ist nicht ausgefüllt. Das leere Feld beweist allein nicht, dass niemals eine Übergabe stattgefunden hat.",
    "source": "L · Duae cistae: unum vas grande, duo vasa parva, duo fasciculi panni.\nL-1 · Merces ad tabernam Liviae advenerunt.\nL-2 · Merces Marco destinatae.\nL-3 · Marcus merces accepit: ______",
    "sourceLabel": "Lieferverzeichnis L"
  },
  "zeugin": {
    "title": "Flavias Aussage",
    "text": "„Ich stand am Warenstand, als Dama die beiden Kisten brachte. Ich sah, wie sie neben Livias Tisch abgestellt wurden. Eine Übergabe an Marcus habe ich nicht gesehen. Danach ging ich fort. Was später geschah, kann ich aus eigener Beobachtung nicht sagen.“",
    "source": "Apud tabernam eram. Dama duas cistas portavit. Cistae iuxta mensam Liviae erant. Marcus eas accepit? Id non vidi. Deinde discessi. Quid postea factum est? Nescio.",
    "sourceLabel": "Flavias Aussage"
  },
  "beleg": {
    "title": "Beobachtung und Schlussfolgerung",
    "text": "Nenne die Quelle, ihre Aussage und ihre Grenze. „Nicht beobachtet“ heißt nicht „unmöglich“. Ein vorgesehener Empfänger ist noch kein bestätigter Empfänger."
  },
  "basis": {
    "title": "Nomen und Adjektiv",
    "text": "Ein Nomen nennt eine Person oder Sache. Ein Adjektiv beschreibt sie. In tabulam novam (eine neue Tafel) beschreibt novam die Tafel. Beide stehen im Akkusativ Singular Femininum. Bei Adjektiven der a-/o-Deklination lautet diese Endung -am. KNG heißt Kasus, Numerus und Genus."
  },
  "plural": {
    "title": "Neutrum im Plural",
    "text": "Bei parvus heißt es vasa parva. Bei grandis heißt es vasa grandia. Für die hier verwendeten i-Adjektive gilt im Nominativ und Akkusativ Plural Neutrum -ia. Gleiche KNG-Merkmale verlangen nicht gleiche Endungen."
  },
  "abl": {
    "title": "Mit wem? Der Ablativ",
    "text": "cum verlangt den Ablativ. Bei den hier verwendeten i-Adjektiven lautet die Endung im Ablativ Singular -i. Beispiel: cum viro gravi – mit einem ernsthaften Mann. Bei felix verrät der Genitiv felicis den Stamm felic-."
  },
  "gen": {
    "title": "Wessen? Der Genitiv",
    "text": "„Der Gefäße“ ist Genitiv Plural. Bei i-Adjektiven lautet die Endung -ium. Beispiel: donorum felicium – der glückbringenden Geschenke. Der Genitiv von felix zeigt den Stamm felic-, dazu kommt -ium."
  }
};
Object.assign(memoryCards,rufusMemory,messageMemory);
Object.assign(memoryCards,{
 waren:{title:'Die vorgesehene Lieferung',text:'Für Marcus vorgesehen: ein großes Gefäß, zwei kleine Gefäße und zwei Stoffpakete in zwei Kisten. Die Zuordnung zur Lieferung ist geklärt. Vorgesehen bedeutet noch nicht übergeben.'},
 'i-formen':{title:'i-Adjektive · Stamm und Formen',text:'Der Genitiv Singular zeigt den Stamm: felicis → felic-, prudentis → prudent-. Bei den hier verwendeten i-Adjektiven: Ablativ Singular -i (felici), Nominativ/Akkusativ Plural Neutrum -ia (felicia), Genitiv Plural -ium (felicium). Das Nomen bestimmt die KNG-Merkmale. Nominativ und Akkusativ Neutrum sehen gleich aus; der Satz klärt die Funktion.'}
});
export const warmupSteps=openingTasks;
export const steps=listTasks;
export const witnessSteps=witnessTasks;
export const claims=[
  {
    "text": "Lieferung L ist bei Livia angekommen.",
    "options": [
      "Belegt",
      "Nicht belegt"
    ],
    "answer": "Belegt",
    "feedback": "L-1 bestätigt die Ankunft; Flavia sah das Abstellen der Kisten."
  },
  {
    "text": "Marcus hat die Ware angenommen.",
    "options": [
      "Belegt",
      "Nicht belegt"
    ],
    "answer": "Nicht belegt",
    "feedback": "Marcus ist vorgesehen. Eine bestätigte Übergabe fehlt."
  },
  {
    "text": "Flavia kann eine spätere Übergabe ausschließen.",
    "options": [
      "Ja",
      "Nein"
    ],
    "answer": "Nein",
    "feedback": "Flavia ging fort. Was danach geschah, hat sie nicht beobachtet."
  }
];
export const evidence="Lieferung L kam bei Livia an: Das stützen ihr Verzeichnis und Flavias Beobachtung. Eine Annahme durch Marcus ist damit nicht belegt; eine spätere Übergabe kann Flavia nicht ausschließen.";
export const finalWriting=closingTask;
export const allTasks=[...warmupSteps,...steps,...witnessSteps,finalWriting,...messageTasks];
export const exerciseTasks=allTasks.filter(t=>t.type!=="lesson");
export const taskCount=exerciseTasks.length+1;
export function normalize(value){return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/[.!?]+$/,'').trim();}
export function checkAnswer(task,value){
 if(task.type==='reflection')return typeof value==='string'&&!!value.trim();
 if(['multi','mark'].includes(task.type))return Array.isArray(value)&&new Set(value).size===task.answer.length&&task.answer.every(x=>value.includes(x));
 if(task.type==='group')return task.items.every(([id])=>value?.[id]===task.answer[id]);
 return (task.accepted||[task.answer]).some(answer=>normalize(value)===normalize(answer));
}
export function correctClaims(a){return claims.every((q,i)=>a[i]===q.answer);}
function restoreAnswer(t,a){
 if(['mark','multi'].includes(t.type)){const allowed=t.type==='mark'?t.tokens.map((_,i)=>String(i)):t.options;return Array.isArray(a)?[...new Set(a.filter(v=>allowed.includes(v)))]:[];}
 if(t.type==='group')return Object.fromEntries(t.items.filter(([id])=>t.slots[Number(a?.[id])]&&typeof a[id]==='string').map(([id])=>[id,a[id]]));
 return typeof a==='string'?a.slice(0,2500):'';
}
export function freshState(){return {stage:'intro',developerSkipped:{},messageIndex:0,warmupIndex:0,index:0,witnessIndex:0,answers:{},solved:{},attempts:{},history:{},help:{},clarified:{},revealed:{},review:{},memory:[],unreadMemory:[],claims:[null,null,null],note:''};}
export function restoreState(raw){
 const s=freshState();if(!raw||!['intro','warmup','learn','witness','evidence','report','done','messages','messagesDone'].includes(raw.stage))return s;
 s.stage=raw.stage;s.developerSkipped=Object.fromEntries([...allTasks.map(t=>t.id),'evidence'].filter(id=>raw.developerSkipped?.[id]===true).map(id=>[id,true]));
 for(const [key,seq] of [['messageIndex',messageTasks],['warmupIndex',warmupSteps],['index',steps],['witnessIndex',witnessSteps]])s[key]=Math.max(0,Math.min(seq.length-1,Number.isInteger(raw[key])?raw[key]:0));
 for(const t of allTasks){s.answers[t.id]=restoreAnswer(t,raw.answers?.[t.id]);s.history[t.id]=Array.isArray(raw.history?.[t.id])?raw.history[t.id].slice(-50).map(h=>({answer:restoreAnswer(t,h.answer),help:Math.max(0,Math.min(3,Number(h.help)||0))})):[];s.attempts[t.id]=Math.max(0,Math.min(999,Number(raw.attempts?.[t.id])||0));s.help[t.id]=Math.max(0,Math.min(3,Number(raw.help?.[t.id])||0));s.clarified[t.id]=!!raw.clarified?.[t.id]&&s.attempts[t.id]>0;s.revealed[t.id]=!!raw.revealed?.[t.id];s.review[t.id]=Array.isArray(raw.review?.[t.id])?t.criteria?.map((_,i)=>raw.review[t.id][i]===true)||[]:[];s.solved[t.id]=raw.solved?.[t.id]===true&&(['input','choice','mark','multi','group','reflection'].includes(t.type)?checkAnswer(t,s.answers[t.id])||s.clarified[t.id]:t.type==='writing'?!!s.answers[t.id].trim()&&s.revealed[t.id]&&s.review[t.id].length===t.criteria.length&&s.review[t.id].every(Boolean):true);}
 s.memory=Array.isArray(raw.memory)?[...new Set(raw.memory.filter(x=>Object.hasOwn(memoryCards,x)))]:[];s.unreadMemory=Array.isArray(raw.unreadMemory)?[...new Set(raw.unreadMemory.filter(id=>s.memory.includes(id)))]:[];s.claims=claims.map((q,i)=>q.options.includes(raw.claims?.[i])?raw.claims[i]:null);s.note=typeof raw.note==='string'?raw.note.slice(0,2500):'';
 if(s.stage!=='intro'){
  for(const [stage,key,seq] of [['warmup','warmupIndex',warmupSteps],['learn','index',steps],['witness','witnessIndex',witnessSteps]]){const missing=seq.findIndex(t=>!s.solved[t.id]);if(missing>=0){s.stage=stage;s[key]=missing;return s;}}
  if(!correctClaims(s.claims))s.stage='evidence';else if(!s.solved.report)s.stage='report';
  else if(['messages','messagesDone'].includes(s.stage)){const missing=messageTasks.findIndex(t=>!s.solved[t.id]);s.stage=missing<0?'messagesDone':'messages';s.messageIndex=missing<0?messageTasks.length-1:missing;}
 }
 return s;
}





