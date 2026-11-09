/** Reject obvious recognition loops; never rewrite a candidate's captured words. */
export function usableDictation(text:string,seconds:number){
  const words=text.toLowerCase().replace(/[^a-z0-9' ]/g,' ').trim().split(/\s+/).filter(Boolean);
  if(!words.length||words.length>Math.max(25,seconds*6))return false;
  const grams=new Map<string,number>();
  for(let i=0;i+3<words.length;i++){const phrase=words.slice(i,i+4).join(' '),n=(grams.get(phrase)||0)+1;grams.set(phrase,n);if(n>5)return false;}
  return true;
}
