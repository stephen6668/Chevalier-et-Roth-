/* CR opening signature — short, accessible intro animation */
(()=>{const start=()=>{const intro=document.getElementById('crIntro');if(!intro)return;
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const dismiss=()=>{intro.classList.add('is-leaving');window.setTimeout(()=>intro.remove(),950)};
if(reduced){dismiss();return}
window.setTimeout(dismiss,2600);
intro.addEventListener('click',dismiss,{once:true});
};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();})();