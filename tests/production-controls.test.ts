import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,rmdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {hotSeatConnectSources} from '../src/lib/product/connect-policy';
const dir=mkdtempSync(join(tmpdir(),'pmforge-prod-'));
process.env.PMFORGE_DATABASE_PATH=join(dir,'limits.sqlite');
test('CSP allows only the configured secure LiveKit origins',()=>{
  const valid=hotSeatConnectSources('wss://room.example.org');
  assert.match(valid,/wss:\/\/room.example.org https:\/\/room.example.org/);
  for(const input of ['ws://room.example.org','wss://a.example/x','wss://u:p@a.example','wss://a.example/?x=1',"wss://a.example; script-src *",'broken'])assert.equal(hotSeatConnectSources(input),hotSeatConnectSources(undefined));
});
test('rate counters are durable database rows and cannot reset with another connection',async()=>{
  const {rateLimited,serverDatabase}=await import('../src/lib/product/server');
  const {DatabaseSync}=await import('node:sqlite');
  assert.equal(rateLimited('a',2),false);assert.equal(rateLimited('a',2),false);
  const other=new DatabaseSync(process.env.PMFORGE_DATABASE_PATH!);
  assert.equal((other.prepare('SELECT count FROM product_limits WHERE key=?').get('a') as {count:number}).count,2);
  assert.equal(rateLimited('a',2),true);assert.equal(rateLimited('b',2),false);
  other.prepare('UPDATE product_limits SET at=? WHERE key=?').run(Date.now()-61000,'a');
  assert.equal(rateLimited('a',2),false);other.close();serverDatabase().close();
});
test('production publishing fails closed before accepting personal snapshots',async()=>{
  const before=process.env.PMFORGE_DEPLOYMENT;process.env.PMFORGE_DEPLOYMENT='production';
  try{const {POST}=await import('../src/app/api/portfolio/share/route');const response=await POST(new Request('https://test.invalid/api/portfolio/share',{method:'POST',body:'{}'}));assert.equal(response.status,503);assert.match((await response.json()).error,/publishing is paused/);}finally{if(before===undefined)delete process.env.PMFORGE_DEPLOYMENT;else process.env.PMFORGE_DEPLOYMENT=before;}
});
test.after(()=>{for(const name of ['limits.sqlite','limits.sqlite-wal','limits.sqlite-shm'])rmSync(join(dir,name),{force:true});rmdirSync(dir);});
