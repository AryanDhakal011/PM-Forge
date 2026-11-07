import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,chmodSync} from 'node:fs';
import {resolve,join,relative,isAbsolute} from 'node:path';
const source=resolve(process.env.PMFORGE_DATABASE_PATH||'.data/pmforge.sqlite'),directory=resolve(process.env.PMFORGE_BACKUP_DIR||'/backups');
const withinPublic=relative(resolve('public'),directory);
if(!withinPublic||(!withinPublic.startsWith('..')&&!isAbsolute(withinPublic)))throw Error('Backups must stay outside public assets.');
mkdirSync(directory,{recursive:true,mode:0o700});const target=join(directory,'pmforge-'+new Date().toISOString().replace(/[:.]/g,'-')+'.sqlite'),db=new DatabaseSync(source);try{db.prepare('VACUUM INTO ?').run(target);chmodSync(target,0o600);const check=new DatabaseSync(target,{readOnly:true});try{if(check.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('Backup integrity check failed.')}finally{check.close()}console.log('Verified database backup:',target)}finally{db.close()}
