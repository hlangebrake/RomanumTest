import {mkdir,copyFile,cp,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {existsSync} from 'node:fs';
const root=resolve(import.meta.dirname,'..');
await mkdir(root+'/vendor/addons/loaders',{recursive:true});await mkdir(root+'/vendor/addons/utils',{recursive:true});
const three=resolve(root,'../node_modules/three');
if(existsSync(three)){
for(const name of ['three.module.js','three.core.js'])await copyFile(`${three}/build/${name}`,`${root}/vendor/${name}`);
for(const name of ['loaders/GLTFLoader.js','utils/BufferGeometryUtils.js'])await copyFile(`${three}/examples/jsm/${name}`,`${root}/vendor/addons/${name}`);
await copyFile(three+'/LICENSE',root+'/vendor/THREE-LICENSE.txt');
}
await mkdir(root+'/dist',{recursive:true});
for(const name of ['index.html','css','js','assets','vendor'])await cp(root+'/'+name,root+'/dist/'+name,{recursive:true});
const nav=JSON.parse(await readFile(root+'/assets/navigation.json','utf8'));
if(nav.heights.length!==nav.nx*nav.nz||nav.edges.length!==nav.heights.length)throw Error('Invalid navigation');
console.log('Static viewer built: dist/index.html');
