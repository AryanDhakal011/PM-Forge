import {DatabaseSync} from 'node:sqlite';
import {execFileSync} from 'node:child_process';
import {copyFileSync,mkdirSync,readdirSync,statSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
const source=resolve(process.env.PMFORGE_DATABASE_PATH||'.data/pmforge.sqlite');
statSync(source);const base=resolve('.data/backup-drill-'+Date.now()),backups=join(base,'backups');mkdirSync(base,{recursive:true,mode:0o700});
execFileSync(process.execPath,['scripts/backup-data.mjs'],{env:{...process.env,PMFORGE_DATABASE_PATH:source,PMFORGE_BACKUP_DIR:backups},stdio:'pipe'});
const file=readdirSync(backups).find(name=>name.endsWith('.sqlite'));if(!file)throw Error('No backup produced.');
const restored=join(base,'restored.sqlite');copyFileSync(join(backups,file),restored);
const db=new DatabaseSync(restored,{readOnly:true});let tables=0;
try{if(db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('Integrity failure.');if(db.prepare('PRAGMA foreign_key_check').all().length)throw Error('Foreign key failure.');const names=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();for(const {name} of names){if(!/^[a-zA-Z0-9_-]+$/.test(name))throw Error('Unexpected table name.');db.prepare('SELECT count(*) n FROM "'+name+'"').get();tables++;}}finally{db.close();}
mkdirSync('docs/production-verification',{recursive:true});const report={at:new Date().toISOString(),source:'existing local application database; contents not logged',backup:'VACUUM INTO verified snapshot',restore:'independent private local copy; integrity, foreign keys and all table queries passed',tables,offHostEncryptedRestore:'NOT TESTED',publicDeploymentRollback:'NOT TESTED'};writeFileSync('docs/production-verification/backup-restore.json',JSON.stringify(report,null,2));console.log(report);
