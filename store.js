const CRStore = (() => {
  // FIRST COLLECTION: exactly 3 products, each with 5 visual designs.
  // IMPORTANT: the image paths below match the CURRENT filenames in
  // GitHub repo stephen6668/Chevalier-et-Roth- / images EXACTLY.
  const collectionColorDefs = [
    { name: 'Beige/Braun', slug: 'beige-braun' },
    { name: 'Beige',       slug: 'beige' },
    { name: 'Bordeaux',    slug: 'bordo' },
    { name: 'Schwarz',     slug: 'schwarz' },
    { name: 'Weiß',        slug: 'weis' }
  ];

  const standardColorDefs = collectionColorDefs.slice(1);
  const standardColors = () => collectionColorDefs.map(x => x.name);
  const colorDefsForNumber = n => [1,2,3].includes(Number(n)) ? collectionColorDefs : standardColorDefs;

  const normalizeColorName = value => {
    const v = String(value || '').trim().toLowerCase();
    if (['beige/braun','beige braun','beigebraun','beige-brown','beige brown','brown beige','taupe'].includes(v)) return 'Beige/Braun';
    if (['beige','cream','creme','stone','sand'].includes(v)) return 'Beige';
    if (['bordeaux','bordo','burgundy','borde','bordaux'].includes(v)) return 'Bordeaux';
    if (['black','schwarz','noir'].includes(v)) return 'Schwarz';
    if (['white','weiß','weiss','weis','blanc'].includes(v)) return 'Weiß';
    return String(value || '').trim();
  };

  const colorSlug = value => {
    const n = normalizeColorName(value);
    const found = collectionColorDefs.find(x => x.name === n) || standardColorDefs.find(x => x.name === n);
    return found ? found.slug : String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  };

  // EXACT current GitHub filenames. Do not "clean up" these names in code.
  // Product 3 Beige/Braun has a space in the GitHub filename; %20 encodes that space safely in the URL.
  const exactImageMap = {
    1: {
      'Beige/Braun': 'images/produkt1-beige-braun.jpg.png',
      'Beige':       'images/produkt1-beige.jpg.png',
      'Bordeaux':    'images/produkt1-bordo.jpg.png',
      'Schwarz':     'images/produkt1-schwarz.jpg',
      'Weiß':        'images/Produkt1-weis.jpg'
    },
    2: {
      'Beige/Braun': 'images/produkt2-beige-braun.jpg.png',
      'Beige':       'images/produkt2-beige.jpg',
      'Bordeaux':    'images/produkt2-bordo.jpg',
      'Schwarz':     'images/produkt2-schwarz.jpg',
      'Weiß':        'images/produkt2-weis.jpg'
    },
    3: {
      'Beige/Braun': 'images/produkt3-beige-braun.jpg%20.png',
      'Beige':       'images/produkt3-beige.jpg',
      'Bordeaux':    'images/produkt3-bordo.jpg.png',
      'Schwarz':     'images/produkt3-schwarz.jpg',
      'Weiß':        'images/produkt3-weis.jpg'
    }
  };

  // Cache-buster so GitHub Pages/browser does not keep old broken image paths.
  const imageVersion = '20261012-final-products-v3';
  const versionedImage = path => {
    const clean = String(path || '');
    if (!clean) return '';
    return clean + (clean.includes('?') ? '&' : '?') + 'v=' + imageVersion;
  };

  const get = (k,d) => {
    try {
      const v = localStorage.getItem('cr_' + k);
      return v ? JSON.parse(v) : d;
    } catch {
      return d;
    }
  };
  const set = (k,v) => localStorage.setItem('cr_' + k, JSON.stringify(v));

  const productNumber = p => {
    const m = String(p?.id || '').match(/^p(\d+)$/i);
    return m ? Number(m[1]) : null;
  };

  const imagePathFor = (n, color) => {
    const normalized = normalizeColorName(color || 'Beige/Braun');
    return exactImageMap[Number(n)]?.[normalized] || '';
  };

  const imageCandidatesForNumber = (n,color) => {
    const path = imagePathFor(n,color);
    return path ? [versionedImage(path)] : [];
  };

  const autoImagesForNumber = n => collectionColorDefs.map(c => imagePathFor(n,c.name));
  const autoColorImageMapForNumber = n => Object.fromEntries(collectionColorDefs.map(c => [c.name, imagePathFor(n,c.name)]));

  const defaults = [
    {
      id:'p1', name:'Heritage Half-Zip', category:'Men', price:110, salePrice:null,
      sizes:['S','M','L','XL'], colors:collectionColorDefs.map(x=>x.name), stock:24,
      sku:'CR-HZ-001', badge:'FIRST COLLECTION', active:true,
      images:autoImagesForNumber(1),
      description:'A refined half-zip defined by clean lines, balanced proportions and understated detail. Designed in Luxembourg and produced in Italy, it combines polished elegance with everyday comfort.'
    },
    {
      id:'p2', name:'Tailored Trouser', category:'Men', price:100, salePrice:null,
      sizes:['30','32','34','36'], colors:collectionColorDefs.map(x=>x.name), stock:18,
      sku:'CR-TR-002', badge:'FIRST COLLECTION', active:true,
      images:autoImagesForNumber(2),
      description:'A tailored trouser with a precise, comfortable silhouette that follows the body without feeling restrictive. Created to pair naturally with the Heritage Half-Zip.'
    },
    {
      id:'p3', name:'Maison Bodysuit', category:'Women', price:90, salePrice:null,
      sizes:['XS','S','M','L','XL'], colors:collectionColorDefs.map(x=>x.name), stock:16,
      sku:'CR-BODY-003', badge:'FIRST COLLECTION', active:true,
      images:autoImagesForNumber(3),
      description:'A clean, elegant bodysuit with refined proportions and a polished silhouette, designed to feel comfortable while remaining distinctly Chevalier & Roth.'
    }
  ];

  const bundleDefs = [
    { id:'men-set', name:'Heritage Men’s Set', category:'Men', price:210, componentIds:['p1','p2'], badge:'SET' }
  ];

  const defaultCodes = [
    { code:'WELCOME10', percent:10, active:true, start:'', end:'', maxUses:100, uses:0, minOrder:0, products:[], categories:[] }
  ];

  const defaultProducts = () => JSON.parse(JSON.stringify(defaults));

  const productColors = p => {
    const n = productNumber(p);
    if ([1,2,3].includes(n)) return collectionColorDefs.map(x=>x.name);
    const source = Array.isArray(p?.colors) ? p.colors : [];
    const normalized = [...new Set(source.map(normalizeColorName).filter(Boolean))];
    return normalized.length ? normalized : standardColors();
  };

  const productImages = p => {
    const n = productNumber(p);
    if ([1,2,3].includes(n)) return autoImagesForNumber(n);
    const imgs = Array.isArray(p?.images) ? p.images.filter(Boolean).slice(0,5) : [];
    while (imgs.length < 5) imgs.push('');
    return imgs;
  };

  const productImageCandidatesForColor = (p,color) => {
    const n = productNumber(p);
    if ([1,2,3].includes(n)) return imageCandidatesForNumber(n,color || 'Beige/Braun');
    const colors = productColors(p);
    const idx = Math.max(0, colors.findIndex(c => normalizeColorName(c) === normalizeColorName(color)));
    const imgs = productImages(p);
    const path = imgs[idx] || imgs[0] || '';
    return path ? [versionedImage(path)] : [];
  };

  const productImageForColor = (p,color) => productImageCandidatesForColor(p,color)[0] || '';
  const primaryProductImage = p => productImageForColor(p,'Beige/Braun') || productImages(p)[0] || '';

  // Kept for compatibility with app.js. There is intentionally no alternate
  // wrong filename fallback: each color uses its exact GitHub filename.
  const tryNextImage = img => {
    try {
      const raw = img?.dataset?.crFallbacks || '';
      const list = raw ? JSON.parse(decodeURIComponent(raw)) : [];
      if (!Array.isArray(list) || !list.length) return false;
      img.src = list.shift();
      img.dataset.crFallbacks = encodeURIComponent(JSON.stringify(list));
      return true;
    } catch {
      return false;
    }
  };

  const products = () => {
    const allowed = new Set(window.CRSiteConfig?.currentCollectionProductIds || ['p1','p2','p3']);
    const cached = get('products', defaults);
    const byId = Object.fromEntries((Array.isArray(cached) ? cached : []).map(p => [p.id,p]));
    return defaults.filter(base => allowed.has(base.id)).map(base => {
      const old = byId[base.id] || {};
      return {
        ...base,
        price: Number(old.price) > 0 ? Number(old.price) : base.price,
        salePrice: old.salePrice ? Number(old.salePrice) : base.salePrice,
        stock: Number.isFinite(Number(old.stock)) ? Math.max(0,Number(old.stock)) : base.stock,
        active: true,
        colors: productColors(base),
        images: productImages(base)
      };
    });
  };

  const saveProducts = v => {
    const allowed = new Set(window.CRSiteConfig?.currentCollectionProductIds || ['p1','p2','p3']);
    const incoming = Array.isArray(v) ? v : [];
    const byId = Object.fromEntries(incoming.filter(p => allowed.has(p.id)).map(p => [p.id,p]));
    const merged = defaults.filter(base => allowed.has(base.id)).map(base => {
      const p = byId[base.id] || {};
      return {
        ...base,
        price: Number(p.price) > 0 ? Number(p.price) : base.price,
        salePrice: p.salePrice ? Number(p.salePrice) : base.salePrice,
        stock: Number.isFinite(Number(p.stock)) ? Math.max(0,Number(p.stock)) : base.stock,
        active: true,
        colors: productColors(base),
        images: productImages(base)
      };
    });
    set('products', merged);
  };

  // Reset old broken local product cache to the valid 3-product catalogue once.
  try {
    const marker = 'cr_products_exact_image_fix_v2';
    if (localStorage.getItem(marker) !== '1') {
      set('products', defaultProducts());
      localStorage.setItem(marker,'1');
    }
  } catch {}

  const nextProductId = list => {
    const nums = (Array.isArray(list) ? list : products()).map(productNumber).filter(Number.isFinite);
    return `p${Math.max(0,...nums)+1}`;
  };

  const codes = () => get('codes',defaultCodes);
  const saveCodes = v => set('codes',v);
  const cart = () => get('cart',[]);
  const saveCart = v => { set('cart',v); window.dispatchEvent(new Event('cartchange')); };
  const orders = () => get('orders',[]);
  const saveOrders = v => set('orders',v);
  const price = p => p.salePrice && Number(p.salePrice) < Number(p.price) ? Number(p.salePrice) : Number(p.price);
  const money = v => new Intl.NumberFormat('de-LU',{style:'currency',currency:'EUR'}).format(Number(v)||0);
  const vatRate = () => Number(window.CRSiteConfig?.vatRate ?? 0.17);
  const vatOnNet = net => (Number(net)||0) * vatRate();
  const grossFromNet = net => (Number(net)||0) + vatOnNet(net);
  const vatFromGross = gross => { const r=vatRate(); return r>0 ? (Number(gross)||0)*r/(1+r) : 0; };
  const netFromGross = gross => (Number(gross)||0) - vatFromGross(gross);
  const vatPercent = () => Math.round(vatRate()*100);
  const esc = s => String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  const bundles = () => bundleDefs.map(b => ({...b,componentIds:[...b.componentIds]}));
  const bundleById = id => bundleDefs.find(b => b.id===id) || null;
  const bundleForProduct = productId => bundleDefs.find(b => b.componentIds.includes(productId)) || null;
  const bundleProducts = (bundle,ps=products()) => (bundle?.componentIds||[]).map(id => ps.find(p=>p.id===id)).filter(Boolean);
  const bundleStock = (bundle,ps=products()) => {
    const items = bundleProducts(bundle,ps);
    if (items.length !== (bundle?.componentIds||[]).length) return 0;
    return Math.max(0,Math.min(...items.map(p=>Number(p.stock||0))));
  };
  const cartLineNet = line => line?.bundle ? Number(line.bundle.price||0)*(Number(line.qty)||1) : price(line.product)*(Number(line.qty)||1);

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
    defaultProducts, products, saveProducts, nextProductId, productNumber,
    productColors, standardColors, colorDefsForNumber, normalizeColorName,
    colorSlug, productImages, productImageForColor, productImageCandidatesForColor,
    tryNextImage, primaryProductImage, autoImagesForNumber, autoColorImageMapForNumber,
    bundles, bundleById, bundleForProduct, bundleProducts, bundleStock, cartLineNet,
    codes, saveCodes, cart, saveCart, orders, saveOrders, price, money,
    vatRate, vatOnNet, grossFromNet, vatFromGross, netFromGross, vatPercent,
    esc, validateCode, get, set
  };
})();
