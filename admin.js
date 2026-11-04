'use strict';
(() => {
  const api = window.CRBackend;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const config = api?.config || {};
  const views = {
    waitlist: {table: config.waitlistTableId, caption: 'WARTELISTE', title: 'Vorfreude auf die Kollektion.', description: 'Anmeldungen mit gewähltem Produkt, Farbe und Größe. Der Status wird direkt in Appwrite gespeichert.'},
    products: {table: config.productTableId, caption: 'CR_PRODUCTS', title: 'Die Signature-Kollektion.', description: 'Produktdaten und Bestand aus Appwrite. p1 = Half-Zip · p2 = Hose · p3 = Body. Die 3D-Modelle der Website bleiben erhalten.'},
    codes: {table: config.codeTableId, caption: 'CR_CODES', title: 'Besondere Einladungen.', description: 'Codes und ihre Bedingungen zentral verwalten. Eine Einlösung wird erst im serverseitigen Checkout verbindlich geprüft.'},
    orders: {table: config.orderTableId, caption: 'CR_ORDERS', title: 'Bestellungen im Überblick.', description: 'Bestehende Bestellungen aus Appwrite. Diese Ansicht liest die vom Bestellsystem gespeicherten Daten.'},
    giveaway: {table: config.giveawayTableId, caption: 'FIRST COLLECTION GIVEAWAY', title: 'Ein besonderer Auftakt.', description: 'Teilnahmen am First Collection Giveaway. Statusänderungen werden in cr_giveaway gespeichert.'}
  };
  const waitlistStatuses = ['waiting', 'contacted', 'invited', 'converted', 'cancelled'];
  const giveawayStatuses = ['entered', 'winner', 'contacted', 'invalid'];
  const statusNames = {waiting:'Wartend',contacted:'Kontaktiert',invited:'Eingeladen',converted:'Abgeschlossen',cancelled:'Abgemeldet',entered:'Teilgenommen',winner:'Gewinner',invalid:'Ungültig'};
  let authenticated = false, activeTab = 'waitlist', rows = [], loadVersion = 0, authVersion = 0, editor = null, saving = false;
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
  const message = (selector, value, kind = '') => {const node = $(selector); node.textContent = value; node.className = `status ${kind}`.trim();};
  const errorMessage = error => api?.errorMessage ? api.errorMessage(error) : 'Die Appwrite-Verbindung konnte nicht geladen werden. Bitte laden Sie die Seite erneut.';
  function addLine(container, value, className) {const line = el('p', value, className); container.append(line); return line;}
  function addRawLine(container, value, className) {const line = raw('p', value, className); container.append(line); return line;}
  function setLoginView(note = '', kind = '') {
    authenticated = false; loadVersion++;
    $('#login-view').hidden = false; $('#admin-view').hidden = true; $('#records').replaceChildren(); rows = [];
    if ($('#edit-dialog').open) $('#edit-dialog').close();
    $('#edit-fields').replaceChildren(); $('#admin-identity').textContent = ''; editor = null;
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
    message('#records-status', 'Daten werden aus Appwrite geladen…');
    try {
      const result = await api.list(view.table);
      if (version !== loadVersion || !authenticated || activeTab !== selected) return;
      rows = [...result].sort((a,b) => text(b.$createdAt).localeCompare(text(a.$createdAt)));
      renderRecords(); message('#records-status', `${rows.length} ${rows.length === 1 ? 'Eintrag' : 'Einträge'} · Aktualisiert ${new Date().toLocaleTimeString('de-DE')}`);
      $('#new-record').disabled = selected === 'products' && ['p1','p2','p3'].every(id => rows.some(row => row.$id === id));
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
    if(!rows.length) {container.append(el('div','In diesem Bereich sind noch keine Einträge vorhanden.','empty-state')); return;}
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
        parts = recordBase(row.code || 'Code',row); parts.body.append(el('span',row.active === false ? 'INAKTIV' : 'AKTIV','badge'));
        addLine(parts.body,`${text(row.percent || 0)} % · ${text(row.uses || 0)} / ${Number(row.maxUses) > 0 ? text(row.maxUses) : '∞'} Nutzungen · Mindestwert ${money(row.minOrder)}`);
        addLine(parts.body,`Gültigkeit: ${row.start ? date(row.start) : 'ab sofort'} bis ${row.end ? date(row.end) : 'unbegrenzt'}`,'record-meta');
        const scope = el('p',undefined,'record-meta');
        scope.append(el('span','Produkte:'),document.createTextNode(' '),scopeNode(row.products),document.createTextNode(' · '),el('span','Kategorien:'),document.createTextNode(' '),scopeNode(row.categories)); parts.body.append(scope); editButton(parts.actions,row);
      } else {
        parts = recordBase(row.number || row.$id,row); parts.actions.append(raw('span',row.status || '—','badge'),el('strong',money(row.total)));
        addRawLine(parts.body,[row.customer,row.email].filter(Boolean).join(' · ')); addLine(parts.body,`Bestelldatum: ${date(row.date || row.$createdAt)}`);
        const details = el('details',undefined,'order-items'); details.append(el('summary','Bestellte Artikel ansehen'));
        const items = parseArray(row.items);
        if(items) {const list = el('ul'); items.forEach(item => {const line = el('li'); if(item && typeof item === 'object') {const description = [item.name || item.productName || item.productId || item.id,item.color,item.size].filter(Boolean).join(' · '); if(description) line.append(raw('span',description),document.createTextNode(' · ')); line.append(el('span',`${text(item.quantity ?? item.qty ?? 1)} Stück`));} else line.append(raw('span',text(item) || JSON.stringify(item))); list.append(line);}); details.append(list);}
        else details.append(el('pre',row.items || 'Keine Artikeldetails hinterlegt.'));
        parts.card.append(details);
      }
      list.append(parts.card);
    }); container.append(list);
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
    editor = {tab:activeTab,row,createId:crypto.randomUUID()}; $('#edit-fields').replaceChildren(); message('#edit-status','');
    $('#edit-title').textContent = `${activeTab === 'products' ? 'Produkt' : 'Code'} ${row ? 'bearbeiten' : 'anlegen'}`;
    const data = row || {};
    if(activeTab === 'products') {
      const ids = [{value:'p1',label:'p1 · Half-Zip'},{value:'p2',label:'p2 · Hose'},{value:'p3',label:'p3 · Body'}];
      if(row) field('id','Appwrite-Produkt-ID',row.$id,{readOnly:true});
      else {const available = ids.filter(id => !rows.some(item=>item.$id === id.value)); if(!available.length) return; field('id','Produkt',available[0].value,{select:available,required:true});}
      field('name','Produktname',data.name || '',{required:true,maxLength:255}); field('category','Kategorie',data.category || '',{required:true,maxLength:64});
      field('sku','SKU',data.sku || '',{maxLength:128}); field('price','Preis im Datenbestand (€ netto)',data.price ?? 0,{type:'number',required:true,min:0,step:'0.01'});
      field('salePrice','Aktionspreis (€ netto) · 0 = keiner',data.salePrice ?? 0,{type:'number',min:0,step:'0.01'}); field('stock','Bestand',data.stock ?? 0,{type:'number',required:true,min:0,step:1});
      field('badge','Label',data.badge || '',{maxLength:64}); field('active','Produkt aktiv',data.active ?? true,{type:'checkbox'});
      field('description','Beschreibung',data.description || '',{textarea:true,wide:true,maxLength:4096});
      field('sizes','Größen (JSON-Liste)',data.sizes || '["S","M","L","XL"]',{textarea:true,required:true,maxLength:2048,hint:'Beispiel: ["S","M","L","XL"]'});
      field('colors','Farben (JSON-Liste)',data.colors || '["Bordeaux","Schwarz","Grau","Beige","Navyblau"]',{textarea:true,required:true,maxLength:2048,hint:'Bestehende Daten werden beim Öffnen unverändert übernommen.'});
      field('images','Bildpfade (JSON-Liste)',data.images || '[]',{textarea:true,wide:true,required:true,maxLength:4096,hint:'Die 3D-Modelle der Website werden über den lokalen Katalog zugeordnet. Bestehende Bildpfade nur bei Bedarf ändern.'});
    } else {
      field('code','Code',data.code || '',{required:true,maxLength:64}); field('percent','Rabatt (%)',data.percent ?? 10,{type:'number',required:true,min:0,max:100,step:1});
      field('active','Code aktiv',data.active ?? true,{type:'checkbox'}); field('minOrder','Mindestbestellwert (€)',data.minOrder ?? 0,{type:'number',required:true,min:0,step:'0.01'});
      field('start','Gültig ab',data.start || '',{maxLength:32,hint:'Optional, z. B. 2027-01-02T00:00:00+01:00'}); field('end','Gültig bis',data.end || '',{maxLength:32,hint:'Leer = ohne Enddatum'});
      field('maxUses','Maximale Nutzungen · 0 = unbegrenzt',data.maxUses ?? 0,{type:'number',required:true,min:0,step:1}); field('uses','Bisherige Nutzungen',data.uses ?? 0,{type:'number',required:true,min:0,step:1});
      field('products','Produkt-IDs (JSON-Liste)',data.products || '[]',{textarea:true,required:true,maxLength:4096,hint:'[] = alle Produkte. Beispiel: ["p1","p2"]'});
      field('categories','Kategorien (JSON-Liste)',data.categories || '[]',{textarea:true,required:true,maxLength:1024,hint:'[] = alle Kategorien'});
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
        data = {code:input('code').toUpperCase(),percent:numeric('percent'),active:form.elements.active.checked,start:input('start'),end:input('end'),maxUses:numeric('maxUses'),uses:numeric('uses'),minOrder:numeric('minOrder'),products:validArray(input('products'),'Produkt-IDs'),categories:validArray(input('categories'),'Kategorien')};
        if(!data.code) throw new Error('Bitte einen Code eingeben.');
        if(!Number.isInteger(data.percent) || data.percent < 0 || data.percent > 100 || !Number.isInteger(data.maxUses) || data.maxUses < 0 || !Number.isInteger(data.uses) || data.uses < 0 || !Number.isFinite(data.minOrder) || data.minOrder < 0) throw new Error('Bitte gültige Rabatt- und Nutzungswerte eingeben.');
        for(const key of ['start','end']) if(data[key] && Number.isNaN(Date.parse(data[key]))) throw new Error('Bitte Gültigkeitsdaten im ISO-Format eingeben.');
        if(data.start && data.end && Date.parse(data.end) <= Date.parse(data.start)) throw new Error('Das Enddatum muss nach dem Startdatum liegen.');
      }
    } catch(error) {message('#edit-status',error.message,'error'); return;}
    const selected = editor, table = views[selected.tab].table, newRowId = selected.tab === 'products' ? input('id') : selected.createId;
    saving = true; $('#save-record').disabled = true; $('#close-editor').disabled = true; $('#cancel-editor').disabled = true;
    $$('#edit-fields input, #edit-fields select, #edit-fields textarea').forEach(control=>{control.disabled = true;});
    message('#edit-status','Änderungen werden in Appwrite gespeichert…');
    try {
      if(selected.row) await api.update(table,selected.row.$id,data);
      else await api.create(table,data,newRowId);
      $('#edit-dialog').close(); editor = null;
      if(await loadRecords()) message('#records-status','In Appwrite gespeichert.','success');
    } catch(error) {message('#edit-status',errorMessage(error),'error');}
    finally {saving = false; $('#save-record').disabled = false; $('#close-editor').disabled = false; $('#cancel-editor').disabled = false; $$('#edit-fields input, #edit-fields select, #edit-fields textarea').forEach(control=>{control.disabled = false;});}
  });
  if(!api) setLoginView('Die Appwrite-Verbindung konnte nicht geladen werden. Bitte laden Sie die Seite erneut.','error');
  else establishSession();
})();
