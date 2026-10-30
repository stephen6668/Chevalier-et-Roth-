(()=>{const hd=()=>document.querySelector('.header')?.classList.toggle('scrolled',scrollY>8);
addEventListener('scroll',hd,{passive:true});
document.addEventListener('DOMContentLoaded',()=>{hd();const m=document.querySelector('.lx-mono');if(!m)return;
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){m.classList.add('in');io.disconnect()}}),{threshold:.3});io.observe(m);
if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;let t=0;
const up=()=>{t=0;const r=m.getBoundingClientRect(),v=innerHeight;m.style.setProperty('--p',Math.min(1,Math.max(0,(v-r.top)/(v+r.height))).toFixed(3))};
addEventListener('scroll',()=>{t||(t=requestAnimationFrame(up))},{passive:true});up()})})();

