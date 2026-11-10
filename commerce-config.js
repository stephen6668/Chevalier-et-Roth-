'use strict';
// Public storefront settings only. Live credentials belong in hosting secrets.
// The browser's preview never establishes payment or tax-registration readiness.
window.CR_COMMERCE_CONFIG = Object.freeze({
 desiredMode:'live',
 backendOrigin:null,
 taxRegistered:false,
 illustrativeTaxRate:17,
 shipping:Object.freeze({carrier:'POST Luxembourg',destinationScope:'Europe',confirmed:false,amount:null})
});
