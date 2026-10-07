
const CRStore = (() => {
  const defaults = [
    {id:'p1',name:'Signature Polo',category:'Men',price:90,salePrice:null,sizes:['S','M','L','XL'],colors:['Navy','White','Beige'],stock:24,sku:'CR-POLO-001',badge:'NEW',active:true,images:[],description:'A refined polo with clean proportions and understated Chevalier & Roth character.'},
    {id:'p2',name:'Heritage Half-Zip',category:'Men',price:120,salePrice:null,sizes:['S','M','L','XL'],colors:['Beige','Navy','Dark Brown'],stock:18,sku:'CR-HZ-002',badge:'BESTSELLER',active:true,images:[],description:'An elegant half-zip designed for a calm old-money wardrobe.'},
    {id:'p3',name:'Tailored Trouser',category:'Men',price:100,salePrice:null,sizes:['30','32','34','36'],colors:['Stone','Black','Navy'],stock:16,sku:'CR-TR-003',badge:'',active:true,images:[],description:'Comfortable tailored trousers with a clean leg and refined drape.'},
    {id:'p4',name:'Maison Knit Top',category:'Women',price:95,salePrice:79,sizes:['XS','S','M','L'],colors:['Cream','Black','Brown'],stock:12,sku:'CR-WT-004',badge:'SALE',active:true,images:[],description:'A minimalist knit top with polished lines and a premium visual language.'}
  ];
  const defaultCodes=[{code:'WELCOME10',percent:10,active:true,start:'',end:'',maxUses:100,uses:0,minOrder:0,products:[],categories:[]}];
  const get=(k,d)=>{try{const v=localStorage.getItem('cr_'+k);return v?JSON.parse(v):d}catch{return d}};
  const set=(k,v)=>localStorage.setItem('cr_'+k,JSON.stringify(v));
  const products=()=>get('products',defaults);
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
