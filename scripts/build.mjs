import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {existsSync} from 'node:fs';
const root=resolve(import.meta.dirname,'..');
// Avoid rewriting unchanged vendor files and large assets in sync folders.
async function copyFile(from,to){
 const data=await readFile(from);
 if(existsSync(to)&&(await readFile(to)).equals(data))return;
 await writeFile(to,data);
}
async function copyTree(from,to){
 await mkdir(to,{recursive:true});
 for(const entry of await readdir(from,{withFileTypes:true})){
  if(entry.isDirectory())await copyTree(from+'/'+entry.name,to+'/'+entry.name);
  else await copyFile(from+'/'+entry.name,to+'/'+entry.name);
 }
}
await mkdir(root+'/vendor/addons/loaders',{recursive:true});await mkdir(root+'/vendor/addons/utils',{recursive:true});
const three=resolve(root,'../node_modules/three');
if(existsSync(three)){
for(const name of ['three.module.js','three.core.js'])await copyFile(`${three}/build/${name}`,`${root}/vendor/${name}`);
for(const name of ['loaders/GLTFLoader.js','utils/BufferGeometryUtils.js','utils/SkeletonUtils.js'])await copyFile(`${three}/examples/jsm/${name}`,`${root}/vendor/addons/${name}`);
await copyFile(three+'/LICENSE',root+'/vendor/THREE-LICENSE.txt');
}
await mkdir(root+'/dist',{recursive:true});
for(const name of ['index.html','manifest.webmanifest'])await copyFile(root+'/'+name,root+'/dist/'+name);
for(const name of ['css','js','assets','vendor'])await copyTree(root+'/'+name,root+'/dist/'+name);
const nav=JSON.parse(await readFile(root+'/assets/navigation.json','utf8'));
if(nav.heights.length!==nav.nx*nav.nz||nav.edges.length!==nav.heights.length)throw Error('Invalid navigation');
console.log('Static viewer built: dist/index.html');
