import {runPolicies} from './policy';
self.onmessage=async(event:MessageEvent)=>{try{const {definition,seed}=event.data;const results=await runPolicies(definition,seed,['careful','bold']);self.postMessage({results})}catch{self.postMessage({error:'The comparison could not finish.'})}};
