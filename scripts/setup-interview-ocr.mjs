import {mkdir,copyFile,readdir,writeFile,readFile,access} from 'node:fs/promises';
import {join} from 'node:path';
const dest='public/interview-ocr';
await mkdir(join(dest,'core'),{recursive:true});await mkdir(join(dest,'lang'),{recursive:true});
await copyFile('node_modules/tesseract.js/dist/worker.min.js',join(dest,'worker.min.js'));
for(const file of await readdir('node_modules/tesseract.js-core'))if(/-lstm\.(wasm(?:\.js)?|js)$/.test(file))await copyFile(join('node_modules/tesseract.js-core',file),join(dest,'core',file));
await copyFile('node_modules/tesseract.js/LICENSE.md',join(dest,'TESSERACT-LICENSE.md'));
await copyFile('node_modules/tesseract.js-core/LICENSE',join(dest,'CORE-LICENSE'));
const lang=join(dest,'lang/eng.traineddata.gz');try{await access(lang)}catch{const response=await fetch('https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz',{signal:AbortSignal.timeout(60000)});if(!response.ok)throw Error('English OCR data could not download');await writeFile(lang,Buffer.from(await response.arrayBuffer()))}
const notice='Optional local equation OCR. Tesseract.js 7, tesseract.js-core, and English Tesseract training data. Apache-2.0; licenses included. Assets load only when handwriting recognition is requested. No drawing is uploaded.\n';
if(await readFile(join(dest,'README.txt'),'utf8').catch(()=>'')!==notice)await writeFile(join(dest,'README.txt'),notice);
console.log('Interview OCR worker, core and language data are ready locally.');
