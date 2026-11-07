// Active-play estimates, not the fictional weeks/months inside a campaign.
export const projectTimes:Record<string,[number,number]>={deadlock:[20,30],'sacred-no':[15,25],'ghost-metric':[20,30],'trojan-horse':[25,40],'invisible-wall':[20,30],'feature-factory':[25,40],'silent-churn':[35,50],'legacy-fracture':[30,45],'pivot-point':[25,40],'shadow-roadmap':[15,25],'public-fracture':[15,25],'last-mile':[20,35]};
export function projectDuration(id:string){const range=projectTimes[id]||[15,25];return {minutes:Math.round((range[0]+range[1])/2),label:`${range[0]}–${range[1]} min`,range}}
