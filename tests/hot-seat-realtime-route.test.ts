import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,rmdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const directory=mkdtempSync(join(tmpdir(),'pmforge-rt-route-'));
process.env.PMFORGE_DATABASE_PATH=join(directory,'test.sqlite');
process.env.PMFORGE_REALTIME_ENABLED='false';
process.env.BETTER_AUTH_URL='http://localhost:3002';
test('public capability never exposes keys or enables an unconfigured paid room',async()=>{
  const {GET}=await import('../src/app/api/hot-seat/realtime/route');
  const response=await GET(),data=await response.json();
  assert.equal(data.available,false);assert.match(data.reason,/not enabled/);
  assert.equal(data.consentVersion,'hot-seat-realtime-2026-11-09');
  assert.equal(response.headers.get('Cache-Control'),'no-store');
  for(const field of ['key','secret','workerSecret','token'])assert.equal(field in data,false);
});
test('cross-origin room requests are rejected before identity or provider calls',async()=>{
  const {POST}=await import('../src/app/api/hot-seat/realtime/route');
  const response=await POST(new Request('http://localhost:3002/api/hot-seat/realtime',{method:'POST',headers:{origin:'https://untrusted.invalid','Content-Type':'application/json'},body:'{}'}));
  assert.equal(response.status,403);assert.equal((await response.json()).error,'origin-rejected');
});
test('worker endpoint rejects unsigned forged transcript writes',async()=>{
  const {POST}=await import('../src/app/api/hot-seat/realtime/worker/route');
  const response=await POST(new Request('http://localhost:3002/api/hot-seat/realtime/worker',{method:'POST',body:JSON.stringify({kind:'turn',text:'forged'})}));
  assert.equal(response.status,401);assert.equal((await response.json()).error,'worker-authentication-required');
});
test.after(async()=>{
  const {serverDatabase}=await import('../src/lib/product/server');serverDatabase().close();
  for(const name of ['test.sqlite','test.sqlite-wal','test.sqlite-shm'])rmSync(join(directory,name),{force:true});rmdirSync(directory);
});
