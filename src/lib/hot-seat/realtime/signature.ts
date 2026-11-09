import {createHmac,timingSafeEqual} from 'node:crypto';
export function signWorkerBody(body:string,stamp:string,secret:string) {
  return createHmac('sha256',secret).update('pmforge-hot-seat-worker-v1\n'+stamp+'\n'+body).digest('hex');
}
export function validWorkerSignature(body:string,stamp:string|null,signature:string|null,secret:string,now=Date.now()) {
  if(secret.length<32 || !stamp || !/^\d{13}$/.test(stamp) || Math.abs(now-Number(stamp))>60000 || !signature || !/^[a-f0-9]{64}$/.test(signature))return false;
  return timingSafeEqual(Buffer.from(signWorkerBody(body,stamp,secret),'hex'),Buffer.from(signature,'hex'));
}
