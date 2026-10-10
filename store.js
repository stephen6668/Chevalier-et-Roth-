
const CRStore = (() => {
  const defaults = [
    {id:'p1',name:'Heritage Half-Zip',category:'Men',price:110,salePrice:null,sizes:['S','M','L','XL'],colors:['Beige','Navy','Dark Brown'],stock:24,sku:'CR-HZ-001',badge:'NEW',active:true,images:['images/signature-polo-navy-01.jpg','images/signature-polo-navy-02.jpg','images/signature-polo-navy-03.jpg'],description:'A refined half-zip with a clean silhouette, balanced proportions and an understated finish. Designed in Luxembourg and produced in Italy for a wardrobe built around timeless European elegance.'},
    {id:'p2',name:'Heritage Men’s Trouser',category:'Men',price:100,salePrice:null,sizes:['30','32','34','36'],colors:['Beige','Navy','Black'],stock:18,sku:'CR-MTR-002',badge:'',active:true,images:['images/heritage-halfzip-beige-01.jpg','images/heritage-halfzip-beige-02.jpg','images/heritage-halfzip-beige-03.jpg'],description:'A tailored men’s trouser with a clean line and comfortable, refined fit. Designed to sit close to the body without feeling tight, with Italian production and a versatile finish for everyday and formal styling.'},
    {id:'p3',name:'Maison Women’s Cardigan',category:'Women',price:90,salePrice:null,sizes:['XS','S','M','L'],colors:['Cream','White','Black'],stock:16,sku:'CR-WCAR-003',badge:'NEW',active:true,images:['images/tailored-trouser-stone-01.jpg','images/tailored-trouser-stone-02.jpg','images/tailored-trouser-stone-03.jpg'],description:'An elegant women’s cardigan with refined proportions and a soft, clean silhouette. Designed in Luxembourg and produced in Italy as a versatile layer for a polished everyday wardrobe.'},
    {id:'p4',name:'Maison Women’s Trouser',category:'Women',price:100,salePrice:null,sizes:['XS','S','M','L'],colors:['Cream','Black','Brown'],stock:12,sku:'CR-WTR-004',badge:'',active:true,images:['images/maison-knit-top-cream-01.jpg','images/maison-knit-top-cream-02.jpg','images/maison-knit-top-cream-03.jpg'],description:'A refined women’s trouser with an elegant, comfortable cut that follows the body without feeling restrictive. Designed in Luxembourg, produced in Italy and created to pair naturally with the Maison collection.'}
  ];
  const defaultCodes=[{code:'WELCOME10',percent:10,active:true,start:'',end:'',maxUses:100,uses:0,minOrder:0,products:[],categories:[]}];
  const get=(k,d)=>{try{const v=localStorage.getItem('cr_'+k);return v?JSON.parse(v):d}catch{return d}};
  const set=(k,v)=>localStorage.setItem('cr_'+k,JSON.stringify(v));
  (function(){
    if(localStorage.getItem('cr_catalog_update_v3')==='1') return;
    const ps=get('products',defaults);
    const u={
      p1:{name:'Heritage Half-Zip',category:'Men',price:110,salePrice:null,sku:'CR-HZ-001',badge:'NEW',description:'A refined half-zip with a clean silhouette, balanced proportions and an understated finish. Designed in Luxembourg and produced in Italy for a wardrobe built around timeless European elegance.',sizes:['S','M','L','XL'],colors:['Beige','Navy','Dark Brown']},
      p2:{name:'Heritage Men’s Trouser',category:'Men',price:100,salePrice:null,sku:'CR-MTR-002',badge:'',description:'A tailored men’s trouser with a clean line and comfortable, refined fit. Designed to sit close to the body without feeling tight, with Italian production and a versatile finish for everyday and formal styling.',sizes:['30','32','34','36'],colors:['Beige','Navy','Black']},
      p3:{name:'Maison Women’s Cardigan',category:'Women',price:90,salePrice:null,sku:'CR-WCAR-003',badge:'NEW',description:'An elegant women’s cardigan with refined proportions and a soft, clean silhouette. Designed in Luxembourg and produced in Italy as a versatile layer for a polished everyday wardrobe.',sizes:['XS','S','M','L'],colors:['Cream','White','Black']},
      p4:{name:'Maison Women’s Trouser',category:'Women',price:100,salePrice:null,sku:'CR-WTR-004',badge:'',description:'A refined women’s trouser with an elegant, comfortable cut that follows the body without feeling restrictive. Designed in Luxembourg, produced in Italy and created to pair naturally with the Maison collection.',sizes:['XS','S','M','L'],colors:['Cream','Black','Brown']}
    };
    set('products',ps.map(p=>u[p.id]?{...p,...u[p.id]}:p));
    localStorage.setItem('cr_catalog_update_v3','1');
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
  const vatRate=()=>Number(window.CRSiteConfig?.vatRate ?? 0.17);
  const vatOnNet=net=>(Number(net)||0)*vatRate();
  const grossFromNet=net=>(Number(net)||0)+vatOnNet(net);
  const vatFromGross=gross=>{
    const r=vatRate();
    return r>0 ? (Number(gross)||0)*r/(1+r) : 0;
  };
  const netFromGross=gross=>(Number(gross)||0)-vatFromGross(gross);
  const vatPercent=()=>Math.round(vatRate()*100);
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
  return {products,saveProducts,codes,saveCodes,cart,saveCart,orders,saveOrders,price,money,vatRate,vatOnNet,grossFromNet,vatFromGross,netFromGross,vatPercent,esc,validateCode,get,set};
})();
