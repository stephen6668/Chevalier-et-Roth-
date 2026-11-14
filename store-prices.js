'use strict';
// Approved final EUR product prices. This public catalogue supports an offline
// price preview; only a ready server can authorize an actual checkout amount.
// The new men's trousers have no approved amount and intentionally remain absent.
window.CR_STORE_PRICES = Object.freeze({currency:'eur',products:Object.freeze({
 halfzip:Object.freeze({amount:11000,available:true}),
 body:Object.freeze({amount:9000,available:true}),
 trousers:Object.freeze({amount:10000,available:true})
}),shippingAmount:null});
