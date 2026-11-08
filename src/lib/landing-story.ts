export const STORY_CHAPTERS=["hero","monday","first-decision","how-it-works","proof","practice","simulations","trust","help","closing","footer"] as const;
/** Bounded, deterministic clock montage; final hands and labels agree at Monday 9:02. */
export function clockStoryFrame(progress:number){
  const p=Math.max(0,Math.min(1,Number.isFinite(progress)?progress:1)),eased=1-(1-p)**3;
  const minutes=362+Math.round(180*eased);
  return {day:p<.3?"SATURDAY":p<.65?"SUNDAY":"MONDAY",time:`${Math.floor(minutes/60)}:${String(minutes%60).padStart(2,'0')}`,hourDegrees:minutes/2,minuteDegrees:minutes*6};
}
