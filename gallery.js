'use strict';
// Additional user-supplied studio photographs, matched by their actual colors.
// The freestanding garment views remain accurate for all 15 model variants.
window.CR_PRODUCT_GALLERIES = Object.freeze(Object.fromEntries(window.CR_PRODUCTS.map(product=>[
 product.id,Object.freeze(Object.fromEntries(window.CR_COLORS.map(color=>{
  const studio=(product.id==='body'&&['bordeaux','beige'].includes(color.id))||(product.id==='trousers'&&['bordeaux','black','gray','beige'].includes(color.id));
  const images=[];
  if(studio)images.push(Object.freeze({src:`assets/gallery/${product.id}-${color.id}-studio.webp`,alt:`${product.name} in ${color.name} – Studioansicht`,label:'Studioansicht'}));
  images.push(Object.freeze({src:product.variants[color.id].image,alt:`${product.name} in ${color.name} – freigestellte Produktansicht`,label:'Produktansicht'}));
  return [color.id,Object.freeze(images)];
 })))
])));
