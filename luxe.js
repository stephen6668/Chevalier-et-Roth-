/* CHEVALIER & ROTH — accessible motion system */
(()=>{
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const intro=()=>{const el=document.getElementById('crIntro');if(!el)return;const dismiss=()=>{el.classList.add('is-leaving');window.setTimeout(()=>el.remove(),950)};if(reduced){el.remove();return}window.setTimeout(dismiss,2600);el.addEventListener('click',dismiss,{once:true})};
 const reveal=()=>{if(reduced)return;const nodes=document.querySelectorAll('.section,.section-head,.card,.story,.newsletter,.cart-item,.summary,.checkout-card,.checkout-summary,.lx-world,.page-title');if(!('IntersectionObserver'in window)){nodes.forEach(n=>n.classList.add('cr-visible'));return}const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('cr-visible');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -36px 0px'});nodes.forEach((n,i)=>{n.classList.add('cr-reveal');if(n.classList.contains('card'))n.style.setProperty('--cr-delay',((i%4)*85)+'ms');io.observe(n)})};
 const progress=()=>{let ticking=false;const update=()=>{const max=document.documentElement.scrollHeight-innerHeight;document.documentElement.style.setProperty('--cr-scroll',max>0?(scrollY/max):0);ticking=false};addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(update);ticking=true}},{passive:true});update()};
 const start=()=>{intro();reveal();progress()};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
