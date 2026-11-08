import 'server-only';
const integer=(key:string,fallback:number,min:number,max:number)=>{const v=Number(process.env[key]??fallback);return Number.isInteger(v)&&v>=min&&v<=max?v:fallback};
const money=(key:string)=>{const v=Number(process.env[key]||0);return Number.isFinite(v)&&v>=0&&v<=100000?v:0};
export function aiConfig(){const mode=process.env.PMFORGE_AI_MODE||'guided';return {
 localTestRequested:process.env.PMFORGE_AI_LOCAL_TEST==='true',
 localTest:process.env.PMFORGE_AI_LOCAL_TEST==='true'&&process.env.PMFORGE_DEPLOYMENT!=='production',
 mode:mode==='free-pilot'||mode==='production'?mode:'guided',
 model:process.env.PMFORGE_AI_MODEL||'gemini-3.1-flash-lite',
 transport:process.env.PMFORGE_AI_TRANSPORT==='interactions'?'interactions':'generate-content',
 key:process.env.GEMINI_API_KEY||'',
 maxTurns:integer('PMFORGE_AI_MAX_TURNS',10,2,16),
 dailySessions:integer('PMFORGE_AI_DAILY_SESSIONS_PER_USER',2,1,20),
 concurrent:integer('PMFORGE_AI_MAX_CONCURRENT_SESSIONS',2,1,50),
 rpm:integer('PMFORGE_AI_PROJECT_RPM',0,0,10000),
 tpm:integer('PMFORGE_AI_PROJECT_TPM',0,0,10000000),
 rpd:integer('PMFORGE_AI_PROJECT_RPD',0,0,1000000),
 monthlyBudget:money('PMFORGE_AI_MONTHLY_BUDGET_USD'),
 freeVerified:process.env.PMFORGE_AI_FREE_TIER_VERIFIED==='true',
 termsApproved:process.env.PMFORGE_AI_TERMS_APPROVED==='true',
 personalApproved:process.env.PMFORGE_AI_PERSONAL_DATA_APPROVED==='true',
 regions:(process.env.PMFORGE_AI_ALLOWED_REGIONS||'').split(',').map(s=>s.trim().toUpperCase()).filter(s=>/^[A-Z]{2}$/.test(s)),
 killed:process.env.PMFORGE_AI_KILL_SWITCH==='true',
 timebox:integer('PMFORGE_AI_TIMEBOX_SECONDS',720,60,3600),
 maxOutput:700,maxContextBytes:14000,timeoutMs:integer('PMFORGE_AI_TIMEOUT_MS',20000,3000,30000),
 inputRate:money('PMFORGE_AI_INPUT_USD_PER_MILLION'),
 outputRate:money('PMFORGE_AI_OUTPUT_USD_PER_MILLION'),
 billableOutputReserve:integer('PMFORGE_AI_BILLABLE_OUTPUT_TOKEN_RESERVE',0,0,131072),
 mock:process.env.NODE_ENV!=='production'&&process.env.PMFORGE_AI_TEST_PROVIDER==='mock',
 }}
export type AIConfig=ReturnType<typeof aiConfig>;
export function availability(c=aiConfig()):string|null{
 if(c.localTestRequested&&!c.localTest)return 'Local AI testing is disabled on deployments.';
 if(c.localTest&&c.mode!=='free-pilot')return 'Local AI testing requires the fictional $0 pilot.';
 if(c.killed)return 'AI interviews are paused by the operator. Guided practice is available.';
 if(c.mode==='guided')return 'Guided practice is available. AI interviews are not enabled on this workspace.';
 if(c.mock)return null;
 if(!c.key)return 'The AI provider has not been connected. Your guided practice is ready.';
 if(!c.termsApproved||!c.regions.length)return 'AI pilot eligibility and data terms need operator review.';
 if(!c.rpm||!c.tpm||!c.rpd)return 'The operator has not verified this project’s AI capacity yet.';
 if(!['gemini-3.7-flash','gemini-3.8-flash','gemini-3.1-flash-lite'].includes(c.model))return 'This model needs a reviewed provider configuration.';
 if(c.mode==='free-pilot'&&(!c.freeVerified||c.monthlyBudget!==0))return 'The free project plan must be verified before the $0 pilot opens.';
 if(c.mode==='production'&&(!c.monthlyBudget||!c.inputRate||!c.outputRate||c.billableOutputReserve<c.maxOutput))return 'Production AI needs an approved budget, token prices and a verified billable output allowance.';
 return null;
}
