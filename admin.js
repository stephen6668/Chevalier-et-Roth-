
let editId=null;
let currentWaitlistRows=[];

// Local visual sample: deliberately kept out of Appwrite and official PDF exports.
const SAMPLE_KEY='cr_admin_demo_visible_v1';
const sampleMale=['Arno','Baptiste','Colin','Denis','Edgar','Ferdinand','Guillaume','Hector','Ivan','Joao','Kaspar','Loris','Manuel','Norbert','Orlando','Pierre','Remy','Sandro','Thierry','Ulrich','Vasco','Wilfried','Yves','Zeno','Augustin','Boris','Clement','Dominik','Ettore','Franco'];
const sampleFemale=['Alina','Barbara','Chiara','Dorothea','Esther','Fiona','Greta','Heloise','Ilona','Josefine','Karina','Lorena','Marta','Nora','Odette','Priscilla','Rosalie','Sabine','Tatiana','Ursula','Viola','Wilma','Yasmine','Zita','Amandine','Berenice','Cosima','Dalia','Evelina','Florence'];
const sampleLast=['Abreu','Antunes','Bastos','Bettencourt','Blum','Brandao','Cabral','Caldeira','Casagrande','Coutinho','Decker','Delgado','Domingues','Eberle','Esteves','Faria','Feltes','Filipe','Fischer-Daun','Francois','Goncalves','Hein','Henriques','Hoff','Jansen','Kemp','Kirsch','Lacerda','Lemoine','Lentz','Lourenco','Machado-Silva','Magalhaes','Mertens','Metzler','Morgado','Nobre','Pacheco','Pires','Reuter-Lenz','Sampaio','Sequeira','Serra','Valente','Varela'];
const sampleMail=['gmail.com','outlook.com','hotmail.com','icloud.com','yahoo.com','gmx.de','proton.me','mail.com'];

// Sample addresses are visually obfuscated. The stored values use reserved
// .example domains, preserving an email-format column without contacting anyone.
function sampleDisplayEmail(value,row){
  // Reconstruct the presentation address from the stable, internal sample ID.
  // This guarantees the expected provider suffix even for rows already in Appwrite.
  const match=String(row?.productId||row?.$id||'').match(/(?:cr-internal-sample-202610-|sample-)(\\d+)$/);
  if(match){
    const index=String(row?.productId||'').startsWith('cr-internal-sample-202610-')
      ?Number(match[1])-1:Number(match[1]);
    if(index>=0&&index<180){
      const local=String(value||'').replace(/\\(at\\).*/i,'').split('@')[0];
      return local+'(at)'+sampleMail[index%sampleMail.length];
    }
  }
  return String(value||'').replace(/\\(at\\)|@/i,'(at)');
}

function samplePeople(){
  const p=['Half-Zip','Men Trousers','Women Trousers','Women Cardigan'];
  return Array.from({length:180},(_,i)=>{
    const fn=(i%2?sampleFemale:sampleMale)[Math.floor(i/2)%30];
    const ln=sampleLast[(i*7+Math.floor(i/30))%sampleLast.length];
    const username=(fn+(i%3===0?'.':'')+ln+(i%5===0?'23':'')).toLowerCase().replace(/[^a-z0-9.]/g,'');
    return {$id:'sample-'+i,productName:p[i%4],name:fn+' '+ln,email:username+'(at)'+sampleMail[i%8],size:['XS','S','M','L','XL',''][i%6],color:['Beige','Navy','Black','Bordeaux','Brown',''][i%6],status:'waiting',sample:true,$createdAt:null};
  });
}
let sampleRows=samplePeople();
let samplesVisible=localStorage.getItem(SAMPLE_KEY)==='1';
function toggleWaitlistSamples(){
  samplesVisible=!samplesVisible;
  localStorage.setItem(SAMPLE_KEY,samplesVisible?'1':'0');
  renderWaitlist();
}
function clearWaitlistSamples(){
  if(!confirm('Alle 180 Beispielprofile aus der Ansicht entfernen? Echte Appwrite-Einträge bleiben erhalten.'))return;
  samplesVisible=false;localStorage.setItem(SAMPLE_KEY,'0');sampleRows=samplePeople();renderWaitlist();
}
function renderWaitlist(){
  const samples=samplesVisible?sampleRows:[];
  const rows=[...currentWaitlistRows,...samples];
  statWaitlist.textContent=currentWaitlistRows.filter(w=>!CRAppwrite.isSampleRow(w)).length;
  const count=document.getElementById('sampleCount');
  const toggle=document.getElementById('sampleToggle');
  if(count) count.textContent=samplesVisible?('Echte Anmeldungen: '+currentWaitlistRows.filter(w=>!CRAppwrite.isSampleRow(w)).length+' · gespeicherte Beispiele: '+currentWaitlistRows.filter(CRAppwrite.isSampleRow).length+' · Vorschau: '+samples.length):('Echte Anmeldungen: '+currentWaitlistRows.filter(w=>!CRAppwrite.isSampleRow(w)).length+' · gespeicherte Beispiele: '+currentWaitlistRows.filter(CRAppwrite.isSampleRow).length);
  if(toggle) toggle.textContent=samplesVisible?'BEISPIELPROFILE AUSBLENDEN':'180 BEISPIELPROFILE ANZEIGEN';
  const escape=w=>CRStore.esc(w||'');
  waitlistRows.innerHTML=rows.length?rows.map(w=>`<tr${w.sample?' style="background:rgba(187,158,100,.09)"':''}>
      <td>${escape(w.productName||w.productId)}${w.sample||CRAppwrite.isSampleRow(w)?' <small style="color:#bc9c61">(Beispiel)</small>':''}</td>
      <td>${escape(w.name)}</td><td>${escape(w.sample||CRAppwrite.isSampleRow(w)?sampleDisplayEmail(w.email,w):w.email)}</td>
      <td>${escape(w.size||'Not selected')}</td><td>${escape(w.color||'Not selected')}</td>
      <td><select class="admin-input" onchange="${w.sample?'setSampleStatus(\''+w.$id+'\',this.value)':'setWaitlistStatus(\''+w.$id+'\',this.value)'}">
        ${['waiting','contacted','invited','converted','cancelled'].map(s=>`<option value="${s}" ${w.status===s?'selected':''}>${s}</option>`).join('')}</select></td>
      <td>${w.sample?'—':w.$createdAt?new Date(w.$createdAt).toLocaleString():'—'}</td>
      <td><button class="admin-btn" onclick="${w.sample?'deleteSample(\''+w.$id+'\')':'deleteWaitlist(\''+w.$id+'\')'}">Delete</button></td>
    </tr>`).join(''):'<tr><td colspan="8">No waitlist entries yet.</td></tr>';
}
function setSampleStatus(id,status){const row=sampleRows.find(r=>r.$id===id);if(row)row.status=status;}
function deleteSample(id){sampleRows=sampleRows.filter(r=>r.$id!==id);renderWaitlist();}



async function importSampleWaitlist(){
 if(!confirm('180 interne Beispielprofile wirklich in Appwrite speichern? Sie bleiben als Beispiele erkennbar.'))return;
 const btn=document.getElementById('sampleImportBtn'),msg=document.getElementById('waitlistMsg');
 btn.disabled=true;
 try{
  samplesVisible=false;localStorage.setItem(SAMPLE_KEY,'0');
  const result=await CRAppwrite.insertAdminSampleRows(samplePeople(),p=>{msg.textContent='Appwrite Import: '+p.processed+'/180 · gespeichert '+p.created+' · Fehler '+p.failed;});
  await loadWaitlist();
  msg.textContent='Import abgeschlossen: '+result.created+' gespeichert, '+result.skipped+' bereits vorhanden, '+result.failed+' Fehler.';
 }catch(e){msg.textContent=CRAppwrite.explainError(e).friendly}
 finally{btn.disabled=false}
}
async function purgeSampleWaitlist(){
 if(!confirm('Alle INTERNEN Appwrite-Beispiele dauerhaft löschen? Echte Anmeldungen werden nicht gelöscht.'))return;
 const btn=document.getElementById('samplePurgeBtn'),msg=document.getElementById('waitlistMsg');
 btn.disabled=true;
 try{
  const result=await CRAppwrite.deleteAdminSampleRows(p=>{msg.textContent='Beispiele gelöscht: '+p.deleted+'/'+p.total});
  await loadWaitlist();msg.textContent='Entfernt: '+result.deleted+' · Fehler: '+result.failed;
 }catch(e){msg.textContent=CRAppwrite.explainError(e).friendly}
 finally{btn.disabled=false}
}

async function login(){
  const btn=document.getElementById('loginBtn');
  const msg=document.getElementById('msg');
  const debug=document.getElementById('debug');
  btn.disabled=true;
  msg.textContent='Checking Appwrite login…';
  debug.textContent='';

  try{
    // Appwrite allows only one active email/password session in this browser.
    // If a session already exists, either reuse it (when it is already an admin)
    // or sign it out before logging into the requested admin account.
    const existing=await CRAppwrite.currentUser();

    if(existing){
      const existingIsAdmin=await CRAppwrite.isAdmin();

      if(existingIsAdmin){
        msg.textContent='Admin-Sitzung bereits aktiv.';
        debug.textContent='Eingeloggt als: '+(existing.email||existing.name||existing.$id);
        await showAdmin();
        return;
      }

      msg.textContent='Ein anderes Konto ist eingeloggt. Wechsle zum Admin-Konto…';
      await CRAppwrite.logout();
    }

    await CRAppwrite.login({
      email:document.getElementById('email').value.trim(),
      password:document.getElementById('password').value
    });

    if(!await CRAppwrite.isAdmin()){
      const signedIn=await CRAppwrite.currentUser();
      await CRAppwrite.logout();
      throw new Error(
        'Login erfolgreich, aber dieses Konto ist nicht Mitglied des Appwrite-Admin-Teams. ' +
        (signedIn?.email ? 'Konto: '+signedIn.email : '')
      );
    }

    msg.textContent='';
    debug.textContent='';
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

  if(await CRAppwrite.isAdmin()){
    await showAdmin();
    return;
  }

  const msg=document.getElementById('msg');
  const debug=document.getElementById('debug');
  if(msg) msg.textContent='Es ist bereits ein normales Kundenkonto eingeloggt. Wenn du dich als Admin anmeldest, wird dieses Konto automatisch abgemeldet.';
  if(debug) debug.textContent='Aktuelle Sitzung: '+(user.email||user.name||user.$id);
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
    currentWaitlistRows=rows;
    statWaitlist.textContent=rows.filter(w=>!CRAppwrite.isSampleRow(w)).length;
    renderWaitlist();
    msg.textContent='';
  }catch(err){
    const info=CRAppwrite.explainError(err,'Waitlist could not be loaded.');
    msg.textContent=info.friendly+' '+info.details;
    currentWaitlistRows=[];
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
