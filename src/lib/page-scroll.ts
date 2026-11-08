const locks=new Set<symbol>();let original="";
export function lockPageScroll(){const token=Symbol();if(!locks.size)original=document.body.style.overflow;locks.add(token);document.body.style.overflow="hidden";return()=>{if(!locks.delete(token))return;if(!locks.size)document.body.style.overflow=original;};}
/** Auth/recovery surfaces must never inherit a departed room or modal's scroll lock. */
export function resetPageScroll(){locks.clear();original="";document.body.style.removeProperty("overflow");document.documentElement.style.removeProperty("overflow");document.body.classList.remove("no-scroll");}
