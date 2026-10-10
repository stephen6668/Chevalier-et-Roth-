
const CRCommerce = (() => {
  const endpoint='https://fra.cloud.appwrite.io/v1';
  const projectId='6ac779cc001f0d093856';
  const databaseId=window.CRSiteConfig?.commerceDatabaseId || '6ac7d6740035408079f7';
  const productTableId=window.CRSiteConfig?.productTableId || 'cr_products';
  const codeTableId=window.CRSiteConfig?.codeTableId || 'cr_codes';
  const orderTableId=window.CRSiteConfig?.orderTableId || 'cr_orders';

  let client=null,tables=null;

  function init(){
    if(!window.Appwrite) throw new Error('Appwrite SDK not loaded.');
    if(tables) return;
    client=new Appwrite.Client().setEndpoint(endpoint).setProject(projectId);
    tables=new Appwrite.TablesDB(client);
  }

  function jsonArray(v){
    if(Array.isArray(v)) return v;
    try{
      const parsed=JSON.parse(v||'[]');
      return Array.isArray(parsed)?parsed:[];
    }catch(e){ return []; }
  }

  function rowToProduct(r){
    return {
      id:r.$id,
      name:r.name||'',
      category:r.category||'',
      price:Number(r.price||0),
      salePrice:Number(r.salePrice||0)||null,
      sizes:jsonArray(r.sizes),
      colors:jsonArray(r.colors),
      stock:Number(r.stock||0),
      sku:r.sku||'',
      badge:r.badge||'',
      active:r.active!==false,
      images:jsonArray(r.images),
      description:r.description||''
    };
  }

  function productToData(p){
    return {
      name:String(p.name||'').trim(),
      category:String(p.category||'').trim(),
      price:Number(p.price||0),
      salePrice:p.salePrice?Number(p.salePrice):0,
      sizes:JSON.stringify(Array.isArray(p.sizes)?p.sizes:[]),
      colors:JSON.stringify(Array.isArray(p.colors)?p.colors:[]),
      stock:Math.max(0,Math.floor(Number(p.stock||0))),
      sku:String(p.sku||'').trim(),
      badge:String(p.badge||'').trim(),
      active:!!p.active,
      images:JSON.stringify(Array.isArray(p.images)?p.images:[]),
      description:String(p.description||'').trim()
    };
  }

  function rowToCode(r){
    return {
      rowId:r.$id,
      code:String(r.code||'').toUpperCase(),
      percent:Number(r.percent||0),
      active:r.active!==false,
      start:r.start||'',
      end:r.end||'',
      maxUses:Number(r.maxUses||0),
      uses:Number(r.uses||0),
      minOrder:Number(r.minOrder||0),
      products:jsonArray(r.products),
      categories:jsonArray(r.categories)
    };
  }

  function codeToData(c){
    return {
      code:String(c.code||'').trim().toUpperCase(),
      percent:Math.max(0,Math.min(100,Math.round(Number(c.percent||0)))),
      active:!!c.active,
      start:String(c.start||''),
      end:String(c.end||''),
      maxUses:Math.max(0,Math.floor(Number(c.maxUses||0))),
      uses:Math.max(0,Math.floor(Number(c.uses||0))),
      minOrder:Math.max(0,Number(c.minOrder||0)),
      products:JSON.stringify(Array.isArray(c.products)?c.products:[]),
      categories:JSON.stringify(Array.isArray(c.categories)?c.categories:[])
    };
  }

  async function listAll(tableId){
    init();
    let all=[],offset=0;
    const limit=100;
    while(true){
      const result=await tables.listRows({
        databaseId,tableId,
        queries:[Appwrite.Query.limit(limit),Appwrite.Query.offset(offset)]
      });
      const rows=result.rows||[];
      all.push(...rows);
      if(rows.length<limit || (result.total && all.length>=result.total)) break;
      offset+=rows.length;
    }
    return all;
  }

  async function listProducts(){
    return (await listAll(productTableId)).map(rowToProduct);
  }

  async function syncProducts(){
    try{
      const products=await listProducts();
      if(products.length){
        CRStore.saveProducts(products);
        window.dispatchEvent(new CustomEvent('crcatalogsync',{detail:products}));
      }
      return products;
    }catch(e){
      console.warn('Central product catalogue unavailable; using local cache.',e);
      return CRStore.products();
    }
  }

  async function saveProduct(p){
    init();
    const data=productToData(p);
    try{
      await tables.getRow({databaseId,tableId:productTableId,rowId:p.id});
      return rowToProduct(await tables.updateRow({databaseId,tableId:productTableId,rowId:p.id,data}));
    }catch(e){
      if(e?.code===404 || e?.type==='row_not_found'){
        return rowToProduct(await tables.createRow({databaseId,tableId:productTableId,rowId:p.id,data}));
      }
      throw e;
    }
  }

  async function deleteProduct(id){
    init();
    return tables.deleteRow({databaseId,tableId:productTableId,rowId:id});
  }

  async function listCodes(){
    return (await listAll(codeTableId)).map(rowToCode);
  }

  async function saveCode(c){
    init();
    const data=codeToData(c);
    if(c.rowId){
      return rowToCode(await tables.updateRow({databaseId,tableId:codeTableId,rowId:c.rowId,data}));
    }
    return rowToCode(await tables.createRow({
      databaseId,tableId:codeTableId,rowId:Appwrite.ID.unique(),data
    }));
  }

  async function deleteCode(rowId){
    init();
    return tables.deleteRow({databaseId,tableId:codeTableId,rowId});
  }

  async function listOrders(){
    const rows=await listAll(orderTableId);
    return rows.sort((a,b)=>String(b.date||b.$createdAt||'').localeCompare(String(a.date||a.$createdAt||'')));
  }

  return {
    databaseId,productTableId,codeTableId,orderTableId,
    init,listProducts,syncProducts,saveProduct,deleteProduct,
    listCodes,saveCode,deleteCode,listOrders
  };
})();
