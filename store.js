const CRStore = (() => {
  const autoImagesForNumber=n=>[1,2,3,4].map(i=>`images/produkt${n}-${i}.jpg`);
  const defaults = [
    {id:'p1',name:'Heritage Half-Zip',category:'Men',price:110,salePrice:null,sizes:['S','M','L','XL'],colors:['Beige','Navy','Dark Brown'],stock:24,sku:'CR-HZ-001',badge:'NEW',active:true,images:autoImagesForNumber(1),description:'A refined half-zip with a clean silhouette, balanced proportions and an understated finish. Designed in Luxembourg and produced in Italy for a wardrobe built around timeless European elegance.'},
    {id:'p2',name:'Heritage Men’s Trouser',category:'Men',price:100,salePrice:null,sizes:['30','32','34','36'],colors:['Beige','Navy','Black'],stock:18,sku:'CR-MTR-002',badge:'',active:true,images:autoImagesForNumber(2),description:'A tailored men’s trouser with a clean line and comfortable, refined fit. Designed to sit close to the body without feeling tight, with Italian production and a versatile finish for everyday and formal styling.'},
    {id:'p3',name:'Maison Women’s Cardigan',category:'Women',price:90,salePrice:null,sizes:['XS','S','M','L'],colors:['Cream','White','Black'],stock:16,sku:'CR-WCAR-003',badge:'NEW',active:true,images:autoImagesForNumber(3),description:'An elegant women’s cardigan with refined proportions and a soft, clean silhouette. Designed in Luxembourg and produced in Italy as a versatile layer for a polished everyday wardrobe.'},
    {id:'p4',name:'Maison Women’s Trouser',category:'Women',price:100,salePrice:null,sizes:['XS','S','M','L'],colors:['Cream','Black','Brown'],stock:12,sku:'CR-WTR-004',badge:'',active:true,images:autoImagesForNumber(4),description:'A refined women’s trouser with an elegant, comfortable cut that follows the body without feeling restrictive. Designed in Luxembourg, produced in Italy and created to pair naturally with the Maison collection.'}
  ];

  const bundleDefs=[
    {id:'men-set',name:'Heritage Men’s Set',category:'Men',price:210,componentIds:['p1','p2'],badge:'SET'},
    {id:'women-set',name:'Maison Women’s Set',category:'Women',price:200,componentIds:['p3','p4'],badge:'SET'}
  ];

  const defaultCodes=[{code:'WELCOME10',percent:10,active:true,start:'',end:'',maxUses:100,uses:0,minOrder:0,products:[],categories:[]}];
  const get=(k,d)=>{try{const v=localStorage.getItem('cr_'+k);return v?JSON.parse(v):d}catch{return d}};
  const set=(k,v)=>localStorage.setItem('cr_'+k,JSON.stringify(v));

  const productNumber=p=>{
    const m=String(p?.id||'').match(/^p(\d+)$/i);
    return m?Number(m[1]):null;
  };
  const productImages=p=>{
    const n=productNumber(p);
    if(n)return autoImagesForNumber(n);
    const imgs=Array.isArray(p?.images)?p.images.filter(Boolean).slice(0,4):[];
    while(imgs.length<4)imgs.push('');
    return imgs;
  };
  const nextProductId=(list)=>{
    const nums=(Array.isArray(list)?list:products()).map(productNumber).filter(Number.isFinite);
    return `p${Math.max(0,...nums)+1}`;
  };

  (function(){
    const ps=get('products',defaults);
    let changed=false;
    const normalized=ps.map((p,i)=>{
      const id=p.id||`p${i+1}`;
      const copy={...p,id};
      const n=productNumber(copy);
      if(n){
        const imgs=autoImagesForNumber(n);
        if(JSON.stringify(copy.images||[])!==JSON.stringify(imgs)){copy.images=imgs;changed=true}
      }else if(!Array.isArray(copy.images)){copy.images=[];changed=true}
      return copy;
    });
    if(changed||!localStorage.getItem('cr_image_naming_v1'))set('products',normalized);
    localStorage.setItem('cr_image_naming_v1','1');
  })();

  const defaultProducts=()=>JSON.parse(JSON.stringify(defaults));
  const products=()=>{
    let ps=get('products',defaults);
    let changed=false;
    ps=ps.map((p,i)=>{
      const copy={...p,id:p.id||`p${i+1}`};
      const imgs=productImages(copy);
      if(JSON.stringify(copy.images||[])!==JSON.stringify(imgs)){copy.images=imgs;changed=true}
      return copy;
    });
    if(changed)set('products',ps);
    return ps;
  };
  const saveProducts=v=>set('products',(Array.isArray(v)?v:[]).map(p=>({...p,images:productImages(p)})));
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
  const vatFromGross=gross=>{const r=vatRate();return r>0?(Number(gross)||0)*r/(1+r):0};
  const netFromGross=gross=>(Number(gross)||0)-vatFromGross(gross);
  const vatPercent=()=>Math.round(vatRate()*100);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  const bundles=()=>bundleDefs.map(b=>({...b,componentIds:[...b.componentIds]}));
  const bundleById=id=>bundleDefs.find(b=>b.id===id)||null;
  const bundleForProduct=productId=>bundleDefs.find(b=>b.componentIds.includes(productId))||null;
  const bundleProducts=(bundle,ps=products())=>(bundle?.componentIds||[]).map(id=>ps.find(p=>p.id===id)).filter(Boolean);
  const bundleStock=(bundle,ps=products())=>{
    const items=bundleProducts(bundle,ps);
    if(items.length!==(bundle?.componentIds||[]).length)return 0;
    return Math.max(0,Math.min(...items.map(p=>Number(p.stock||0))));
  };
  const cartLineNet=line=>line?.bundle?Number(line.bundle.price||0)*(Number(line.qty)||1):price(line.product)*(Number(line.qty)||1);

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
      eligible=(lines||[]).filter(x=>{
        if(x.bundle){
          const productMatch=(c.products||[]).length && x.bundle.componentIds.every(id=>(c.products||[]).includes(id));
          const categoryMatch=(c.categories||[]).includes(x.bundle.category);
          return productMatch||categoryMatch;
        }
        return (c.products||[]).includes(x.product?.id)||(c.categories||[]).includes(x.product?.category);
      }).reduce((s,x)=>s+cartLineNet(x),0);
      if(!eligible)return {ok:false,msg:'Code is not valid for these products',discount:0};
    }
    return {ok:true,msg:`${c.percent}% applied`,discount:eligible*(Number(c.percent)/100),code:c};
  }

  return {
    defaultProducts,products,saveProducts,nextProductId,productNumber,productImages,autoImagesForNumber,
    bundles,bundleById,bundleForProduct,bundleProducts,bundleStock,cartLineNet,
    codes,saveCodes,cart,saveCart,orders,saveOrders,price,money,vatRate,vatOnNet,grossFromNet,vatFromGross,netFromGross,vatPercent,esc,validateCode,get,set
  };
})();
