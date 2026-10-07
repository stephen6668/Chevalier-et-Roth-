
const CRStore = (() => {
  const defaults = [
    {id:'p1',name:'Heritage Half-Zip',category:'Men',price:120,salePrice:null,sizes:['S','M','L','XL'],colors:['Beige','Navy','Dark Brown'],stock:24,sku:'CR-HZ-001',badge:'NEW',active:true,images:['images/signature-polo-navy-01.jpg','images/signature-polo-navy-02.jpg','images/signature-polo-navy-03.jpg'],description:'An elegant half-zip designed for a calm old-money wardrobe. Soft, refined and easy to combine with tailored trousers or denim.'},
    {id:'p2',name:'Heritage Men’s Trouser',category:'Men',price:110,salePrice:null,sizes:['30','32','34','36'],colors:['Beige','Navy','Black'],stock:18,sku:'CR-MTR-002',badge:'BESTSELLER',active:true,images:['images/heritage-halfzip-beige-01.jpg','images/heritage-halfzip-beige-02.jpg','images/heritage-halfzip-beige-03.jpg'],description:'A refined men’s trouser with a clean tailored line, comfortable fit and timeless finish. Designed for elegant everyday wear and smarter occasions.'},
    {id:'p3',name:'Maison Women’s Top',category:'Women',price:0,salePrice:null,sizes:['XS','S','M','L'],colors:['Cream','White','Black'],stock:16,sku:'CR-WTOP-003',badge:'NEW',active:true,images:['images/tailored-trouser-stone-01.jpg','images/tailored-trouser-stone-02.jpg','images/tailored-trouser-stone-03.jpg'],description:'A refined women’s top with a clean neckline, elegant proportions and a soft, minimal silhouette. Designed to pair easily with tailored trousers and skirts.'},
    {id:'p4',name:'Maison Women’s Trouser',category:'Women',price:110,salePrice:null,sizes:['XS','S','M','L'],colors:['Cream','Black','Brown'],stock:12,sku:'CR-WTR-004',badge:'',active:true,images:['images/maison-knit-top-cream-01.jpg','images/maison-knit-top-cream-02.jpg','images/maison-knit-top-cream-03.jpg'],description:'An elegant women’s trouser with a clean, flattering cut and comfortable tailored fit. Created for a polished everyday look with a quiet-luxury feel.'}
  ];
  const defaultCodes=[{code:'WELCOME10',percent:10,active:true,start:'',end:'',maxUses:100,uses:0,minOrder:0,products:[],categories:[]}];
  const get=(k,d)=>{try{const v=localStorage.getItem('cr_'+k);return v?JSON.parse(v):d}catch{return d}};
  const set=(k,v)=>localStorage.setItem('cr_'+k,JSON.stringify(v));
  (function(){
    if(localStorage.getItem('cr_catalog_update_v2')==='1') return;
    const ps=get('products',defaults);
    const u={
      p1:{name:'Heritage Half-Zip',category:'Men',price:120,salePrice:null,sku:'CR-HZ-001',badge:'NEW',description:'An elegant half-zip designed for a calm old-money wardrobe. Soft, refined and easy to combine with tailored trousers or denim.',sizes:['S','M','L','XL'],colors:['Beige','Navy','Dark Brown']},
      p2:{name:'Heritage Men’s Trouser',category:'Men',price:110,salePrice:null,sku:'CR-MTR-002',badge:'BESTSELLER',description:'A refined men’s trouser with a clean tailored line, comfortable fit and timeless finish. Designed for elegant everyday wear and smarter occasions.',sizes:['30','32','34','36'],colors:['Beige','Navy','Black']},
      p3:{name:'Maison Women’s Top',category:'Women',price:0,salePrice:null,sku:'CR-WTOP-003',badge:'NEW',description:'A refined women’s top with a clean neckline, elegant proportions and a soft, minimal silhouette. Designed to pair easily with tailored trousers and skirts.',sizes:['XS','S','M','L'],colors:['Cream','White','Black']},
      p4:{name:'Maison Women’s Trouser',category:'Women',price:110,salePrice:null,sku:'CR-WTR-004',badge:'',description:'An elegant women’s trouser with a clean, flattering cut and comfortable tailored fit. Created for a polished everyday look with a quiet-luxury feel.',sizes:['XS','S','M','L'],colors:['Cream','Black','Brown']}
    };
    set('products',ps.map(p=>u[p.id]?{...p,...u[p.id]}:p));
    localStorage.setItem('cr_catalog_update_v2','1');
  })();

  const products=()=>{
    let ps=get('products',defaults);
    const imageDefaults={
      p1:['images/signature-polo-navy-01.jpg','images/signature-polo-navy-02.jpg','images/signature-polo-navy-03.jpg'],
      p2:['images/heritage-halfzip-beige-01.jpg','images/heritage-halfzip-beige-02.jpg','images/heritage-halfzip-beige-03.jpg'],
      p3:['images/tailored-trouser-stone-01.jpg','images/tailored-trouser-stone-02.jpg','images/tailored-trouser-stone-03.jpg'],
      p4:['images/maison-knit-top-cream-01.jpg','images/maison-knit-top-cream-02.jpg','images/maison-knit-top-cream-03.jpg']
    };
    let changed=false;
    ps=ps.map(p=>{
      if((!p.images || !p.images.length) && imageDefaults[p.id]){
        changed=true; return {...p,images:imageDefaults[p.id]};
      }
      return p;
    });
    if(changed)set('products',ps);
    return ps;
  };
  const saveProducts=v=>set('products',v);
  const codes=()=>get('codes',defaultCodes);
  const saveCodes=v=>set('codes',v);
  const cart=()=>get('cart',[]);
  const saveCart=v=>{set('cart',v);window.dispatchEvent(new Event('cartchange'))};
  const orders=()=>get('orders',[]);
  const saveOrders=v=>set('orders',v);
  const price=p=>p.salePrice && Number(p.salePrice)<Number(p.price)?Number(p.salePrice):Number(p.price);
  const money=v=>new Intl.NumberFormat('de-LU',{style:'currency',currency:'EUR'}).format(Number(v)||0);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function validateCode(input,subtotal,lines){
    const code=String(input||'').trim().toUpperCase(), c=codes().find(x=>x.code===code);
    if(!c)return {ok:false,msg:'Invalid code',discount:0};
    const now=new Date();
    if(!c.active)return {ok:false,msg:'Code inactive',discount:0};
    if(c.start && now<new Date(c.start+'T00:00:00'))return {ok:false,msg:'Code not active yet',discount:0};
    if(c.end && now>new Date(c.end+'T23:59:59'))return {ok:false,msg:'Code expired',discount:0};
    if(c.maxUses && c.uses>=c.maxUses)return {ok:false,msg:'Usage limit reached',discount:0};
    if(subtotal<Number(c.minOrder||0))return {ok:false,msg:'Minimum order value not reached',discount:0};
    let eligible=subtotal;
    if((c.products||[]).length || (c.categories||[]).length){
      eligible=lines.filter(x=>(c.products||[]).includes(x.product.id)||(c.categories||[]).includes(x.product.category))
                    .reduce((s,x)=>s+price(x.product)*x.qty,0);
      if(!eligible)return {ok:false,msg:'Code is not valid for these products',discount:0};
    }
    return {ok:true,msg:`${c.percent}% applied`,discount:eligible*(Number(c.percent)/100),code:c};
  }
  return {products,saveProducts,codes,saveCodes,cart,saveCart,orders,saveOrders,price,money,esc,validateCode,get,set};
})();
