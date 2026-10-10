
let editId=null;
let editingCodeId=null;
let currentWaitlistRows=[];
let adminProducts=[];
let adminCodes=[];
let adminOrders=[];

function val(id){return document.getElementById(id)?.value||''}
function money(v){return CRStore.money(Number(v)||0)}
function splitCsv(v){return String(v||'').split(',').map(x=>x.trim()).filter(Boolean)}
function setMsg(id,text,type=''){
  const el=document.getElementById(id);if(!el)return;
  el.textContent=text||'';el.className='admin-message '+type;
}

async function adminLogin(){
  const btn=document.getElementById('loginBtn');
  const msgEl=document.getElementById('msg');
  const debugEl=document.getElementById('debug');
  const emailEl=document.getElementById('email');
  const passwordEl=document.getElementById('password');

  btn.disabled=true;
  msgEl.textContent='Checking secure access…';
  debugEl.textContent='';
  try{
    const existing=await CRAppwrite.currentUser();
    if(existing){
      if(await CRAppwrite.isAdmin()){await showAdmin();return}
      await CRAppwrite.logout();
    }
    await CRAppwrite.login({email:emailEl.value.trim(),password:passwordEl.value});
    if(!await CRAppwrite.isAdmin()){
      await CRAppwrite.logout();
      throw new Error('This account is not a member of the Appwrite admin team.');
    }
    await showAdmin();
  }catch(e){
    const info=CRAppwrite.explainError(e,'Admin login failed.');
    msgEl.textContent=info.friendly;debugEl.textContent=info.details||'';
  }finally{btn.disabled=false}
}

async function restoreAdmin(){
  const user=await CRAppwrite.currentUser();
  if(user && await CRAppwrite.isAdmin()) await showAdmin();
}

async function showAdmin(){
  const user=await CRAppwrite.currentUser();
  const loginPanel=document.getElementById('login');
  const dashboardPanel=document.getElementById('dashboard');
  const identity=document.getElementById('adminIdentity');

  if(!loginPanel || !dashboardPanel){
    throw new Error('Admin interface could not be loaded. Please refresh the page.');
  }

  loginPanel.style.display='none';
  dashboardPanel.style.display='grid';
  if(identity) identity.textContent=user?.email||'';
  await refreshAll();
}

async function logout(){await CRAppwrite.logout();location.reload()}

function openAdminTab(name,button){
  document.querySelectorAll('.admin-tab').forEach(x=>x.classList.remove('active'));
  document.getElementById('tab-'+name)?.classList.add('active');
  document.querySelectorAll('.admin-nav button').forEach(x=>x.classList.remove('active'));
  (button||document.querySelector(`[data-tab="${name}"]`))?.classList.add('active');
  const names={overview:'Overview',products:'Products & Stock',discounts:'Discount Codes',waitlist:'Waitlist',orders:'Orders'};
  adminPageTitle.textContent=names[name]||'Admin';
  if(name==='waitlist')loadWaitlist();
  if(name==='orders')loadOrders();
}

async function refreshAll(){
  await loadProductsAdmin();
  await Promise.allSettled([loadCodesAdmin(),loadOrders(),loadWaitlist()]);
  renderOverview();
}

async function loadProductsAdmin(){
  try{
    adminProducts=await CRCommerce.listProducts();
    CRStore.saveProducts(adminProducts);
    const statusEl=document.getElementById('commerceStatus');
    if(statusEl){statusEl.textContent='APPWRITE COMMERCE · CONNECTED';statusEl.classList.add('ok');}
  }catch(e){
    adminProducts=CRStore.products();
    const statusEl=document.getElementById('commerceStatus');
    if(statusEl){statusEl.textContent='APPWRITE COMMERCE · SETUP REQUIRED';statusEl.classList.remove('ok');}
  }
  renderProductsAdmin();
  renderProductSelect();
  renderDiscountProductChoices();
}

function renderProductSelect(){
  productEditSelect.innerHTML='<option value="">Create a new product…</option>'+
    adminProducts.map(p=>`<option value="${CRStore.esc(p.id)}">${CRStore.esc(p.name)} · ${p.stock} stock</option>`).join('');
  if(editId)productEditSelect.value=editId;
}

function stockClass(stock){
  if(stock<=0)return 'sold';
  if(stock<=5)return 'low';
  return 'good';
}

function renderProductsAdmin(){
  const q=String(productSearch?.value||'').toLowerCase();
  const list=adminProducts.filter(p=>!q||`${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(q));
  productCardsAdmin.innerHTML=list.length?list.map(p=>`
    <button class="admin-product-card ${editId===p.id?'selected':''}" onclick="selectProductToEdit('${p.id}')">
      <div class="admin-product-thumb">${p.images?.[0]?`<img src="${CRStore.esc(p.images[0])}" alt="">`:'CR'}</div>
      <div class="admin-product-card-copy"><b>${CRStore.esc(p.name)}</b><span>${CRStore.esc(p.sku||p.category)}</span><small>${money(p.price)} · <i class="stock-dot ${stockClass(p.stock)}"></i>${p.stock} in stock</small></div>
      <span class="admin-status-chip ${p.stock<=0?'sold':''}">${p.stock<=0?'SOLD OUT':(p.active?'LIVE':'HIDDEN')}</span>
    </button>`).join(''):'<div class="admin-empty">No products found.</div>';
}

function newProduct(){
  editId=null;productForm.reset();pActive.checked=true;pCategory.value='Men';pStock.value='0';
  productEditorEyebrow.textContent='NEW PRODUCT';productEditorTitle.textContent='Create product';deleteProductBtn.hidden=true;
  productEditSelect.value='';renderProductsAdmin();productSaveMsg.textContent='';
}

function selectProductToEdit(id){
  if(!id){newProduct();return}
  const p=adminProducts.find(x=>x.id===id);if(!p)return;
  editId=id;
  pName.value=p.name||'';pCategory.value=p.category||'Men';pPrice.value=p.price||0;pSale.value=p.salePrice||'';
  pSizes.value=(p.sizes||[]).join(', ');pColors.value=(p.colors||[]).join(', ');pStock.value=p.stock||0;
  pSku.value=p.sku||'';pBadge.value=p.badge||'';pImages.value=(p.images||[]).join(', ');pDesc.value=p.description||'';pActive.checked=!!p.active;
  productEditorEyebrow.textContent='EDIT PRODUCT';productEditorTitle.textContent=p.name;deleteProductBtn.hidden=false;
  productEditSelect.value=id;renderProductsAdmin();
  if(window.innerWidth<900)productForm.scrollIntoView({behavior:'smooth',block:'start'});
}

async function saveProduct(){
  const data={
    id:editId||('prod_'+Date.now()),
    name:val('pName').trim(),
    category:val('pCategory'),
    price:Number(val('pPrice')||0),
    salePrice:val('pSale')?Number(val('pSale')):null,
    sizes:splitCsv(val('pSizes')),
    colors:splitCsv(val('pColors')),
    stock:Math.max(0,Math.floor(Number(val('pStock')||0))),
    sku:val('pSku').trim(),
    badge:val('pBadge'),
    active:pActive.checked,
    images:splitCsv(val('pImages')),
    description:val('pDesc').trim()
  };
  if(!data.name)return setMsg('productSaveMsg','Enter a product name.','error');
  if(data.price<0)return setMsg('productSaveMsg','Price cannot be negative.','error');

  saveProductBtn.disabled=true;setMsg('productSaveMsg','Saving product to Appwrite…');
  try{
    const saved=await CRCommerce.saveProduct(data);
    const i=adminProducts.findIndex(x=>x.id===saved.id);
    if(i>=0)adminProducts[i]=saved;else adminProducts.push(saved);
    CRStore.saveProducts(adminProducts);
    editId=saved.id;
    renderProductsAdmin();renderProductSelect();renderDiscountProductChoices();renderOverview();
    selectProductToEdit(saved.id);
    setMsg('productSaveMsg','Saved. The store catalogue is updated centrally.','success');
  }catch(e){
    // Local fallback keeps the editor usable but clearly states it is not global.
    const i=adminProducts.findIndex(x=>x.id===data.id);
    if(i>=0)adminProducts[i]=data;else adminProducts.push(data);
    CRStore.saveProducts(adminProducts);
    editId=data.id;renderProductsAdmin();renderProductSelect();renderDiscountProductChoices();renderOverview();
    setMsg('productSaveMsg','Saved only in this browser because the Appwrite product table is not ready. Open APPWRITE-COMMERCE-SETUP.html.','error');
  }finally{saveProductBtn.disabled=false}
}

async function deleteCurrentProduct(){
  if(!editId)return;
  const p=adminProducts.find(x=>x.id===editId);
  if(!confirm(`Delete "${p?.name||'this product'}"?`))return;
  try{await CRCommerce.deleteProduct(editId)}catch(e){console.warn(e)}
  adminProducts=adminProducts.filter(x=>x.id!==editId);
  CRStore.saveProducts(adminProducts);newProduct();renderProductSelect();renderDiscountProductChoices();renderOverview();
}

function duplicateCurrentProduct(){
  const p=adminProducts.find(x=>x.id===editId);if(!p)return;
  editId=null;
  pName.value=p.name+' Copy';pCategory.value=p.category;pPrice.value=p.price;pSale.value=p.salePrice||'';
  pSizes.value=(p.sizes||[]).join(', ');pColors.value=(p.colors||[]).join(', ');pStock.value=p.stock;
  pSku.value=(p.sku||'')+'-COPY';pBadge.value=p.badge||'';pImages.value=(p.images||[]).join(', ');pDesc.value=p.description||'';pActive.checked=false;
  productEditorEyebrow.textContent='DUPLICATE PRODUCT';productEditorTitle.textContent='Create copy';deleteProductBtn.hidden=true;
}

async function loadCodesAdmin(){
  try{adminCodes=await CRCommerce.listCodes()}
  catch(e){adminCodes=CRStore.codes()}
  renderCodesAdmin();
}

function renderCodesAdmin(){
  codeCardsAdmin.innerHTML=adminCodes.length?adminCodes.map(c=>`
    <button class="admin-product-card ${editingCodeId===(c.rowId||c.code)?'selected':''}" onclick="editCode('${c.rowId||c.code}')">
      <div class="discount-circle">${c.percent}%</div>
      <div class="admin-product-card-copy"><b>${CRStore.esc(c.code)}</b><span>${c.products?.length?c.products.length+' selected product(s)':'All products'}</span><small>${c.active?'Active':'Inactive'} · ${c.uses||0}${c.maxUses?'/'+c.maxUses:''} uses</small></div>
      <span class="admin-status-chip ${c.active?'':'sold'}">${c.active?'ACTIVE':'OFF'}</span>
    </button>`).join(''):'<div class="admin-empty">No discount codes yet.</div>';
}

function syncPercent(v){
  const n=Math.max(1,Math.min(100,Math.round(Number(v)||1)));
  cPercent.value=n;cPercentRange.value=n;percentPreview.textContent=n+'%';
}

function renderDiscountProductChoices(){
  const selected=new Set(getSelectedDiscountProducts());
  discountProductChoices.innerHTML=adminProducts.map(p=>`
    <label class="product-choice">
      <input type="checkbox" class="code-product" value="${CRStore.esc(p.id)}" ${selected.has(p.id)?'checked':''} onchange="syncAllProductsState()">
      <span><b>${CRStore.esc(p.name)}</b><small>${CRStore.esc(p.sku||p.category)}</small></span>
    </label>`).join('');
}

function getSelectedDiscountProducts(){
  return [...document.querySelectorAll('.code-product:checked')].map(x=>x.value);
}
function syncAllProductsState(){
  const checks=[...document.querySelectorAll('.code-product')];
  cAllProducts.checked=checks.length>0 && checks.every(x=>x.checked);
}
function toggleAllProducts(){
  document.querySelectorAll('.code-product').forEach(x=>x.checked=cAllProducts.checked);
}

function newCode(){
  editingCodeId=null;cCode.value='';cActiveSelect.value='true';syncPercent(10);cStart.value='';cEnd.value='';cMax.value='';cMin.value='';
  cAllProducts.checked=true;document.querySelectorAll('.code-product').forEach(x=>x.checked=true);
  document.querySelectorAll('.code-category').forEach(x=>x.checked=false);
  codeEditorTitle.textContent='Create code';deleteCodeBtn.hidden=true;codeSaveMsg.textContent='';renderCodesAdmin();
}

function editCode(id){
  const c=adminCodes.find(x=>(x.rowId||x.code)===id);if(!c)return;
  editingCodeId=id;cCode.value=c.code;cActiveSelect.value=String(!!c.active);syncPercent(c.percent||1);
  cStart.value=c.start||'';cEnd.value=c.end||'';cMax.value=c.maxUses||'';cMin.value=c.minOrder||'';
  const selected=new Set(c.products||[]);
  const all=!selected.size;cAllProducts.checked=all;
  document.querySelectorAll('.code-product').forEach(x=>x.checked=all||selected.has(x.value));
  const cats=new Set(c.categories||[]);document.querySelectorAll('.code-category').forEach(x=>x.checked=cats.has(x.value));
  codeEditorTitle.textContent=c.code;deleteCodeBtn.hidden=false;renderCodesAdmin();
}

async function saveCode(){
  const previous=adminCodes.find(x=>(x.rowId||x.code)===editingCodeId);
  const data={
    rowId:previous?.rowId,
    code:cCode.value.trim().toUpperCase(),
    percent:Number(cPercent.value||0),
    active:cActiveSelect.value==='true',
    start:cStart.value,end:cEnd.value,
    maxUses:Number(cMax.value||0),uses:Number(previous?.uses||0),minOrder:Number(cMin.value||0),
    products:cAllProducts.checked?[]:getSelectedDiscountProducts(),
    categories:[...document.querySelectorAll('.code-category:checked')].map(x=>x.value)
  };
  if(!data.code)return setMsg('codeSaveMsg','Enter a code.','error');
  if(data.percent<1||data.percent>100)return setMsg('codeSaveMsg','Choose a percentage from 1 to 100.','error');
  setMsg('codeSaveMsg','Saving discount code…');
  try{
    const saved=await CRCommerce.saveCode(data);
    const i=adminCodes.findIndex(x=>(x.rowId||x.code)===(previous?.rowId||previous?.code));
    if(i>=0)adminCodes[i]=saved;else adminCodes.push(saved);
    editingCodeId=saved.rowId||saved.code;renderCodesAdmin();renderOverview();
    setMsg('codeSaveMsg','Discount code saved.','success');
  }catch(e){
    setMsg('codeSaveMsg','Could not save to Appwrite. Check the cr_codes table permissions.','error');
  }
}

async function deleteCurrentCode(){
  const c=adminCodes.find(x=>(x.rowId||x.code)===editingCodeId);if(!c)return;
  if(!confirm(`Delete code ${c.code}?`))return;
  try{if(c.rowId)await CRCommerce.deleteCode(c.rowId)}catch(e){console.warn(e)}
  adminCodes=adminCodes.filter(x=>x!==c);newCode();renderOverview();
}

async function loadOrders(){
  try{
    adminOrders=await CRCommerce.listOrders();
    orderStatusMsg.textContent='';
    orderRows.innerHTML=adminOrders.length?adminOrders.map(o=>`<tr>
      <td>${CRStore.esc(o.number||o.$id)}</td>
      <td>${CRStore.esc(o.date||o.$createdAt||'')}</td>
      <td>${CRStore.esc(o.customer||'')}</td>
      <td>${CRStore.esc(o.email||'')}</td>
      <td>${money(o.total||0)}</td>
      <td><span class="admin-status-chip">${CRStore.esc(o.status||'paid')}</span></td>
    </tr>`).join(''):'<tr><td colspan="6">No paid orders recorded yet.</td></tr>';
  }catch(e){
    adminOrders=CRStore.orders();
    orderRows.innerHTML=adminOrders.map(o=>`<tr><td>${o.number}</td><td>${new Date(o.date).toLocaleDateString()}</td><td>${CRStore.esc(o.customer)}</td><td>—</td><td>${money(o.total)}</td><td>${o.status}</td></tr>`).join('');
    orderStatusMsg.textContent='Central orders table not ready yet. See APPWRITE-COMMERCE-SETUP.html.';
  }
  renderOverview();
}

function renderOverview(){
  statProducts.textContent=adminProducts.length;
  statStock.textContent=adminProducts.reduce((s,p)=>s+Math.max(0,Number(p.stock||0)),0);
  statSoldOut.textContent=adminProducts.filter(p=>Number(p.stock||0)<=0).length;
  statCodes.textContent=adminCodes.filter(c=>c.active).length;
  statOrders.textContent=adminOrders.length;
  lowStockGrid.innerHTML=adminProducts.filter(p=>p.active&&Number(p.stock||0)<=8).sort((a,b)=>a.stock-b.stock).slice(0,8).map(p=>`
    <button onclick="openAdminTab('products');selectProductToEdit('${p.id}')"><b>${CRStore.esc(p.name)}</b><span>${p.stock<=0?'SOLD OUT':p.stock+' left'}</span></button>`).join('')||'<div class="admin-empty">No low-stock products.</div>';
}

async function loadWaitlist(){
  const m=document.getElementById('waitlistMsg');if(m)m.textContent='Loading waitlist…';
  try{
    const rows=await CRAppwrite.listAdminWaitlist();currentWaitlistRows=rows;statWaitlist.textContent=rows.length;
    waitlistRows.innerHTML=rows.length?rows.map(w=>`<tr>
      <td>${CRStore.esc(w.productName||w.productId)}</td><td>${CRStore.esc(w.name||'')}</td><td>${CRStore.esc(w.email||'')}</td>
      <td>${CRStore.esc(w.size||'Not selected')}</td><td>${CRStore.esc(w.color||'Not selected')}</td>
      <td><select class="admin-input compact" onchange="setWaitlistStatus('${w.$id}',this.value)">${['waiting','contacted','invited','converted','cancelled'].map(s=>`<option value="${s}" ${w.status===s?'selected':''}>${s}</option>`).join('')}</select></td>
      <td>${w.$createdAt?new Date(w.$createdAt).toLocaleString():'—'}</td><td><button class="icon-btn danger" onclick="deleteWaitlist('${w.$id}')">Delete</button></td>
    </tr>`).join(''):'<tr><td colspan="8">No waitlist entries yet.</td></tr>';
    if(m)m.textContent='';
  }catch(e){
    const info=CRAppwrite.explainError(e);if(m)m.textContent=info.friendly;currentWaitlistRows=[];statWaitlist.textContent='—';
  }
}

async function setWaitlistStatus(rowId,status){try{await CRAppwrite.updateWaitlistStatus(rowId,status)}catch(e){alert(CRAppwrite.explainError(e).friendly)}}
async function deleteWaitlist(rowId){if(!confirm('Delete this waitlist entry?'))return;try{await CRAppwrite.deleteAdminWaitlistRow(rowId);await loadWaitlist()}catch(e){alert(CRAppwrite.explainError(e).friendly)}}

document.addEventListener('DOMContentLoaded',restoreAdmin);


function pdfSafe(value){
  return String(value ?? '')
    .replace(/[–—]/g,'-')
    .replace(/[“”]/g,'"')
    .replace(/[‘’]/g,"'")
    .replace(/\u00a0/g,' ');
}

async function imageToDataURL(url){
  const response=await fetch(url,{cache:'no-store'});
  if(!response.ok) throw new Error('Logo konnte nicht geladen werden.');
  const blob=await response.blob();
  return await new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(reader.result);
    reader.onerror=reject;
    reader.readAsDataURL(blob);
  });
}

function waitlistSummary(rows){
  const grouped={};
  for(const row of rows){
    const product=pdfSafe(row.productName||row.productId||'Unknown product');
    grouped[product]=(grouped[product]||0)+1;
  }
  return Object.entries(grouped).sort((a,b)=>b[1]-a[1]);
}


function stripPdfDateMetadata(arrayBuffer){
  const bytes=new Uint8Array(arrayBuffer);
  let binary='';
  const chunk=0x8000;

  for(let i=0;i<bytes.length;i+=chunk){
    binary+=String.fromCharCode(...bytes.subarray(i,Math.min(i+chunk,bytes.length)));
  }

  // Keep identical byte length so the PDF xref offsets remain valid.
  const eraseSameLength = match => ' '.repeat(match.length);

  binary=binary.replace(/\/CreationDate\s*\([^)]*\)/g, eraseSameLength);
  binary=binary.replace(/\/ModDate\s*\([^)]*\)/g, eraseSameLength);

  // Extra protection for metadata dates written in PDF date syntax.
  binary=binary.replace(
    /\/(CreationDate|ModDate)\s*<[^>]*>/g,
    eraseSameLength
  );

  const cleaned=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++) cleaned[i]=binary.charCodeAt(i)&255;
  return cleaned;
}

function downloadPdfBytes(bytes,filename){
  const blob=new Blob([bytes],{type:'application/pdf'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
}

async function downloadWaitlistPDF(){
  const btn=document.getElementById('waitlistPdfBtn');
  const msg=document.getElementById('waitlistMsg');

  if(!window.jspdf || !window.jspdf.jsPDF){
    msg.textContent='PDF-Bibliothek konnte nicht geladen werden. Seite neu laden und erneut versuchen.';
    return;
  }

  btn.disabled=true;
  const oldText=btn.textContent;
  btn.textContent='CREATING PDF…';

  try{
    // Always reload before export so the PDF contains the newest Appwrite data.
    const rows=await CRAppwrite.listAdminWaitlist();
    currentWaitlistRows=rows;
    statWaitlist.textContent=rows.length;

    const {jsPDF}=window.jspdf;
    const doc=new jsPDF({
      orientation:'landscape',
      unit:'mm',
      format:'a4',
      compress:true
    });

    doc.setProperties({
      title:'Chevalier & Roth - Waitlist Register',
      subject:'Official administrative waitlist export',
      author:'Chevalier & Roth',
      creator:'Chevalier & Roth Admin'
    });

    const gold=[175,147,96];
    const ink=[18,18,18];
    const muted=[105,100,94];
    const pageW=doc.internal.pageSize.getWidth();
    const pageH=doc.internal.pageSize.getHeight();

    // Header brand block
    let logoAdded=false;
    try{
      const logo=await imageToDataURL('logo.PNG');
      doc.addImage(logo,'PNG',15,10,25,25,undefined,'FAST');
      logoAdded=true;
    }catch(e){
      console.warn('PDF logo:',e);
    }

    const titleX=logoAdded?46:15;
    doc.setTextColor(...ink);
    doc.setFont('helvetica','bold');
    doc.setFontSize(17);
    doc.text('CHEVALIER & ROTH',titleX,16);
    doc.setFont('helvetica','normal');
    doc.setFontSize(8);
    doc.setTextColor(...gold);
    doc.text('MAISON DE MODE · LUXEMBOURG',titleX,22);

    doc.setTextColor(...ink);
    doc.setFont('helvetica','bold');
    doc.setFontSize(22);
    doc.text('WAITLIST REGISTER',15,43);

    doc.setFont('helvetica','normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...muted);
    doc.text('Official Admin Export',15,49);
    doc.text(`Total waitlist entries: ${rows.length}`,15,54);

    // Product summary on the right
    const summary=waitlistSummary(rows);
    doc.setFont('helvetica','bold');
    doc.setTextColor(...ink);
    doc.setFontSize(9);
    doc.text('SUMMARY BY PRODUCT',pageW-90,16);
    doc.setFont('helvetica','normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...muted);

    let sy=22;
    for(const [product,count] of summary.slice(0,6)){
      const short=product.length>34?product.slice(0,31)+'...':product;
      doc.text(`${short}: ${count}`,pageW-90,sy);
      sy+=5;
    }
    if(summary.length>6){
      doc.text(`+ ${summary.length-6} more product(s)`,pageW-90,sy);
    }

    // Separator
    doc.setDrawColor(...gold);
    doc.setLineWidth(.5);
    doc.line(15,59,pageW-15,59);

    const body=rows.map((w,index)=>[
      String(index+1),
      pdfSafe(w.productName||w.productId||''),
      pdfSafe(w.name||''),
      pdfSafe(w.email||''),
      pdfSafe(w.size||'Not selected'),
      pdfSafe(w.color||'Not selected'),
      pdfSafe(w.status||'waiting')
    ]);

    doc.autoTable({
      startY:64,
      head:[['#','Product','Name','Email','Size','Colour','Status']],
      body,
      theme:'grid',
      styles:{
        font:'helvetica',
        fontSize:7.2,
        cellPadding:2.2,
        textColor:ink,
        lineColor:[220,215,207],
        lineWidth:.15,
        overflow:'linebreak',
        valign:'middle'
      },
      headStyles:{
        fillColor:ink,
        textColor:[245,239,228],
        fontStyle:'bold',
        fontSize:7.2,
        halign:'left'
      },
      alternateRowStyles:{fillColor:[249,247,242]},
      columnStyles:{
        0:{cellWidth:8,halign:'center'},
        1:{cellWidth:38},
        2:{cellWidth:34},
        3:{cellWidth:50},
        4:{cellWidth:16},
        5:{cellWidth:27},
        6:{cellWidth:25}
      },
      margin:{left:15,right:15,bottom:18},
      didDrawPage: function(data){
        if(data.pageNumber>1){
          doc.setFont('helvetica','bold');
          doc.setFontSize(9);
          doc.setTextColor(...ink);
          doc.text('CHEVALIER & ROTH · WAITLIST REGISTER',15,10);
          doc.setDrawColor(...gold);
          doc.line(15,13,pageW-15,13);
        }
      }
    });

    const pages=doc.getNumberOfPages();
    for(let i=1;i<=pages;i++){
      doc.setPage(i);
      doc.setDrawColor(210,205,197);
      doc.line(15,pageH-12,pageW-15,pageH-12);

      doc.setFont('helvetica','normal');
      doc.setFontSize(7);
      doc.setTextColor(...muted);
      doc.text('CONFIDENTIAL · ADMINISTRATIVE WAITLIST EXPORT',15,pageH-7);
      doc.text(`Page ${i} of ${pages}`,pageW-15,pageH-7,{align:'right'});
    }

    if(rows.length===0){
      doc.setFont('helvetica','italic');
      doc.setFontSize(12);
      doc.setTextColor(...muted);
      doc.text('No waitlist entries were present at the time of export.',15,75);
    }
    const rawPdf=doc.output('arraybuffer');
    const cleanedPdf=stripPdfDateMetadata(rawPdf);
    downloadPdfBytes(cleanedPdf,'Chevalier-Roth-Waitlist.pdf');
    msg.textContent=`PDF erstellt: ${rows.length} Wartelisten-Einträge.`;
  }catch(err){
    console.error('Waitlist PDF export failed',err);
    const info=CRAppwrite.explainError ? CRAppwrite.explainError(err,'PDF konnte nicht erstellt werden.') : {friendly:String(err)};
    msg.textContent=info.friendly || 'PDF konnte nicht erstellt werden.';
  }finally{
    btn.disabled=false;
    btn.textContent=oldText;
  }
}
