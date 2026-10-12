const CRStore = (() => {
  // EXACT IMAGE / DESIGN ORDER FOR THE FIRST COLLECTION
  // 1) Beige/Braun, 2) Beige, 3) Bordeaux, 4) Schwarz, 5) Weiß
  const collectionColorDefs=[
    {name:'Beige/Braun',slug:'beige-braun'},
    {name:'Beige',slug:'beige'},
    {name:'Bordeaux',slug:'bordo'},
    {name:'Schwarz',slug:'schwarz'},
    {name:'Weiß',slug:'weis'}
  ];
  const standardColorDefs=[
    {name:'Beige',slug:'beige'},
    {name:'Bordeaux',slug:'bordo'},
    {name:'Schwarz',slug:'schwarz'},
    {name:'Weiß',slug:'weis'}
  ];
  const standardColors=()=>standardColorDefs.map(x=>x.name);
  const colorDefsForNumber=n=>[1,2,3].includes(Number(n))?collectionColorDefs:standardColorDefs;
  const normalizeColorName=value=>{
    const v=String(value||'').trim().toLowerCase();
    if(['bordeaux','bordo','burgundy','borde','bordaux'].includes(v))return 'Bordeaux';
    if(['beige/braun','beige braun','beigebraun','beige-brown','beige brown','brown beige','taupe'].includes(v))return 'Beige/Braun';
    if(['beige','cream','creme','stone','sand'].includes(v))return 'Beige';
    if(['black','schwarz','noir'].includes(v))return 'Schwarz';
    if(['white','weiß','weiss','weis','blanc'].includes(v))return 'Weiß';
    return String(value||'').trim();
  };
  const colorSlug=value=>{
    const n=normalizeColorName(value);
    const found=[...collectionColorDefs,...standardColorDefs].find(x=>x.name===n);
    return found?found.slug:String(value||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  };

  // These paths intentionally match the filenames exactly as supplied by the owner.
  // GitHub Pages is case-sensitive: Product 1 white uses capital P in Produkt1-weis.jpg.
  const exactImageMap={
    1:{
      'Beige/Braun':'images/produkt1-beige-braun.jpg',
      'Beige':'images/produkt1-beige.jpg',
      'Bordeaux':'images/produkt1-bordo.jpg',
      'Schwarz':'images/produkt1-schwarz.jpg',
      'Weiß':'images/Produkt1-weis.jpg'
    },
    2:{
      'Beige/Braun':'images/produkt2-beige-braun.jpg',
      'Beige':'images/produkt2-beige.jpg',
      'Bordeaux':'images/produkt2-bordo.jpg',
      'Schwarz':'images/produkt2-schwarz.jpg',
      'Weiß':'images/produkt2-weis.jpg'
    },
    3:{
      'Beige/Braun':'images/produkt3-beige-braun.jpg',
      'Beige':'images/produkt3-beige.jpg',
      'Bordeaux':'images/produkt3-bordo.jpg',
      'Schwarz':'images/produkt3-schwarz.jpg',
      'Weiß':'images/produkt3-weis.jpg'
    }
  };

  const autoImagesForNumber=n=>{
    const map=exactImageMap[Number(n)];
    if(map)return collectionColorDefs.map(c=>map[c.name]||'');
    return colorDefsForNumber(n).map(c=>`images/produkt${n}-${c.slug}.jpg`);
  };
  const autoColorImageMapForNumber=n=>{
    const map=exactImageMap[Number(n)];
    if(map)return {...map};
    return Object.fromEntries(colorDefsForNumber(n).map(c=>[c.name,`images/produkt${n}-${c.slug}.jpg`]));
  };
  const defaults = [
    {id:'p1',name:'Heritage Half-Zip',category:'Men',price:110,salePrice:null,sizes:['S','M','L','XL'],colors:['Beige/Braun','Beige','Bordeaux','Schwarz','Weiß'],stock:24,sku:'CR-HZ-001',badge:'FIRST COLLECTION',active:true,images:autoImagesForNumber(1),description:'A refined half-zip defined by clean lines, balanced proportions and understated detail. Designed in Luxembourg and produced in Italy, it combines polished elegance with the comfort needed for everyday wear.'},
    {id:'p2',name:'Tailored Trouser',category:'Men',price:100,salePrice:null,sizes:['30','32','34','36'],colors:['Beige/Braun','Beige','Bordeaux','Schwarz','Weiß'],stock:18,sku:'CR-TR-002',badge:'FIRST COLLECTION',active:true,images:autoImagesForNumber(2),description:'A tailored trouser with a precise, comfortable silhouette that follows the body without feeling restrictive. Designed to pair naturally with the Heritage Half-Zip for a complete, refined look.'},
    {id:'p3',name:'Maison Bodysuit',category:'Women',price:90,salePrice:null,sizes:['XS','S','M','L','XL'],colors:['Beige/Braun','Beige','Bordeaux','Schwarz','Weiß'],stock:16,sku:'CR-BODY-003',badge:'FIRST COLLECTION',active:true,images:autoImagesForNumber(3),description:'A clean, elegant bodysuit created to shape a polished silhouette while remaining comfortable. Minimal detailing and refined proportions make it a versatile statement piece for the first Chevalier & Roth collection.'}
  ];

  const bundleDefs=[
    {id:'men-set',name:'Heritage Men’s Set',category:'Men',price:210,componentIds:['p1','p2']}
  ];

  const defaultCodes=[{code:'WELCOME10',percent:10,active:true,start:'',end:'',maxUses:100,uses:0,minOrder:0,products:[],categories:[]}];
  const get=(k,d)=>{try{const v=localStorage.getItem('cr_'+k);return v?JSON.parse(v):d}catch{return d}};
  const set=(k,v)=>localStorage.setItem('cr_'+k,JSON.stringify(v));

  const productNumber=p=>{
    const m=String(p?.id||'').match(/^p(\d+)$/i);
    return m?Number(m[1]):null;
  };
  const productColors=p=>{
    const n=productNumber(p);
    if(n)return colorDefsForNumber(n).map(x=>x.name);
    const source=Array.isArray(p?.colors)?p.colors:[];
    const normalized=[...new Set(source.map(normalizeColorName).filter(Boolean))];
    return normalized.length?normalized:standardColors();
  };
  const productImages=p=>{
    const n=productNumber(p);
    if(n)return autoImagesForNumber(n);
    const imgs=Array.isArray(p?.images)?p.images.filter(Boolean).slice(0,5):[];
    while(imgs.length<5)imgs.push('');
    return imgs;
  };
  const productImageForColor=(p,color)=>{
    const n=productNumber(p);
    if(n){
      const map=autoColorImageMapForNumber(n);
      const normalized=normalizeColorName(color||'Beige/Braun');
      return map[normalized]||map['Beige/Braun']||map.Beige||Object.values(map)[0]||'';
    }
    const colors=productColors(p);
    const index=Math.max(0,colors.findIndex(c=>normalizeColorName(c)===normalizeColorName(color)));
    const images=productImages(p);
    return images[index]||images[0]||'';
  };
  const primaryProductImage=p=>{
    const first=productColors(p)[0]||'Beige/Braun';
    const preferred='Beige/Braun';
    return productImageForColor(p,productColors(p).includes(preferred)?preferred:first)||productImages(p)[0]||'';
  };
  const nextProductId=(list)=>{
    const nums=(Array.isArray(list)?list:products()).map(productNumber).filter(Number.isFinite);
    return `p${Math.max(0,...nums)+1}`;
  };

  (function(){
    const existing=get('products',[]);
    const byId=Object.fromEntries((Array.isArray(existing)?existing:[]).map(p=>[p.id,p]));
    const ps=defaults.map(base=>{
      const old=byId[base.id]||{};
      return {
        ...base,
        price:Number(old.price)>0?Number(old.price):base.price,
        salePrice:old.salePrice?Number(old.salePrice):base.salePrice,
        stock:Number.isFinite(Number(old.stock))?Math.max(0,Number(old.stock)):base.stock,
        active:old.active===false?false:base.active,
        images:autoImagesForNumber(productNumber(base)),
        colors:productColors(base)
      };
    });
    set('products',ps);
    localStorage.setItem('cr_three_product_catalog_v1','1');
  })();

  const defaultProducts=()=>JSON.parse(JSON.stringify(defaults));
  const products=()=>{
    const allowed=new Set(window.CRSiteConfig?.currentCollectionProductIds||['p1','p2','p3']);
    const cached=get('products',defaults);
    const byId=Object.fromEntries((Array.isArray(cached)?cached:[]).map(p=>[p.id,p]));
    const ps=defaults.filter(base=>allowed.has(base.id)).map(base=>{
      const p=byId[base.id]||{};
      const copy={
        ...base,
        price:Number(p.price)>0?Number(p.price):base.price,
        salePrice:p.salePrice?Number(p.salePrice):base.salePrice,
        stock:Number.isFinite(Number(p.stock))?Math.max(0,Number(p.stock)):base.stock,
        active:p.active===false?false:base.active
      };
      copy.images=productImages(copy);
      copy.colors=productColors(copy);
      return copy;
    });
    return ps;
  };
  const saveProducts=v=>{
    const allowed=new Set(window.CRSiteConfig?.currentCollectionProductIds||['p1','p2','p3']);
    const incoming=Array.isArray(v)?v:[];
    const byId=Object.fromEntries(incoming.filter(p=>allowed.has(p.id)).map(p=>[p.id,p]));
    const merged=defaults.filter(base=>allowed.has(base.id)).map(base=>{
      const p=byId[base.id]||{};
      return {...base,...p,id:base.id,name:base.name,category:base.category,sku:base.sku,badge:base.badge,description:base.description,sizes:base.sizes,colors:productColors(base),images:productImages(base)};
    });
    set('products',merged);
  };
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
    defaultProducts,products,saveProducts,nextProductId,productNumber,productColors,standardColors,colorDefsForNumber,normalizeColorName,colorSlug,productImages,productImageForColor,primaryProductImage,autoImagesForNumber,autoColorImageMapForNumber,
    bundles,bundleById,bundleForProduct,bundleProducts,bundleStock,cartLineNet,
    codes,saveCodes,cart,saveCart,orders,saveOrders,price,money,vatRate,vatOnNet,grossFromNet,vatFromGross,netFromGross,vatPercent,esc,validateCode,get,set
  };
})();
