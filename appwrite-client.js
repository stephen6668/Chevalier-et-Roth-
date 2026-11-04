'use strict';
window.CRBackend = (() => {
 const config = window.CRSiteConfig;
 const productIds = Object.freeze({halfzip: 'p1', trousers: 'p2', body: 'p3'});
 const allowedTables = new Set([config.waitlistTableId, config.productTableId, config.codeTableId, config.orderTableId, config.giveawayTableId]);
 let services;
 function init() {
  if (services) return services;
  const sdk = window.Appwrite;
  if (!sdk || typeof sdk.TablesDB !== 'function') throw new Error('Die Verbindung konnte nicht gestartet werden. Bitte lade die Seite neu.');
  const client = new sdk.Client().setEndpoint(config.endpoint).setProject(config.projectId);
  services = {account: new sdk.Account(client), tables: new sdk.TablesDB(client), teams: new sdk.Teams(client), sdk};
  return services;
 }
 function timed(promise, label, ms = 15000) {
  let timer;
  const timeout = new Promise((_, reject) => {
   timer = setTimeout(() => {
    const error = new Error(label + ': Zeitüberschreitung.');
    error.type = 'appwrite_timeout';
    reject(error);
   }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
 }
 function tableArgs(tableId) {
  if (!allowedTables.has(tableId)) throw new Error('Unbekannter Datenbereich.');
  return {databaseId: config.databaseId, tableId};
 }
 function text(value, max, label, required = true) {
  const result = String(value ?? '').trim();
  if (required && !result) throw new Error('Bitte ' + label + ' eingeben.');
  if (result.length > max) throw new Error(label + ' darf höchstens ' + max + ' Zeichen enthalten.');
  return result;
 }
 function email(value) {
  const result = text(value, 320, 'eine E-Mail-Adresse').toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw new Error('Bitte eine gültige E-Mail-Adresse eingeben.');
  return result;
 }
 function productId(value) {
  const id = productIds[value] || String(value || '');
  if (!Object.values(productIds).includes(id)) throw new Error('Bitte eines der drei Kollektionsprodukte auswählen.');
  return id;
 }
 async function currentUser() {
  const {account} = init();
  try { return await timed(account.get(), 'Konto laden', 10000); }
  catch (error) {
   if (error.code === 401) return null;
   throw error;
  }
 }
 async function login(loginEmail, password) {
  const {account} = init();
  const safeEmail = email(loginEmail);
  if (!String(password || '')) throw new Error('Bitte dein Passwort eingeben.');
  await timed(account.createEmailPasswordSession({email: safeEmail, password: String(password)}), 'Anmelden');
  const user = await currentUser();
  if (!user) throw new Error('Die Sitzung konnte nicht geladen werden. Bitte erneut anmelden.');
  return user;
 }
 async function logout() {
  const {account} = init();
  try { await timed(account.deleteSession({sessionId: 'current'}), 'Abmelden'); }
  catch (error) { if (error.code !== 401) throw error; }
 }
 async function isAdmin() {
  const user = await currentUser();
  if (!user) return false;
  const {teams, sdk} = init();
  try {
   const result = await timed(teams.listMemberships({
    teamId: config.adminTeamId,
    queries: [sdk.Query.equal('userId', [user.$id]), sdk.Query.limit(100)]
   }), 'Admin-Berechtigung prüfen', 10000);
   return (result.memberships || []).some(member => member.userId === user.$id && member.confirm === true);
  } catch (error) {
   if ([401, 403, 404].includes(error.code)) return false;
   throw error;
  }
 }
 async function list(tableId) {
  const args = tableArgs(tableId);
  const {tables, sdk} = init();
  const all = [];
  let cursor = null;
  const limit = 100, maximum = 10000;
  while (true) {
   const queries = [sdk.Query.limit(limit), sdk.Query.orderAsc('$id')];
   if (cursor) queries.push(sdk.Query.cursorAfter(cursor));
   const result = await timed(tables.listRows({...args, queries}), 'Einträge laden');
   const rows = result.rows || [];
   if (result.total > maximum || all.length + rows.length > maximum) throw new Error('Mehr als 10.000 Einträge vorhanden. Bitte nutze die Appwrite-Konsole für den vollständigen Export.');
   all.push(...rows);
   if (rows.length < limit || (Number.isFinite(result.total) && all.length >= result.total)) return all;
   const nextCursor = rows[rows.length - 1]?.$id;
   if (!nextCursor || nextCursor === cursor) throw new Error('Die Einträge konnten nicht vollständig geladen werden. Bitte erneut versuchen.');
   cursor = nextCursor;
   if (all.length >= maximum) throw new Error('Die Liste überschreitet das Anzeigelimit. Bitte nutze die Appwrite-Konsole für den vollständigen Export.');
  }
 }
 async function create(tableId, data, rowId) {
  const args = tableArgs(tableId), {tables, sdk} = init();
  return timed(tables.createRow({...args, rowId: rowId || sdk.ID.unique(), data, permissions: []}), 'Eintrag speichern');
 }
 async function update(tableId, rowId, data) {
  const args = tableArgs(tableId), {tables} = init();
  return timed(tables.updateRow({...args, rowId, data}), 'Änderungen speichern');
 }
 async function remove(tableId, rowId) {
  const args = tableArgs(tableId), {tables} = init();
  return timed(tables.deleteRow({...args, rowId}), 'Eintrag löschen');
 }
 async function addWaitlist(entry) {
  if (entry.privacyAccepted !== true) throw new Error('Bitte den Datenschutzhinweisen zustimmen.');
  const data = {
   userId: 'guest',
   name: text(entry.name, 255, 'deinen Namen'),
   email: email(entry.email),
   productId: productId(entry.productId),
   productName: text(entry.productName, 255, 'einen Produktnamen'),
   size: text(entry.size, 100, 'eine Größe', false) || 'Not selected',
   color: text(entry.color, 100, 'eine Farbe', false) || 'Not selected',
   status: 'waiting'
  };
  return create(config.waitlistTableId, data);
 }
 async function enterGiveaway(entry) {
  if(window.CRLegalConfig?.giveawayReady !== true) throw new Error('Das Giveaway ist noch nicht zur Teilnahme freigegeben.');
  if (Date.now() >= new Date(config.launchAt).getTime()) throw new Error('Das Gewinnspiel ist bereits beendet.');
  if (entry.socialConfirmed !== true) throw new Error('Bitte bestätige, dass du uns auf TikTok und Instagram folgst.');
  if (entry.privacyAccepted !== true) throw new Error('Bitte den Teilnahme- und Datenschutzhinweisen zustimmen.');
  const data = {
   firstName: text(entry.firstName, 120, 'deinen Vornamen'),
   lastName: text(entry.lastName, 120, 'deinen Nachnamen'),
   email: email(entry.email),
   prizeId: productId(entry.prizeId),
   prizeName: text(entry.prizeName, 255, 'einen Gewinn'),
   status: 'entered',
   source: 'website-giveaway-2027',
   privacyAccepted: true
  };
  return create(config.giveawayTableId, data);
 }
 async function publicProducts() {
  const allowed = new Set(Object.values(productIds));
  return (await list(config.productTableId)).filter(row => allowed.has(row.$id));
 }
 function errorMessage(error) {
  const code = Number(error?.code || error?.status || 0), type = error?.type || '';
  if (type === 'user_invalid_credentials') return 'E-Mail oder Passwort ist falsch.';
  if (type === 'user_session_already_exists') return 'Es besteht bereits eine Sitzung. Bitte zuerst abmelden und dann erneut anmelden.';
  if (type === 'appwrite_timeout') return 'Die Antwort dauert zu lange. Falls du ein Formular gesendet hast, prüfe den Eintrag vor einem erneuten Versuch.';
  if (type === 'general_unknown_origin') return 'Diese Webadresse ist in Appwrite noch nicht als Web-Plattform freigegeben.';
  if (code === 429) return 'Zu viele Versuche. Bitte warte einen Moment und versuche es erneut.';
  if (code === 401 || code === 403) return 'Der Zugriff wurde nicht freigegeben. Bitte prüfe deine Anmeldung und die Appwrite-Berechtigungen.';
  if (code === 404) return 'Der Datenbereich wurde nicht gefunden. Bitte prüfe die Appwrite-Konfiguration.';
  if (code === 409) return 'Dieser Eintrag existiert bereits. Bitte verwende einen anderen Code oder aktualisiere den vorhandenen Eintrag.';
  if (code === 400 && /column|attribute|schema/i.test(error?.message || '')) return 'Die benötigten Datenfelder fehlen in Appwrite oder passen nicht zur Tabelle.';
  if (error instanceof TypeError || /failed to fetch|network|load failed/i.test(error?.message || '')) return 'Die Verbindung konnte nicht hergestellt werden. Bitte prüfe Internet und Appwrite-Webadresse.';
  return error?.message || 'Die Anfrage konnte nicht abgeschlossen werden. Bitte versuche es erneut.';
 }
 return Object.freeze({config, productIds, currentUser, login, logout, isAdmin, list, create, update, remove, addWaitlist, enterGiveaway, publicProducts, errorMessage});
})();
