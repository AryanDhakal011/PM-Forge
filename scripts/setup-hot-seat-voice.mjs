import {mkdir,copyFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),target=new URL('public/hot-seat/runtime/',root);
await mkdir(target,{recursive:true});
await copyFile(new URL('node_modules/kokoro-js/dist/kokoro.web.js',root),new URL('kokoro.web.js',target));
for(const file of ['ort-wasm-simd-threaded.jsep.mjs','ort-wasm-simd-threaded.jsep.wasm','ort-wasm-simd-threaded.mjs','ort-wasm-simd-threaded.wasm'])await copyFile(new URL('node_modules/onnxruntime-web/dist/'+file,root),new URL(file,target));
await copyFile(new URL('node_modules/kokoro-js/LICENSE',root),new URL('KOKORO-LICENSE.txt',target));
console.log('Hot Seat neural voice runtime prepared; model weights download only after consent.');
