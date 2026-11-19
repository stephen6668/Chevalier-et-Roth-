'use strict';
// Public storefront settings only. Live credentials belong in hosting secrets.
// The browser's preview never establishes payment or tax-registration readiness.
window.CR_COMMERCE_CONFIG = Object.freeze({
 desiredMode:'live',
 backendOrigin:null,
 taxRegistered:false,
 illustrativeTaxRate:17,
 shipping:Object.freeze({carrier:'POST Luxembourg',destinationScope:'Europe',confirmed:false,amount:null}),
 // Owner requested placeholder shipping/contact details for a complete demo.
 // These values never authorize a Stripe payment or a real shipment.
 demoCheckout:Object.freeze({
  enabled:true,
  currency:'eur',
  shippingAmount:490,
  shippingCountries:Object.freeze(['LU','DE','FR','BE','NL','AT']),
  serviceEmail:'service@chevalier-et-roth.example',
  productPrices:Object.freeze({'trousers-men':10000})
 })
});
