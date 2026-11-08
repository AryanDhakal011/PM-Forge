import {mkdirSync,writeFileSync} from 'node:fs';
import {authEmail} from '../src/lib/product/auth-email-template';
mkdirSync('docs/email-preview',{recursive:true});
for(const kind of ['verify','reset'] as const){
 const url=new URL('/auth/'+kind,'http://localhost:3002');
 url.searchParams.set('example','visual-sample-not-an-account-link');
 writeFileSync('docs/email-preview/'+kind+'.html',authEmail(kind,url.href).html);
}
console.log('Created two visual samples. No account credentials or emails were created.');
