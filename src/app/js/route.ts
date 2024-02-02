import { cookies } from "next/headers";

export async function GET() {
  //return a javascript file that will fetch the visitor count
  return new Response(
    `var t;!function(){var n,e=[],o=!1;function c(){o=!0,document.removeEventListener("DOMContentLoaded",c),e.forEach((t=>t.call(document))),e=[]}n=function(t){o||"interactive"===document.readyState||"complete"===document.readyState?t.call(document):(e.push(t),document.addEventListener("DOMContentLoaded",c))};({fetch:async function(e){const o=\`\${document.currentScript.src.includes("cn.vercount.one") ? "https://cn.vercount.one" : "https://vercount.one"}/log?jsonpCallback=VisitorCountCallback\`;try{const t=await fetch(o,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:window.location.href})}),c=await t.json();n((()=>e(c)))}catch(n){console.error("Error fetching visitor count:",n),t.hideAll()}}}).fetch((t={counterIds:["site_pv","page_pv","site_uv"],updateText:function(t){this.counterIds.forEach((n=>{const e=document.getElementById("busuanzi_value_"+n);e&&(e.textContent=t[n]||"0")}))},hideAll:function(){this.counterIds.forEach((t=>{const n=document.getElementById("busuanzi_container_"+t);n&&(n.style.display="none")}))},showAll:function(){this.counterIds.forEach((t=>{const n=document.getElementById("busuanzi_container_"+t);n&&(n.style.display="inline")}))}}).updateText.bind(t))}();`,
    {
      headers: {
        "content-type": "application/javascript",
      },
    },
  );
}
