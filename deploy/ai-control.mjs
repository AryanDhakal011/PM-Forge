import {DatabaseSync} from 'node:sqlite';
const db=new DatabaseSync(process.env.PMFORGE_DATABASE_PATH||'.data/pmforge.sqlite');
const action=process.argv[2]||'status',exists=table=>!!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table);
db.exec('PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS ai_control (key TEXT PRIMARY KEY,value TEXT NOT NULL)');
try{
 if(action==='kill'||action==='resume'){db.prepare("INSERT INTO ai_control VALUES('kill',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(action==='kill'?'true':'false');console.log(action==='kill'?'AI admission paused. In-flight calls may finish. Guided practice remains available.':'Shared AI pause cleared. Configuration and budget checks still apply.')}
 else if(action==='cleanup'){
  db.exec('BEGIN IMMEDIATE');try{const now=Date.now();if(exists('ai_sessions'))for(const row of db.prepare('SELECT run_id FROM ai_sessions WHERE expires<?').all(now))for(const table of ['ai_requests','ai_turns','ai_native','ai_policies','ai_consents','ai_sessions'])if(exists(table))db.prepare(`DELETE FROM ${table} WHERE run_id=?`).run(row.run_id);if(exists('ai_guests'))db.prepare('DELETE FROM ai_guests WHERE expires<?').run(now);if(exists('ai_usage'))db.prepare('DELETE FROM ai_usage WHERE at<?').run(now-90*86400000);if(exists('ai_daily'))db.prepare('DELETE FROM ai_daily WHERE day<?').run(new Date(now-90*86400000).toISOString().slice(0,10));db.exec('COMMIT');console.log('Expired private AI material and old operational records removed.')}catch(error){db.exec('ROLLBACK');throw error}
 }else if(action==='status'){
  const pause=db.prepare("SELECT value FROM ai_control WHERE key='kill'").get();
  const usage=exists('ai_usage')?db.prepare('SELECT outcome,COUNT(*) attempts,SUM(input_tokens) input_tokens,SUM(output_tokens) output_tokens,SUM(thought_tokens) thought_tokens,SUM(cost_micro)/1000000.0 reserved_usd FROM ai_usage GROUP BY outcome').all():[];
  console.log(JSON.stringify({mode:process.env.PMFORGE_AI_MODE||'guided',sharedPause:pause?.value==='true',monthlyBudgetUSD:Number(process.env.PMFORGE_AI_MONTHLY_BUDGET_USD)||0,usage},null,2));
 }else throw Error('Use status, kill, resume or cleanup.');
}finally{db.close()}
