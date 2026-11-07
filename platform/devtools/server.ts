import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {type Definition,type Manifest,PLATFORM_VERSION} from '../core';
import {validate} from './validate';
const root=process.cwd();
const json=(path:string)=>JSON.parse(readFileSync(join(root,'levels',path),'utf8'));
export const levelIds=json('catalog.json') as string[];
export const corrected=levelIds.filter(id=>json(id+'/manifest.json').runtime!=='legacy-preserved');
export function loadDefinition(id:string):Definition{if(!levelIds.includes(id)||!corrected.includes(id))throw Error('Level has a preserved legacy runtime');const base=id+'/',manifest=json(base+'manifest.json');return {manifest,people:json(base+'people.json'),scenes:json(base+'scenes/index.json'),events:json(base+'events/deck.json'),templates:json(base+'templates.json'),asks:json(base+'asks.json'),objections:json(base+'objections.json'),fuses:json(base+'fuses.json'),...json(base+'rules.json')}}
export function loadCatalog(){return levelIds.map(id=>json(id+'/manifest.json') as Manifest)}
export function readFlags(){let overrides:Record<string,boolean>={};try{const raw=JSON.parse(readFileSync(join(root,'.data','project-flags.json'),'utf8'));if(raw&&typeof raw==='object')overrides=raw.levels||{}}catch{}return {allowDraftPlay:true,version:PLATFORM_VERSION,levels:Object.fromEntries(levelIds.map(id=>{const env='PMFORGE_'+id.replaceAll('-','_').toUpperCase()+'_ENABLED',enabled=process.env.PMFORGE_PROJECTS_ENABLED!=='false'&&process.env[env]!=='false'&&overrides[id]!==false;return [id,{enabled,minimumPlatformVersion:PLATFORM_VERSION,preview:process.env.PMFORGE_PROJECT_PREVIEW==='true'||process.env.NODE_ENV!=='production'}]}))}}
export function validationArtifact(){try{const verified=json('validation.json') as Record<string,boolean>;for(const manifest of loadCatalog())if((manifest as Manifest&{runtime?:string}).runtime==='legacy-preserved')verified[manifest.id]=true;return verified}catch{return {} as Record<string,boolean>}}
