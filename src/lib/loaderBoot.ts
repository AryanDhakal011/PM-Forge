/**
 * Runs synchronously in <head> before the first paint.
 *
 * It only does two things: choose the pre-hydration loader variant and lock the
 * document so the first frame cannot scroll behind the overlay. Everything
 * else belongs to LoaderOverlay. Kept as a string because it must execute
 * before React (and therefore before any module) hydrates.
 */
import { LOADER_TIMING } from "./loaderTokens";

/** Give the client a moment past the hard max to fail over on its own. */
const WATCHDOG_MS = LOADER_TIMING.hardMax * 1000 + 1500;

export const LOADER_BOOT_SCRIPT = `(function(){try{
var html=document.documentElement;
if(location.pathname!=="/")return;
var reduce=false;
try{reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;}catch(e){}
var stored=null;
try{stored=localStorage.getItem("pmforge.reducedMotion")||localStorage.getItem("pmforge.motion");}catch(e){}
var fade=reduce||stored==="reduce";
if(!fade&&location.hash&&location.hash!=="#top")fade=true;
var seen=false;
try{seen=sessionStorage.getItem("pmforge.loader.seen")==="1";}catch(e){}
html.setAttribute("data-loader-boot",fade?"fade":seen?"repeat":"full");
html.classList.add("is-loading");
window.setTimeout(function(){
if(html.getAttribute("data-loader-done")==="true")return;
html.classList.add("loader-failed");
html.classList.remove("is-loading");
if(document.body)document.body.classList.remove("no-scroll");
var nodes=document.querySelectorAll("[inert]");
for(var i=0;i<nodes.length;i++){nodes[i].removeAttribute("inert");}
},${WATCHDOG_MS});
}catch(e){}})();`;
