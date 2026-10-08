
let editId=null;

async function login(){
  const btn=document.getElementById('loginBtn');
  const msg=document.getElementById('msg');
  const debug=document.getElementById('debug');
  btn.disabled=true; msg.textContent='Checking Appwrite login…'; debug.textContent='';

  try{
    await CRAppwrite.login({
      email:document.getElementById('email').value.trim(),
      password:document.getElementById('password').value
    });

    if(!await CRAppwrite.isAdmin()){
      await CRAppwrite.logout();
      throw new Error('Dieses Konto ist nicht Mitglied des Appwrite-Admin-Teams.');
    }

    msg.textContent='';
    await showAdmin();
  }catch(err){
    const info=CRAppwrite.explainError(err,'Admin login failed.');
    msg.textContent=info.friendly;
    debug.textContent=info.details;
  }finally{
    btn.disabled=false;
  }
}

async function restoreAdmin(){
  const user=await CRAppwrite.currentUser();
  if(!user) return;
  if(await CRAppwrite.isAdmin()) await showAdmin();
}

async function showAdmin(){
  const user=await CRAppwrite.currentUser();
  document.getElementById('login').style.display='none';
  document.getElementById('dashboard').style.display='block';
  document.getElementById('adminIdentity').textContent=user?.email||'';
  refreshLocal();
  await loadWaitlist();
}

async function logout(){
  await CRAppwrite.logout();
  location.reload();
}

function refreshLocal(){
  const ps=CRStore.products(),codes=CRStore.codes(),orders=CRStore.orders();
  statProducts.textContent=ps.length;
  statOrders.textContent=orders.length;
  statRevenue.textContent=CRStore.money(orders.reduce((s,o)=>s+Number(o.total||0),0));
  statCodes.textContent=codes.filter(c=>c.active).length;

  productRows.innerHTML=ps.map(p=>`<tr>
    <td>${CRStore.esc(p.name)}</td>
    <td>${CRStore.money(p.price)}</td>
    <td>${p.stock}</td>
    <td>${p.active?'Active':'Hidden'}</td>
    <td><button class="admin-btn" onclick="editProduct('${p.id}')">Edit</button></td>
  </tr>`).join('');

  codeRows.innerHTML=codes.map(c=>`<tr>
    <td>${CRStore.esc(c.code)}</td>
    <td>${c.percent}%</td>
    <td>${c.active?'Active':'Inactive'}</td>
    <td>${c.uses||0}/${c.maxUses||'∞'}</td>
    <td><button class="admin-btn" onclick="toggleCode('${c.code}')">Toggle</button></td>
  </tr>`).join('');

  orderRows.innerHTML=orders.map(o=>`<tr>
    <td>${o.number}</td>
    <td>${new Date(o.date).toLocaleDateString()}</td>
    <td>${CRStore.esc(o.customer)}</td>
    <td>${CRStore.money(o.total)}</td>
    <td>${o.status}</td>
  </tr>`).join('');
}

async function loadWaitlist(){
  const msg=document.getElementById('waitlistMsg');
  msg.textContent='Loading central waitlist…';
  try{
    const rows=await CRAppwrite.listAdminWaitlist();
    statWaitlist.textContent=rows.length;
    waitlistRows.innerHTML=rows.length?rows.map(w=>`<tr>
      <td>${CRStore.esc(w.productName||w.productId)}</td>
      <td>${CRStore.esc(w.name||'')}</td>
      <td>${CRStore.esc(w.email||'')}</td>
      <td>${CRStore.esc(w.size||'—')}</td>
      <td>${CRStore.esc(w.color||'—')}</td>
      <td>
        <select class="admin-input" onchange="setWaitlistStatus('${w.$id}',this.value)">
          ${['waiting','contacted','invited','converted','cancelled'].map(s=>`<option value="${s}" ${w.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </td>
      <td>${w.$createdAt?new Date(w.$createdAt).toLocaleString():'—'}</td>
      <td><button class="admin-btn" onclick="deleteWaitlist('${w.$id}')">Delete</button></td>
    </tr>`).join(''):'<tr><td colspan="8">No waitlist entries yet.</td></tr>';
    msg.textContent='';
  }catch(err){
    const info=CRAppwrite.explainError(err,'Waitlist could not be loaded.');
    msg.textContent=info.friendly+' '+info.details;
    statWaitlist.textContent='—';
  }
}

async function setWaitlistStatus(rowId,status){
  try{
    await CRAppwrite.updateWaitlistStatus(rowId,status);
  }catch(err){
    const info=CRAppwrite.explainError(err);
    alert(info.friendly);
    await loadWaitlist();
  }
}

async function deleteWaitlist(rowId){
  if(!confirm('Wartelisteneintrag wirklich löschen?')) return;
  try{
    await CRAppwrite.deleteAdminWaitlistRow(rowId);
    await loadWaitlist();
  }catch(err){
    const info=CRAppwrite.explainError(err);
    alert(info.friendly);
  }
}

function val(id){return document.getElementById(id).value}

function saveProduct(){
  const ps=CRStore.products(),data={
    id:editId||'p'+Date.now(),
    name:val('pName'),
    category:val('pCategory'),
    price:+val('pPrice')||0,
    salePrice:val('pSale')?+val('pSale'):null,
    sizes:val('pSizes').split(',').map(x=>x.trim()).filter(Boolean),
    colors:val('pColors').split(',').map(x=>x.trim()).filter(Boolean),
    stock:+val('pStock')||0,
    sku:val('pSku'),
    badge:val('pBadge'),
    active:pActive.checked,
    images:val('pImages').split(',').map(x=>x.trim()).filter(Boolean),
    description:val('pDesc')
  };
  const i=ps.findIndex(p=>p.id===data.id);
  if(i>=0)ps[i]=data;else ps.push(data);
  CRStore.saveProducts(ps);
  editId=null;
  productForm.reset();
  pActive.checked=true;
  refreshLocal();
}

function editProduct(id){
  const p=CRStore.products().find(x=>x.id===id);if(!p)return;
  editId=id;
  pName.value=p.name;pCategory.value=p.category;pPrice.value=p.price;pSale.value=p.salePrice||'';
  pSizes.value=(p.sizes||[]).join(', ');pColors.value=(p.colors||[]).join(', ');
  pStock.value=p.stock;pSku.value=p.sku;pBadge.value=p.badge||'';
  pImages.value=(p.images||[]).join(', ');pDesc.value=p.description||'';pActive.checked=!!p.active;
  window.scrollTo({top:productForm.offsetTop-80,behavior:'smooth'});
}

function saveCode(){
  let cs=CRStore.codes(),code=cCode.value.trim().toUpperCase();if(!code)return;
  const d={
    code,percent:+cPercent.value||0,active:cActive.checked,start:cStart.value,end:cEnd.value,
    maxUses:+cMax.value||0,uses:0,minOrder:+cMin.value||0,
    products:cProducts.value.split(',').map(x=>x.trim()).filter(Boolean),
    categories:cCategories.value.split(',').map(x=>x.trim()).filter(Boolean)
  };
  const i=cs.findIndex(x=>x.code===code);
  if(i>=0)d.uses=cs[i].uses||0,cs[i]=d;else cs.push(d);
  CRStore.saveCodes(cs);refreshLocal();
}

function toggleCode(code){
  let cs=CRStore.codes(),c=cs.find(x=>x.code===code);
  if(c)c.active=!c.active;
  CRStore.saveCodes(cs);refreshLocal();
}

document.addEventListener('DOMContentLoaded',restoreAdmin);
