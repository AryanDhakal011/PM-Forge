import { people, type Person } from "@/lib/trojan-horse/content";
import s from "./TrojanHorseSceneRunner.module.css";
export function Portrait({ id, emotion = "thinking" }: { id: Person; emotion?: string }) {
  const p = people[id], index = Object.keys(people).indexOf(id);
  const skins = ["#b77758", "#bf9274", "#e8b99a", "#b77a57", "#b67c5d", "#ad7356"];
  const expression = emotion === "warm" || emotion === "approving" ? "approving" : emotion === "firm" ? "annoyed" : emotion === "concerned" ? "thinking" : "neutral";
  return <svg className={s.portrait} viewBox="0 0 100 110" role="img" aria-label={`${p.name}, ${expression}`}>
    <rect width="100" height="110" rx="24" fill={p.color + "20"}/><path d="M5 110Q9 74 50 78q41-4 45 32" fill={p.color}/>
    <path d={index % 2 === 0 ? "M22 62V32Q22 6 50 8q31 1 31 27v41L65 60z" : "M23 43Q18 12 50 10q34 1 28 35z"} fill={id === "omar" ? "#c4b7aa" : "#30252e"}/>
    <ellipse cx="50" cy="44" rx={id === "omar" ? 26 : 23} ry="29" fill={skins[index]}/>
    <path d={id === "dani" ? "M26 35Q26 10 54 14q25 1 22 24L58 23z" : id === "tomas" ? "M25 33Q23 13 49 12q25 0 27 23L49 24z" : "M26 35Q23 10 52 12q25 0 24 22L62 21z"} fill={id === "omar" ? "#c4b7aa" : "#30252e"}/>
    <ellipse cx="40" cy="43" rx="5.4" ry="4.8" fill="#fff5ea"/><ellipse cx="61" cy="43" rx="5.4" ry="4.8" fill="#fff5ea"/><circle cx="41" cy="43" r="2.8" fill="#322830"/><circle cx="60" cy="43" r="2.8" fill="#322830"/>
    <path d={expression === "thinking" ? "M34 34l11 2m11 0 10-2" : "M34 35q6-3 11 0m11 0q6-3 10 0"} stroke="#483039" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M50 44l-3 9h5" stroke="#8c5847" strokeWidth="1.4" fill="none"/><path d={expression === "approving" ? "M42 60q8 7 17 0" : "M43 62q7-2 14 0"} stroke="#744638" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {id === "omar" && <g fill="none" stroke="#3f3946" strokeWidth="1.6"><rect x="32" y="37" width="16" height="13" rx="4"/><rect x="53" y="37" width="16" height="13" rx="4"/><path d="M48 42h5"/></g>}
    {id === "tomas" && <path d="M30 83h40l5 27H25z" fill="#e8d3ab"/>}{id === "rhea" && <path d="M25 43V32q25-28 50 0v14l-7 8" stroke="#293d39" strokeWidth="3" fill="none"/>}{id === "priya" && <path d="M31 82l19 28 20-28" stroke="#f3e7e4" strokeWidth="5" fill="none"/>}
  </svg>;
}
