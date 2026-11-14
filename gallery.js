'use strict';
// One catalogue owns the allowed variants and current photographs on every page.
// Replaced trouser photographs and removed colours are never used as fallbacks.
window.CR_PRODUCT_GALLERIES=Object.freeze(Object.fromEntries(window.CR_PRODUCTS.map(product=>[
 product.id,Object.freeze(Object.fromEntries(window.CR_COLORS.map(color=>{
  const variant=product.variants[color.id],sources=variant.photoSources;
  const alt=product.name+' in '+color.name+' – Studioansicht',pending=product.name+' in '+color.name+' – Studiofoto folgt';
  const placeholder=window.CRPhotos.placeholder;
  return [color.id,Object.freeze([Object.freeze({src:sources[0],alt:sources[0]===placeholder?pending:alt,label:sources[0]===placeholder?'Studiofoto folgt':'Studioansicht',
   fallbackSrc:sources[1]||placeholder,fallbackAlt:sources[1]===placeholder?pending:alt,fallbackLabel:sources[1]===placeholder?'Studiofoto folgt':'Studioansicht',
   placeholderSrc:placeholder,placeholderAlt:pending,placeholderLabel:'Studiofoto folgt'
  })])];
 })))
])));
