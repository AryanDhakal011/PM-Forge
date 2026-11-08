/** Stable persona assignments independent of the currently selected persona. */
export type DeviceVoice = {name:string;lang:string;voiceURI:string;default?:boolean};
export function chooseDeviceVoice<T extends DeviceVoice>(voices:T[], personaId:string):T|undefined {
  const english=voices.filter(v=>/^en(?:[-_]|$)/i.test(v.lang));
  const pool=english.length?english:voices;
  const rank=(v:T)=> /Aria|Jenny|Samantha|Zira|Google US English/i.test(v.name)?0:/Michelle|Libby|Karen|Moira|Google UK English Female|Susan|Hazel|Female/i.test(v.name)?1:2;
  const ordered=[...pool].sort((a,b)=>rank(a)-rank(b)||a.voiceURI.localeCompare(b.voiceURI)||a.name.localeCompare(b.name));
  return personaId==='kai' ? ordered.find(v=>v.voiceURI!==ordered[0]?.voiceURI)||ordered[0] : ordered[0];
}
