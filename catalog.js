'use strict';
window.CR_COLORS = Object.freeze([
 Object.freeze({id:'bordeaux',name:'Bordeaux',swatch:'#651c30',aliases:'bordeaux bordo rot'}),
 Object.freeze({id:'black',name:'Schwarz',swatch:'#1d1e20',aliases:'schwarz black'}),
 Object.freeze({id:'gray',name:'Grau',swatch:'#858588',aliases:'grau gray grey'}),
 Object.freeze({id:'beige',name:'Beige',swatch:'#d2be9e',aliases:'beige sand'}),
 Object.freeze({id:'navy',name:'Navyblau',swatch:'#182b45',aliases:'navy navyblau blau blue'})
]);
window.CR_PRODUCTS = Object.freeze([
 {id:'body',name:'Le Body',type:'Body à col V',category:'Body',description:'Ein tiefer V-Ausschnitt, lange Ärmel und eine körpernahe Silhouette. Fünf Farbwelten treffen auf goldene Akzente.'},
 {id:'halfzip',name:'Le Half-Zip',type:'Half-Zip Signature',category:'Half-Zip',description:'Ein markanter Stehkragen, ein goldener Reißverschluss und eine ruhige Silhouette. Der Half-Zip in fünf Farbwelten.'},
 {id:'trousers',name:'Le Pantalon',type:'Pantalon à jambe large',category:'Hose',description:'Weite Beine, ein fließender Fall und goldene Kordelenden. Eine klare Silhouette in fünf Farbwelten.'}
].map(product=>Object.freeze({...product,color:'Bordeaux',image:`assets/products/${product.id}-bordeaux.webp`,model:`assets/models/${product.id}-bordeaux-studio.glb`,variants:Object.freeze(Object.fromEntries(window.CR_COLORS.map(color=>[color.id,Object.freeze({...color,image:`assets/products/${product.id}-${color.id}.webp`,model:`assets/models/${product.id}-${color.id}-studio.glb`})])))})));
