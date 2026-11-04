'use strict';
// Fixed names for the original studio PNGs in the connected GitHub repository.
// New uploads appear at these same URLs; a missing photograph uses its own
// colour-matched model preview until that PNG has been uploaded.
const crStudioPrefixes=Object.freeze({body:'body',halfzip:'halfzip',trousers:'hose'});
window.CR_PRODUCT_GALLERIES = Object.freeze(Object.fromEntries(window.CR_PRODUCTS.map(product=>[
 product.id,Object.freeze(Object.fromEntries(window.CR_COLORS.map(color=>{
  const sourceFile=`${crStudioPrefixes[product.id]}_${color.id==='bordeaux'?'mannequin':color.id}_studio.png`;
  return [color.id,Object.freeze([Object.freeze({
   src:`assets/gallery/${sourceFile}`,sourceFile,
   alt:`${product.name} in ${color.name} – Studioansicht`,label:'Studioansicht',
   fallbackSrc:product.variants[color.id].image,
   fallbackAlt:`${product.name} in ${color.name} – 3D-Vorschau`,fallbackLabel:'3D-Vorschau'
  })])];
 })))
])));
