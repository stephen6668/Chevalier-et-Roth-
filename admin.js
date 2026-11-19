'use strict';
(() => {
  const api = window.CRBackend;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const config = api?.config || {};
  const staticAdmin=()=>location.hostname.endsWith('.github.io')&&!window.CR_COMMERCE_CONFIG?.backendOrigin;
  $('#stripe-admin-hosted').hidden=!staticAdmin();
  const views = {
    waitlist: {table: config.waitlistTableId, caption: 'WARTELISTE', title: 'Vorfreude auf die Kollektion.', description: 'Anmeldungen mit gewähltem Produkt, Farbe und Größe. Der Status wird direkt in Appwrite gespeichert.'},
    products: {table: config.productTableId, caption: 'CR_PRODUCTS', title: 'Die Signature-Kollektion.', description: 'Produktdaten und Bestand aus Appwrite. p1 = Half-Zip · p2 = Damenhose · p3 = Body · p4 = Herrenhose. Die Produktfotos werden über den lokalen Katalog zugeordnet.'},
    codes: {table: config.codeTableId, caption: 'STRIPE · RABATTCODES', title: 'Besondere Einladungen.', description: 'Aktivieren, deaktivieren und speichern Sie Rabattcodes direkt bei Stripe. Kunden geben ihren Code einmal im Checkout ein; der bestätigte Rabatt wird automatisch zur Stripe-Zahlung übernommen.'},
    orders: {table: config.orderTableId, caption: 'CR_ORDERS', title: 'Bestellungen im Überblick.', description: 'Bestehende Bestellungen aus Appwrite. Diese Ansicht liest die vom Bestellsystem gespeicherten Daten.'},
    giveaway: {table: config.giveawayTableId, caption: 'FIRST COLLECTION GIVEAWAY', title: 'Ein besonderer Auftakt.', description: 'Teilnahmen am First Collection Giveaway. Statusänderungen werden in cr_giveaway gespeichert.'}
  };
  const waitlistStatuses = ['waiting', 'contacted', 'invited', 'converted', 'cancelled'];
  const giveawayStatuses = ['entered', 'winner', 'contacted', 'invalid'];
  const statusNames = {waiting:'Wartend',contacted:'Kontaktiert',invited:'Eingeladen',converted:'Abgeschlossen',cancelled:'Abgemeldet',entered:'Teilgenommen',winner:'Gewinner',invalid:'Ungültig',paid:'Bezahlt'};
  let authenticated = false, activeTab = 'waitlist', rows = [], loadVersion = 0, authVersion = 0, editor = null, saving = false, stripeConnected = false;
  const money = value => new Intl.NumberFormat('de-DE', {style:'currency', currency:'EUR'}).format(Number(value) || 0);
  const date = value => {const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? String(value || '—') : parsed.toLocaleString('de-DE');};
  const text = value => String(value ?? '');
  const el = (tag, value, className) => {const node = document.createElement(tag); if (value !== undefined) node.textContent = text(value); if(className) node.className = className; return node;};
  const raw = (tag, value, className) => {const node = el(tag, value, className); node.dataset.userContent = ''; return node;};
  // Translate UI labels while leaving the values received from Appwrite untouched.
  window.CR_TRANSLATIONS ||= {};
  for(const [source,en,fr] of [['Gewinn:','Prize:','Prix :'],['Produkte:','Products:','Produits :'],['Kategorien:','Categories:','Catégories :']]) {
    for(const [language,label] of [['en',en],['fr',fr]]) {(window.CR_TRANSLATIONS[language] ||= {})[source] = label;}
  }
  for(const [source,en,fr] of [
    ['Bezahlt','Paid','Payé'],['Lieferung','Delivery','Livraison'],['Lieferadresse','Delivery address','Adresse de livraison'],['Telefon','Phone','Téléphone'],['Rabattcode','Discount code','Code de réduction'],
    ['Lieferadresse nicht hinterlegt.','No delivery address recorded.','Aucune adresse de livraison enregistrée.'],
    ['Rabattcodes · Stripe','Discount codes · Stripe','Codes de réduction · Stripe'],
    ['STRIPE · RABATTCODES','STRIPE · DISCOUNT CODES','STRIPE · CODES DE RÉDUCTION'],
    ['Aktivieren, deaktivieren und speichern Sie Rabattcodes direkt bei Stripe. Kunden geben ihren Code einmal im Checkout ein; der bestätigte Rabatt wird automatisch zur Stripe-Zahlung übernommen.','Activate, deactivate and save discount codes directly in Stripe. Customers enter a code once at checkout; the confirmed discount is carried over to Stripe payment.','Activez, désactivez et enregistrez les codes de réduction directement dans Stripe. Le client saisit le code une seule fois ; la réduction confirmée est transmise au paiement Stripe.'],
    ['Aktivierte Rabattcodes werden direkt bei Stripe gespeichert und beim Checkout automatisch übernommen.','Activated discount codes are saved directly in Stripe and carried over automatically at checkout.','Les codes activés sont enregistrés directement dans Stripe et repris automatiquement au paiement.'],
    ['Stripe-Verbindung wird geprüft…','Checking the Stripe connection…','Vérification de la connexion Stripe…'],
    ['Stripe verbunden · Änderungen werden direkt übernommen.','Stripe connected · Changes take effect immediately.','Stripe connecté · Les modifications sont prises en compte immédiatement.'],
    ['Die Stripe-Verbindung konnte nicht bestätigt werden.','The Stripe connection could not be confirmed.','La connexion Stripe n’a pas pu être confirmée.'],
    ['Stripe konnte nicht bestätigt werden. Bitte laden Sie die Rabattcodes neu, bevor Sie Änderungen vornehmen.','Stripe could not be confirmed. Reload the discount codes before making changes.','La connexion Stripe n’a pas pu être confirmée. Rechargez les codes avant toute modification.'],
    ['Rabattcodes werden bei Stripe geladen…','Loading discount codes from Stripe…','Chargement des codes de réduction depuis Stripe…'],
    ['Noch nicht mit Stripe verbunden','Not yet connected to Stripe','Pas encore connecté à Stripe'],
    ['BEI STRIPE AKTIV','ACTIVE IN STRIPE','ACTIF DANS STRIPE'],
    ['BEI STRIPE INAKTIV','INACTIVE IN STRIPE','INACTIF DANS STRIPE'],
    ['Mit Stripe verbinden','Connect to Stripe','Connecter à Stripe'],
    ['Bei Stripe aktivieren','Activate in Stripe','Activer dans Stripe'],
    ['Bei Stripe deaktivieren','Deactivate in Stripe','Désactiver dans Stripe'],
    ['Rabatt','Discount','Réduction'],['Einlösungen','Redemptions','Utilisations'],['Mindestbestellwert','Minimum order value','Montant minimum de commande'],
    ['Gültig ab','Valid from','Valable à partir du'],['Gültig bis','Valid until','Valable jusqu’au'],['Ab sofort','Immediately','Immédiatement'],['Ohne Enddatum','No end date','Sans date de fin'],
    ['Dieser frühere Appwrite-Code gilt noch nicht als Stripe-Rabatt. Speichern Sie ihn, um ihn mit Stripe zu verbinden.','This earlier Appwrite code is not yet a Stripe discount. Save it to connect it to Stripe.','Cet ancien code Appwrite n’est pas encore une réduction Stripe. Enregistrez-le pour le connecter à Stripe.'],
    ['Produkt- oder Kategoriebedingungen dieses früheren Codes werden noch nicht unterstützt. Der Code wird nicht automatisch für alle Produkte freigegeben.','Product or category restrictions on this earlier code are not supported yet. The code will not be enabled for all products automatically.','Les restrictions de produit ou de catégorie de cet ancien code ne sont pas encore prises en charge. Le code ne sera pas activé automatiquement pour tous les produits.'],
    ['Es gibt noch keine mit Stripe verbundenen Rabattcodes.','There are no discount codes connected to Stripe yet.','Aucun code de réduction n’est encore connecté à Stripe.'],
    ['Frühere Appwrite-Codes konnten nicht geladen werden. Die Stripe-Codes sind aktuell.','Earlier Appwrite codes could not be loaded. The Stripe codes are up to date.','Les anciens codes Appwrite n’ont pas pu être chargés. Les codes Stripe sont à jour.'],
    ['Rabattcodes von Stripe aktualisiert.','Discount codes updated from Stripe.','Codes de réduction actualisés depuis Stripe.'],
    ['Änderung wird direkt bei Stripe gespeichert…','Saving the change directly in Stripe…','Enregistrement de la modification dans Stripe…'],
    ['Bei Stripe gespeichert und bestätigt.','Saved and confirmed in Stripe.','Enregistré et confirmé dans Stripe.'],
    ['Code bei Stripe aktiv','Code active in Stripe','Code actif dans Stripe'],
    ['Nur Buchstaben, Ziffern und Bindestriche, ohne Leerzeichen.','Letters, numbers and dashes only, without spaces.','Lettres, chiffres et tirets uniquement, sans espaces.'],
    ['Den Codenamen ändern Sie durch Anlegen eines neuen Codes.','Create a new code to use a different code name.','Créez un nouveau code pour utiliser un autre nom.'],
    ['Aktivierte Codes gelten sofort. Künftiger Start: zunächst inaktiv speichern.','Activated codes take effect immediately. For a future start, save as inactive first.','Les codes activés prennent effet immédiatement. Pour une date future, enregistrez d’abord le code comme inactif.'],
    ['Bei Stripe speichern','Save in Stripe','Enregistrer dans Stripe'],
    ['Stripe-Status erneut prüfen','Check Stripe status again','Vérifier à nouveau l’état Stripe'],
    ['Rabattcodes werden über die gehostete Website verwaltet.','Discount codes are managed on the hosted website.','Les codes de réduction sont gérés sur le site hébergé.'],
    ['Verwaltung öffnen','Open administration','Ouvrir l’administration'],
    ['Gilt für alle Produkte. Frühere Codes mit Produkt- oder Kategoriebedingungen können hier nicht importiert werden.','Applies to all products. Earlier codes with product or category restrictions cannot be imported here.','Valable pour tous les produits. Les anciens codes comportant des restrictions de produit ou de catégorie ne peuvent pas être importés ici.'],
    ['Dieser frühere Code wurde bereits verwendet oder sein Nutzungsstand ist unklar. Legen Sie bei Bedarf einen neuen Code mit dem verbleibenden Nutzungslimit an.','This earlier code has already been used or its redemption count is unclear. If needed, create a new code with the remaining redemption limit.','Cet ancien code a déjà été utilisé ou son nombre d’utilisations est incertain. Si nécessaire, créez un nouveau code avec le nombre d’utilisations restant.'],
    ['Bisherige Nutzungen in Appwrite','Previous redemptions in Appwrite','Utilisations précédentes dans Appwrite'],
    ['Von Stripe bestätigte Einlösungen','Redemptions confirmed by Stripe','Utilisations confirmées par Stripe'],
    ['Stripe zählt die Einlösungen automatisch.','Stripe counts redemptions automatically.','Stripe comptabilise automatiquement les utilisations.'],
    ['Gültigkeit als Datum mit Zeitzone, z. B. 2027-01-02T00:00:00+01:00','Date and timezone, e.g. 2027-01-02T00:00:00+01:00','Date avec fuseau horaire, par exemple 2027-01-02T00:00:00+01:00'],
    ['Leer = ohne Enddatum','Leave empty for no end date','Laisser vide pour aucune date de fin'],
    ['Maximale Nutzungen · 0 = unbegrenzt','Maximum redemptions · 0 = unlimited','Utilisations maximales · 0 = illimité'],
    ['Bitte einen Code mit 1 bis 64 Buchstaben, Ziffern oder Bindestrichen eingeben.','Enter a code with 1 to 64 letters, numbers or dashes.','Saisissez un code de 1 à 64 lettres, chiffres ou tirets.'],
    ['Bitte einen ganzzahligen Rabatt von 1 bis 100 % und gültige Nutzungswerte eingeben.','Enter a whole-number discount from 1 to 100% and valid redemption values.','Saisissez une réduction entière de 1 à 100 % et des limites d’utilisation valides.'],
    ['Die Admin-Sitzung konnte nicht bestätigt werden. Bitte erneut anmelden.','The admin session could not be confirmed. Sign in again.','La session administrateur n’a pas pu être confirmée. Reconnectez-vous.'],
    ['Die Stripe-Antwort dauert zu lange. Prüfen Sie den aktuellen Code-Status vor einem erneuten Speichern.','Stripe is taking too long to respond. Check the current code status before saving again.','La réponse de Stripe prend trop de temps. Vérifiez l’état actuel du code avant de réessayer.']
  ]) for(const [language,label] of [['en',en],['fr',fr]]) (window.CR_TRANSLATIONS[language] ||= {})[source]=label;
  const message = (selector, value, kind = '') => {const node = $(selector); node.textContent = value; node.className = `status ${kind}`.trim();};
  const errorMessage = error => error?.stripeAdmin ? error.message : api?.errorMessage ? api.errorMessage(error) : 'Die Appwrite-Verbindung konnte nicht geladen werden. Bitte laden Sie die Seite erneut.';
  async function stripeAdmin(path, body) {
    if(staticAdmin()) {const error=new Error('Rabattcodes werden über die gehostete Website verwaltet.');error.stripeAdmin=true;throw error;}
    const version=authVersion, jwt=await api.createAdminJWT();
    if(!authenticated || version!==authVersion) throw new Error('Die Admin-Sitzung konnte nicht bestätigt werden. Bitte erneut anmelden.');
    const origin=window.CR_COMMERCE_CONFIG?.backendOrigin;
    let url;
    if(origin) {const base=new URL(origin); if(base.protocol!=='https:' || base.username || base.password) throw new Error('Die Stripe-Verbindung konnte nicht bestätigt werden.'); url=new URL(path,base.origin);}
    else url=new URL(path,location.origin);
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
    try {
      const response=await fetch(url.href,{method:body?'POST':'GET',headers:{authorization:'Bearer '+jwt,...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),credentials:'same-origin',cache:'no-store',signal:controller.signal});
      let data;try{data=await response.json();}catch{throw new Error('Die Stripe-Verbindung konnte nicht bestätigt werden.');}
      if(!response.ok) throw new Error(data.message || 'Stripe konnte nicht bestätigt werden. Bitte laden Sie die Rabattcodes neu, bevor Sie Änderungen vornehmen.');
      return data;
    } catch(error) {const result=new Error(error.name==='AbortError'?'Die Stripe-Antwort dauert zu lange. Prüfen Sie den aktuellen Code-Status vor einem erneuten Speichern.':error instanceof TypeError?'Die Stripe-Verbindung konnte nicht bestätigt werden.':error.message);result.stripeAdmin=true;throw result;}
    finally {clearTimeout(timer);}
  }
  function codeScopeUnsupported(row) {return ['products','categories'].some(key=>{const values=parseArray(row?.[key] || '[]');return !values || values.length>0;});}
  function legacyImportIssue(row) {
    if(!row?._legacy) return '';
    if(codeScopeUnsupported(row)) return 'Produkt- oder Kategoriebedingungen dieses früheren Codes werden noch nicht unterstützt. Der Code wird nicht automatisch für alle Produkte freigegeben.';
    if(!Number.isInteger(Number(row.uses || 0)) || Number(row.uses || 0)!==0) return 'Dieser frühere Code wurde bereits verwendet oder sein Nutzungsstand ist unklar. Legen Sie bei Bedarf einen neuen Code mit dem verbleibenden Nutzungslimit an.';
    return '';
  }
  function codePayload(row, active=row.active) {return {id:row._stripe?row.id:undefined,code:String(row.code || '').trim().toUpperCase(),percent:Number(row.percent),active:active===true,minOrder:Number(row.minOrder || 0),start:row.start || '',end:row.end || '',maxUses:Number(row.maxUses || 0)};}
  function addLine(container, value, className) {const line = el('p', value, className); container.append(line); return line;}
  function addRawLine(container, value, className) {const line = raw('p', value, className); container.append(line); return line;}
  function orderDeliveryDetails(items) {
    const block=el('section',undefined,'order-delivery');block.append(el('h4','Lieferung'));
    const safe=value=>typeof value==='string'||typeof value==='number'?String(value).trim():'';
    const delivery=items?.find(item=>item?.delivery&&typeof item.delivery==='object')?.delivery;
    const address=delivery?.address&&typeof delivery.address==='object'?delivery.address:{};
    const lines=[safe(delivery?.name),safe(address.line1),safe(address.line2),[safe(address.postal_code),safe(address.city)].filter(Boolean).join(' '),safe(address.state),safe(address.country)].filter(Boolean);
    if(lines.length) {
      block.append(el('p','Lieferadresse','order-delivery-label'));
      const addressBlock=raw('address',undefined,'order-delivery-address');
      lines.forEach(line=>addressBlock.append(raw('span',line)));block.append(addressBlock);
    } else block.append(el('p','Lieferadresse nicht hinterlegt.','record-meta'));
    const phone=safe(delivery?.phone);
    if(phone) {const line=el('p',undefined,'order-delivery-contact');line.append(el('span','Telefon'),document.createTextNode(' · '),raw('span',phone));block.append(line);}
    const discount=items?.find(item=>item?.discount&&typeof item.discount==='object')?.discount;
    if(discount&&safe(discount.code)) {
      const line=el('p',undefined,'order-discount');line.append(el('span','Rabattcode'),document.createTextNode(' · '),raw('span',safe(discount.code)));
      if(Number.isSafeInteger(discount.amountCents)&&discount.amountCents>=0)line.append(document.createTextNode(' · −'+money(discount.amountCents/100)));
      block.append(line);
    }
    return block;
  }
  function setLoginView(note = '', kind = '') {
    authenticated = false; stripeConnected = false; loadVersion++;
    $('#login-view').hidden = false; $('#admin-view').hidden = true; $('#records').replaceChildren(); rows = [];
    if ($('#edit-dialog').open) $('#edit-dialog').close();
    $('#edit-fields').replaceChildren(); $('#admin-identity').textContent = ''; editor = null;
    $('#stripe-code-connection').hidden = true;
    message('#login-status', note, kind);
  }
  async function establishSession() {
    const version = ++authVersion;
    try {
      const user = await api.currentUser();
      if (version !== authVersion) return;
      $('#session-logout').hidden = !user;
      if (!user) {setLoginView('Bitte melden Sie sich an.'); return;}
      if (!await api.isAdmin()) {
        if (version !== authVersion) return;
        setLoginView('Dieses Konto gehört nicht zum Appwrite-Admin-Team. Melden Sie sich mit einem berechtigten Konto an.', 'error'); return;
      }
      if (version !== authVersion) return;
      authenticated = true; $('#login-view').hidden = true; $('#admin-view').hidden = false;
      $('#admin-identity').textContent = [user.name, user.email].filter(Boolean).join(' · ');
      $('#admin-login').reset(); await loadRecords();
    } catch (error) {if(version === authVersion) setLoginView(errorMessage(error), 'error');}
  }
  $('#admin-login').addEventListener('submit', async event => {
    event.preventDefault(); if (!api) return;
    const form = event.currentTarget; $('#login-button').disabled = true;
    message('#login-status', 'Anmeldung wird geprüft…');
    try {await api.login(form.elements.email.value.trim(), form.elements.password.value); await establishSession();}
    catch(error) {message('#login-status', errorMessage(error), 'error');}
    finally {$('#login-button').disabled = false; form.elements.password.value = '';}
  });
  async function logout() {
    if(saving) return;
    ++authVersion; setLoginView('Abmeldung läuft…'); $('#session-logout').disabled = true; $('#admin-logout').disabled = true;
    try {await api.logout(); $('#session-logout').hidden = true; message('#login-status', 'Sie wurden abgemeldet.');}
    catch(error) {$('#session-logout').hidden = false; message('#login-status', errorMessage(error), 'error');}
    finally {$('#session-logout').disabled = false; $('#admin-logout').disabled = false;}
  }
  $('#admin-logout').addEventListener('click', logout); $('#session-logout').addEventListener('click', logout);
  $$('[data-tab]').forEach(button => button.addEventListener('click', () => {
    if (!authenticated || saving) return;
    activeTab = button.dataset.tab;
    $$('[data-tab]').forEach(tab => {if(tab === button) tab.setAttribute('aria-current', 'page'); else tab.removeAttribute('aria-current');});
    loadRecords();
  }));
  $('#refresh-records').addEventListener('click', loadRecords);
  async function loadRecords() {
    if (!authenticated) return;
    const version = ++loadVersion, selected = activeTab, view = views[selected];
    rows = []; $('#records').replaceChildren(); $('#data-panel').setAttribute('aria-busy', 'true');
    $('#section-caption').textContent = view.caption; $('#section-title').textContent = view.title; $('#section-description').textContent = view.description;
    $('#new-record').hidden = !['products','codes'].includes(selected); $('#new-record').disabled = true; $('#refresh-records').disabled = true;
    $('#stripe-code-connection').hidden = selected !== 'codes';
    if(selected==='codes') {stripeConnected=false;message('#stripe-code-status','Stripe-Verbindung wird geprüft…');return loadCodes(version);}
    message('#records-status', 'Daten werden aus Appwrite geladen…');
    try {
      const result = await api.list(view.table);
      if (version !== loadVersion || !authenticated || activeTab !== selected) return;
      rows = [...result].sort((a,b) => text(b.$createdAt).localeCompare(text(a.$createdAt)));
      renderRecords(); message('#records-status', `${rows.length} ${rows.length === 1 ? 'Eintrag' : 'Einträge'} · Aktualisiert ${new Date().toLocaleTimeString('de-DE')}`);
      $('#new-record').disabled = selected === 'products' && ['p1','p2','p3','p4'].every(id => rows.some(row => row.$id === id));
      return true;
    } catch(error) {
      if (version !== loadVersion) return;
      rows = []; $('#records').replaceChildren(el('div','Die Daten konnten nicht geladen werden. Bitte prüfen Sie Ihre Sitzung und versuchen Sie es erneut.','empty-state'));
      message('#records-status', errorMessage(error), 'error');
      return false;
    } finally {
      if(version === loadVersion) {$('#data-panel').setAttribute('aria-busy','false'); $('#refresh-records').disabled = false;}
    }
  }
  async function loadCodes(version) {
    message('#records-status','Rabattcodes werden bei Stripe geladen…');
    const results=await Promise.allSettled([stripeAdmin('/api/admin/codes'),api.list(config.codeTableId)]);
    if(version!==loadVersion || !authenticated || activeTab!=='codes') return false;
    const [stripe,legacy]=results;
    try {
      const synced=stripe.status==='fulfilled'&&Array.isArray(stripe.value.codes)?stripe.value.codes:null;
      stripeConnected=!!synced;
      const codes=synced || [], names=new Set(codes.map(row=>String(row.code || '').toUpperCase()));
      const old=legacy.status==='fulfilled'&&Array.isArray(legacy.value)?legacy.value.filter(row=>!names.has(String(row.code || '').toUpperCase())):[];
      rows=[...codes.map(row=>({...row,$id:row.id,$createdAt:row.createdAt,_stripe:true})),...old.map(row=>({...row,_legacy:true}))];
      renderRecords();
      if(!synced) {message('#stripe-code-status','Die Stripe-Verbindung konnte nicht bestätigt werden.','error');message('#records-status',errorMessage(stripe.status==='rejected'?stripe.reason:new Error('Stripe konnte nicht bestätigt werden. Bitte laden Sie die Rabattcodes neu, bevor Sie Änderungen vornehmen.')),'error');return false;}
      message('#stripe-code-status','Stripe verbunden · Änderungen werden direkt übernommen.','success');
      message('#records-status',legacy.status==='rejected'?'Frühere Appwrite-Codes konnten nicht geladen werden. Die Stripe-Codes sind aktuell.':'Rabattcodes von Stripe aktualisiert.');
      return true;
    } finally {
      if(version===loadVersion) {$('#data-panel').setAttribute('aria-busy','false');$('#refresh-records').disabled=false;$('#new-record').disabled=!stripeConnected;}
    }
  }
  function recordBase(title, row) {
    const card = el('article', undefined, 'record-card'), body = el('div'), actions = el('div', undefined, 'record-actions');
    body.append(raw('h3', title)); addRawLine(body, `ID ${text(row.$id)} · ${date(row.$createdAt)}`, 'record-meta'); card.append(body, actions); return {card, body, actions};
  }
  function editButton(actions, row) {const button = el('button','Bearbeiten','outline-button'); button.type = 'button'; button.addEventListener('click',()=>openEditor(row)); actions.append(button);}
  function statusControl(actions, row, statuses) {
    const label = el('label','Status'), select = document.createElement('select'); select.setAttribute('aria-label',`Status für ${text(row.name || row.email || row.$id)}`);
    const values = statuses.includes(row.status) ? statuses : [row.status,...statuses].filter(Boolean);
    values.forEach(value => {const option = statusNames[value] ? el('option',statusNames[value]) : raw('option',value); option.value = value; select.append(option);}); select.value = row.status || statuses[0];
    label.append(select); actions.append(label);
    select.addEventListener('change', async () => {
      const before = row.status || statuses[0], version = loadVersion, table = views[activeTab].table; select.disabled = true;
      message('#records-status','Status wird gespeichert…');
      try {await api.update(table,row.$id,{status:select.value}); if(version === loadVersion && authenticated) {row.status = select.value; message('#records-status','Status in Appwrite gespeichert.','success');}}
      catch(error) {select.value = before; if(version === loadVersion) message('#records-status',errorMessage(error),'error');}
      finally {select.disabled = false;}
    });
  }
  function renderRecords() {
    const container = $('#records'); container.replaceChildren();
    if(!rows.length) {container.append(el('div',activeTab==='codes'?'Es gibt noch keine mit Stripe verbundenen Rabattcodes.':'In diesem Bereich sind noch keine Einträge vorhanden.','empty-state')); return;}
    const list = el('div',undefined,'record-list');
    rows.forEach(row => {
      let parts;
      if(activeTab === 'waitlist') {
        parts = recordBase(row.name || 'Wartelistenanmeldung',row);
        addRawLine(parts.body,row.email); addRawLine(parts.body,[row.productName || row.productId,row.color,row.size].filter(Boolean).join(' · '));
        statusControl(parts.actions,row,waitlistStatuses);
      } else if(activeTab === 'giveaway') {
        parts = recordBase([row.firstName,row.lastName].filter(Boolean).join(' ') || 'Giveaway-Teilnahme',row);
        addRawLine(parts.body,row.email); const prize = el('p'); prize.append(el('span','Gewinn:'),document.createTextNode(' '),raw('span',row.prizeName || row.prizeId)); parts.body.append(prize);
        addLine(parts.body,`Datenschutz bestätigt: ${row.privacyAccepted === true ? 'Ja' : 'Nein'}`,'record-meta');
        statusControl(parts.actions,row,giveawayStatuses);
      } else if(activeTab === 'products') {
        parts = recordBase(row.name || row.$id,row);
        parts.body.append(el('span',row.active === false ? 'INAKTIV' : 'AKTIV','badge'));
        addRawLine(parts.body,[row.category,row.sku].filter(Boolean).join(' · '));
        const fields = el('div',undefined,'record-fields'); fields.append(el('span',`Preis ${money(row.price)}`),el('span',`Aktionspreis ${Number(row.salePrice) > 0 ? money(row.salePrice) : '—'}`),el('span',`Bestand ${text(row.stock ?? 0)}`)); parts.body.append(fields);
        if(row.description) addRawLine(parts.body,row.description); editButton(parts.actions,row);
      } else if(activeTab === 'codes') {
        parts = recordBase(row.code || 'Code',row);
        parts.body.append(el('span',row._unconfirmed?'Stripe-Status erneut prüfen':row._legacy?'Noch nicht mit Stripe verbunden':row.active===true?'BEI STRIPE AKTIV':'BEI STRIPE INAKTIV','badge '+(row._legacy?'code-legacy':row.active===true&&!row._unconfirmed?'code-active':'')));
        const facts=el('div',undefined,'code-facts');
        for(const [label,value] of [['Rabatt',text(row.percent || 0)+' %'],['Einlösungen',text(row.uses || 0)+' / '+(Number(row.maxUses)>0?text(row.maxUses):'∞')],['Mindestbestellwert',money(row.minOrder)]]) {const item=el('span');item.append(el('span',label),document.createTextNode(' '),raw('span',value));facts.append(item);}parts.body.append(facts);
        for(const [label,value,fallback] of [['Gültig ab',row.start,'Ab sofort'],['Gültig bis',row.end,'Ohne Enddatum']]) {const line=el('p',undefined,'record-meta');line.append(el('span',label),document.createTextNode(' · '),value?raw('span',date(value)):el('span',fallback));parts.body.append(line);}
        if(row._legacy) addLine(parts.body,'Dieser frühere Appwrite-Code gilt noch nicht als Stripe-Rabatt. Speichern Sie ihn, um ihn mit Stripe zu verbinden.','record-meta');
        const importIssue=legacyImportIssue(row);
        if(importIssue) addLine(parts.body,importIssue,'scope-warning');
        const edit=el('button',row._legacy?'Mit Stripe verbinden':'Bearbeiten','outline-button');edit.type='button';edit.disabled=!stripeConnected;edit.addEventListener('click',()=>openEditor(row));parts.actions.append(edit);
        if(row._stripe) {
          const toggle=el('button',row.active===true?'Bei Stripe deaktivieren':'Bei Stripe aktivieren','outline-button stripe-toggle');toggle.type='button';toggle.disabled=!stripeConnected;toggle.addEventListener('click',()=>toggleCode(row,toggle));parts.actions.append(toggle);
        }
      } else {
        parts = recordBase(row.number || row.$id,row); parts.actions.append(row.status==='paid'?el('span',statusNames.paid,'badge order-paid'):raw('span',row.status || '—','badge'),el('strong',money(row.total)));
        addRawLine(parts.body,[row.customer,row.email].filter(Boolean).join(' · ')); addLine(parts.body,`Bestelldatum: ${date(row.date || row.$createdAt)}`);
        const details = el('details',undefined,'order-items'); details.append(el('summary','Bestellte Artikel ansehen'));
        const items = parseArray(row.items);
        if(items) {const list = el('ul'); items.forEach(item => {const line = el('li'); if(item && typeof item === 'object') {const description = [item.name || item.productName || item.productId || item.id,item.color,item.size].filter(Boolean).join(' · '); if(description) line.append(raw('span',description),document.createTextNode(' · ')); line.append(el('span',`${text(item.quantity ?? item.qty ?? 1)} Stück`));} else line.append(raw('span',text(item) || JSON.stringify(item))); list.append(line);}); details.append(list);}
        else details.append(el('pre',row.items || 'Keine Artikeldetails hinterlegt.'));
        parts.card.append(details,orderDeliveryDetails(items));
      }
      list.append(parts.card);
    }); container.append(list);
  }
  async function saveStripeCode(payload) {
    const result=await stripeAdmin('/api/admin/codes',payload);
    if(result.synchronized!==true || !result.code?.id || typeof result.code.active!=='boolean') {const error=new Error('Stripe konnte nicht bestätigt werden. Bitte laden Sie die Rabattcodes neu, bevor Sie Änderungen vornehmen.');error.stripeAdmin=true;throw error;}
    return result.code;
  }
  async function toggleCode(row,button) {
    if(!authenticated || saving || !stripeConnected) return;
    const version=loadVersion;saving=true;button.disabled=true;button.setAttribute('aria-busy','true');$$('.record-actions button,#refresh-records,#new-record').forEach(control=>{control.disabled=true;});
    message('#records-status','Änderung wird direkt bei Stripe gespeichert…');
    try {await saveStripeCode(codePayload(row,row.active!==true));if(version===loadVersion && authenticated && await loadRecords()) message('#records-status','Bei Stripe gespeichert und bestätigt.','success');}
    catch(error) {if(version===loadVersion) {stripeConnected=false;row._unconfirmed=true;renderRecords();message('#records-status',errorMessage(error),'error');message('#stripe-code-status','Stripe konnte nicht bestätigt werden. Bitte laden Sie die Rabattcodes neu, bevor Sie Änderungen vornehmen.','error');}}
    finally {saving=false;button.removeAttribute('aria-busy');if(version===loadVersion) {$$('.record-actions button,#new-record').forEach(control=>{control.disabled=!stripeConnected;});$('#refresh-records').disabled=false;}}
  }
  function parseArray(value) {if(Array.isArray(value)) return value; try {const result = JSON.parse(value || '[]'); return Array.isArray(result) ? result : null;} catch {return null;}}
  function scopeDisplay(value) {const values = parseArray(value); return values?.length ? values.map(value=>typeof value==='string'?value:JSON.stringify(value)).join(', ') : 'Alle';}
  function scopeNode(value) {return parseArray(value)?.length ? raw('span',scopeDisplay(value)) : el('span','Alle');}
  function field(name, labelText, value, options = {}) {
    const label = el('label', labelText, options.wide ? 'wide' : ''), input = document.createElement(options.textarea ? 'textarea' : options.select ? 'select' : 'input');
    input.name = name;
    if(options.select) options.select.forEach(option => {const node = el('option',option.label); node.value = option.value; input.append(node);});
    else if(!options.textarea) input.type = options.type || 'text';
    if(options.type === 'checkbox') {input.checked = !!value; label.classList.add('checkbox-field');}
    else input.value = text(value);
    for(const key of ['required','readOnly','maxLength','min','max','step']) if(options[key] !== undefined) input[key] = options[key];
    label.append(input);
    if(options.hint) label.append(el('span',options.hint,'field-hint'));
    $('#edit-fields').append(label); return input;
  }
  function openEditor(row = null) {
    if(!authenticated || !['products','codes'].includes(activeTab)) return;
    if(activeTab==='codes' && !stripeConnected) return;
    editor = {tab:activeTab,row,createId:crypto.randomUUID()}; $('#edit-fields').replaceChildren(); message('#edit-status','');
    $('#save-record').disabled=false;$('#save-record').textContent=activeTab==='codes'?'Bei Stripe speichern':'Änderungen speichern';
    $('#edit-title').textContent = `${activeTab === 'products' ? 'Produkt' : 'Code'} ${row ? 'bearbeiten' : 'anlegen'}`;
    const data = row || {};
    if(activeTab === 'products') {
      const ids = [{value:'p1',label:'p1 · Half-Zip'},{value:'p2',label:'p2 · Damenhose'},{value:'p3',label:'p3 · Body'},{value:'p4',label:'p4 · Herrenhose'}];
      if(row) field('id','Appwrite-Produkt-ID',row.$id,{readOnly:true});
      else {const available = ids.filter(id => !rows.some(item=>item.$id === id.value)); if(!available.length) return; field('id','Produkt',available[0].value,{select:available,required:true});}
      field('name','Produktname',data.name || '',{required:true,maxLength:255}); field('category','Kategorie',data.category || '',{required:true,maxLength:64});
      field('sku','SKU',data.sku || '',{maxLength:128}); field('price','Preis im Datenbestand (€ netto)',data.price ?? 0,{type:'number',required:true,min:0,step:'0.01'});
      field('salePrice','Aktionspreis (€ netto) · 0 = keiner',data.salePrice ?? 0,{type:'number',min:0,step:'0.01'}); field('stock','Bestand',data.stock ?? 0,{type:'number',required:true,min:0,step:1});
      field('badge','Label',data.badge || '',{maxLength:64}); field('active','Produkt aktiv',data.active ?? true,{type:'checkbox'});
      field('description','Beschreibung',data.description || '',{textarea:true,wide:true,maxLength:4096});
      field('sizes','Größen (JSON-Liste)',data.sizes || '["S","M","L"]',{textarea:true,required:true,maxLength:2048,hint:'Beispiel: ["S","M","L"]'});
      field('colors','Farben (JSON-Liste)',data.colors || '["Beige","Navyblau","Bordeaux"]',{textarea:true,required:true,maxLength:2048,hint:'Bestehende Daten werden beim Öffnen unverändert übernommen.'});
      field('images','Bildpfade (JSON-Liste)',data.images || '[]',{textarea:true,wide:true,required:true,maxLength:4096,hint:'Die Studiofotos der Website werden über den lokalen Katalog zugeordnet. Bestehende Bildpfade nur bei Bedarf ändern.'});
    } else {
      const code=field('code','Code',data.code || '',{required:true,readOnly:data._stripe===true,maxLength:64,hint:data._stripe?'Den Codenamen ändern Sie durch Anlegen eines neuen Codes.':'Nur Buchstaben, Ziffern und Bindestriche, ohne Leerzeichen.'});code.pattern='[A-Za-z0-9-]{1,64}';code.autocapitalize='characters';code.spellcheck=false;
      field('percent','Rabatt (%)',data.percent ?? 10,{type:'number',required:true,min:1,max:100,step:1});
      field('active','Code bei Stripe aktiv',data.active ?? true,{type:'checkbox',hint:'Aktivierte Codes gelten sofort. Künftiger Start: zunächst inaktiv speichern.'});field('minOrder','Mindestbestellwert (€)',data.minOrder ?? 0,{type:'number',required:true,min:0,step:'0.01'});
      field('start','Gültig ab',data.start || '',{maxLength:32,hint:'Gültigkeit als Datum mit Zeitzone, z. B. 2027-01-02T00:00:00+01:00'});field('end','Gültig bis',data.end || '',{maxLength:32,hint:'Leer = ohne Enddatum'});
      field('maxUses','Maximale Nutzungen · 0 = unbegrenzt',data.maxUses ?? 0,{type:'number',required:true,min:0,step:1});field('uses',data._legacy?'Bisherige Nutzungen in Appwrite':'Von Stripe bestätigte Einlösungen',data.uses ?? 0,{readOnly:true,hint:data._legacy?undefined:'Stripe zählt die Einlösungen automatisch.'});
      const notice=el('p',data._legacy?'Dieser frühere Appwrite-Code gilt noch nicht als Stripe-Rabatt. Speichern Sie ihn, um ihn mit Stripe zu verbinden.':'Gilt für alle Produkte. Frühere Codes mit Produkt- oder Kategoriebedingungen können hier nicht importiert werden.','field-hint wide');$('#edit-fields').append(notice);
      const importIssue=legacyImportIssue(data);
      if(importIssue) {
        if(codeScopeUnsupported(data)) {field('products','Produkt-IDs (JSON-Liste)',data.products || '[]',{textarea:true,readOnly:true,maxLength:4096});field('categories','Kategorien (JSON-Liste)',data.categories || '[]',{textarea:true,readOnly:true,maxLength:1024});}
        $('#edit-fields').append(el('p',importIssue,'scope-warning'));$('#save-record').disabled=true;
      }
    }
    $('#edit-dialog').showModal(); $('#edit-fields input, #edit-fields select')?.focus();
  }
  $('#new-record').addEventListener('click',()=>openEditor());
  function closeEditor() {if(saving) return; $('#edit-dialog').close(); editor = null;}
  $('#close-editor').addEventListener('click',closeEditor); $('#cancel-editor').addEventListener('click',closeEditor);
  $('#edit-dialog').addEventListener('cancel',event=>{if(saving) event.preventDefault(); else editor = null;});
  function validArray(value, name) {const result = parseArray(value); if(!result) throw new Error(`${name}: Bitte eine gültige JSON-Liste eingeben.`); return JSON.stringify(result);}
  $('#edit-form').addEventListener('submit',async event=>{
    event.preventDefault(); if(!authenticated || !editor || saving) return;
    const form = event.currentTarget, input = name => form.elements[name].value.trim(), numeric = name => Number(input(name));
    let data;
    try {
      if(editor.tab === 'products') {
        data = {name:input('name'),category:input('category'),sku:input('sku'),price:numeric('price'),salePrice:numeric('salePrice'),stock:numeric('stock'),badge:input('badge'),active:form.elements.active.checked,description:input('description'),sizes:validArray(input('sizes'),'Größen'),colors:validArray(input('colors'),'Farben'),images:validArray(input('images'),'Bildpfade')};
        if(!data.name || !data.category) throw new Error('Bitte Produktname und Kategorie ausfüllen.');
        if(!Number.isInteger(data.stock) || data.stock < 0 || !Number.isFinite(data.price) || data.price < 0 || !Number.isFinite(data.salePrice) || data.salePrice < 0) throw new Error('Bitte gültige Preise und einen ganzzahligen Bestand eingeben.');
      } else {
        const importIssue=legacyImportIssue(editor.row);if(importIssue) throw new Error(importIssue);
        data = {id:editor.row?._stripe?editor.row.id:undefined,code:input('code').toUpperCase(),percent:numeric('percent'),active:form.elements.active.checked,start:input('start'),end:input('end'),maxUses:numeric('maxUses'),minOrder:numeric('minOrder')};
        if(!/^[A-Z0-9-]{1,64}$/.test(data.code)) throw new Error('Bitte einen Code mit 1 bis 64 Buchstaben, Ziffern oder Bindestrichen eingeben.');
        if(!Number.isInteger(data.percent) || data.percent < 1 || data.percent > 100 || !Number.isInteger(data.maxUses) || data.maxUses < 0 || !Number.isFinite(data.minOrder) || data.minOrder < 0) throw new Error('Bitte einen ganzzahligen Rabatt von 1 bis 100 % und gültige Nutzungswerte eingeben.');
        for(const key of ['start','end']) if(data[key] && Number.isNaN(Date.parse(data[key]))) throw new Error('Bitte Gültigkeitsdaten im ISO-Format eingeben.');
        if(data.start && data.end && Date.parse(data.end) <= Date.parse(data.start)) throw new Error('Das Enddatum muss nach dem Startdatum liegen.');
        if(data.active && data.start && Date.parse(data.start)>Date.now()) throw new Error('Aktivierte Codes gelten sofort. Künftiger Start: zunächst inaktiv speichern.');
      }
    } catch(error) {message('#edit-status',error.message,'error'); return;}
    const selected = editor, table = views[selected.tab].table, newRowId = selected.tab === 'products' ? input('id') : selected.createId;
    saving = true; $('#save-record').disabled = true; $('#close-editor').disabled = true; $('#cancel-editor').disabled = true;
    $$('#edit-fields input, #edit-fields select, #edit-fields textarea').forEach(control=>{control.disabled = true;});
    message('#edit-status',selected.tab==='codes'?'Änderung wird direkt bei Stripe gespeichert…':'Änderungen werden in Appwrite gespeichert…');
    try {
      if(selected.tab==='codes') await saveStripeCode(data);
      else if(selected.row) await api.update(table,selected.row.$id,data);
      else await api.create(table,data,newRowId);
      $('#edit-dialog').close(); editor = null;
      if(await loadRecords()) message('#records-status',selected.tab==='codes'?'Bei Stripe gespeichert und bestätigt.':'In Appwrite gespeichert.','success');
    } catch(error) {message('#edit-status',errorMessage(error),'error');}
    finally {saving = false; $('#save-record').disabled = false; $('#close-editor').disabled = false; $('#cancel-editor').disabled = false; $$('#edit-fields input, #edit-fields select, #edit-fields textarea').forEach(control=>{control.disabled = false;});}
  });
  if(!api) setLoginView('Die Appwrite-Verbindung konnte nicht geladen werden. Bitte laden Sie die Seite erneut.','error');
  else establishSession();
})();
