'use strict';
// Public operator details supplied by the owner. Empty fields are intentionally
// incomplete; do not replace them with invented addresses or contact details.
window.CRLegalConfig = (() => {
 const details = {
  operatorName: 'Chevalier & Roth SARL-S',
  legalForm: 'SARL-S',
  country: 'Luxemburg',
  contactPerson: 'Stephen Baxken',
  phone: '+352621484034',
  phoneDisplay: '+352 621 484 034',
  address: '',
  postalCode: '',
  city: '',
  email: '',
  managingDirector: '',
  registerName: 'RCS Luxembourg',
  registerNumber: '',
  vatId: '',
  businessPermit: '',
  shareCapital: '',
  returnAddress: '',
  isPreview: true,
  publicReleaseReady: false,
  giveawayReady: false,
  updatedAt: '2026-11-03'
 };
 const controllerComplete = [details.operatorName, details.country, details.address, details.postalCode, details.city, details.email].every(value => String(value).trim());
 const imprintComplete = controllerComplete && [details.managingDirector, details.registerNumber].every(value => String(value).trim());
 return Object.freeze({...details, controllerComplete, imprintComplete});
})();
