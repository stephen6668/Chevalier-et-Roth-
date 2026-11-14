// Stage only the generated Worker for Sites' standard packaging helper.
import {access,cp,rm,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
await access(root+'/.worker-output/dist/server/index.js');
if(await stat(root+'/dist/index.html').catch(error=>{if(error.code==='ENOENT')return null;throw error;}))throw new Error('Move authored frontend sources to the repository root before staging.');
await rm(root+'/dist',{recursive:true,force:true});
await cp(root+'/.worker-output/dist',root+'/dist',{recursive:true});
