"use client";
import {IndexedDBBackend,SaveService} from './save';
export const projectBackend=new IndexedDBBackend();
export const projectSaves=new SaveService(projectBackend);
const fallback=new Map<string,string>();
const requests=new Map<string,Promise<{data:unknown;offline:boolean}>>(),fresh=new Map<string,number>();
class ReleaseResponseError extends Error{constructor(message:string,readonly status:number){super(message)}}
export async function cachedJson<T>(key:string,url:string):Promise<{data:T;offline:boolean}>{const text=fallback.get(key);if(key.startsWith('definition-')&&text&&Date.now()-(fresh.get(key)||0)<10000)return {data:JSON.parse(text) as T,offline:false};const pending=requests.get(key);if(pending)return pending as Promise<{data:T;offline:boolean}>;const request=loadJson<T>(key,url);requests.set(key,request);try{return await request}finally{if(requests.get(key)===request)requests.delete(key)}}
async function loadJson<T>(key:string,url:string):Promise<{data:T;offline:boolean}>{try{const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw new ReleaseResponseError((await response.json()).error||'Unavailable',response.status);const text=await response.text();if(fallback.size>=32){const oldest=fallback.keys().next().value!;fallback.delete(oldest);fresh.delete(oldest)}fallback.set(key,text);fresh.set(key,Date.now());try{await projectBackend.atomic([['pmf:cache:'+key,text]])}catch{}return {data:JSON.parse(text) as T,offline:false}}catch(error){if(error instanceof ReleaseResponseError&&[403,404,503].includes(error.status))throw error;const text=await projectBackend.get('pmf:cache:'+key).catch(()=>null)||fallback.get(key);if(!text)throw error;return {data:JSON.parse(text) as T,offline:true}}}
