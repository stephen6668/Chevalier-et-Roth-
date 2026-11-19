'use strict';
// Public storefront settings only. Live credentials belong in hosting secrets.
// The browser's preview never establishes payment or tax-registration readiness.
window.CR_COMMERCE_CONFIG = Object.freeze({
 desiredMode:'live',
 backendOrigin:null,
 taxRegistered:false,
 illustrativeTaxRate:17,
 shipping:Object.freeze({carrier:'POST Luxembourg',destinationScope:'Europe',confirmed:true,shippingPerPackage:700,itemsPerPackage:3}),
 // Retained for isolated tests. The storefront now opens the Stripe flow;
 // only the server's complete readiness check can enable real payment.
 demoCheckout:Object.freeze({
  enabled:false,
  currency:'eur',
  shippingPerPackage:700,
  itemsPerPackage:3,
  shippingCountries:Object.freeze(['LU','DE','FR','BE','NL','AT']),
  serviceEmail:'service@chevalier-et-roth.example',
  productPrices:Object.freeze({'trousers-men':10000})
 })
});
