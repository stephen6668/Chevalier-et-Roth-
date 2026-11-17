'use strict';
// Product details and size values supplied by the owner.
// Size tables were transcribed from the four Numbers files supplied on 17 November 2026.
// composition: [{percentage: 100, fiber: {de: '…', en: '…', fr: '…'}}]
// care: [{de: '…', en: '…', fr: '…'}]
// measurements: {columns: [{key: 'length', label: {de: '…', en: '…', fr: '…'}}],
//   rows: [{size: 'S', values: {length: 0}}], note: {de: '…', en: '…', fr: '…'}}
// The example schema above is not product data; no example values are rendered.
(() => {
 const sizes=window.CR_SIZES||Object.freeze(['S','M','L']);
 const label=(de,en,fr)=>Object.freeze({de,en,fr});
 const feature=(name,value)=>Object.freeze({label:name,value});
 const chart=entries=>Object.freeze({
  columns:Object.freeze(entries.map(([key,name])=>Object.freeze({key,label:name}))),
  rows:Object.freeze(['S','M','L'].map((size,index)=>Object.freeze({size,values:Object.freeze(Object.fromEntries(entries.map(([key,,values])=>[key,values[index]])))})))
 });
 // The owner confirmed on 17 November 2026 that all supplied measurements are in cm.
 const common={sizes,measurementUnit:'cm',composition:null,care:Object.freeze([]),measurements:null};
 window.CR_PRODUCT_SPECS=Object.freeze({
  body:Object.freeze({...common,measurements:chart([
   ['chest',label('Brustumfang','Chest circumference','Tour de poitrine'),[82,90,98]],
   ['waist',label('Taillenumfang','Waist circumference','Tour de taille'),[64,72,80]],
   ['hips',label('Hüftumfang','Hip circumference','Tour de hanches'),[86,94,102]],
   ['sleeve',label('Ärmellänge','Sleeve length','Longueur des manches'),[59,60,61]],
   ['torso',label('Rumpfumfang','Torso girth','Tour du tronc'),[143,148,153]]
  ]),composition:Object.freeze([{percentage:100,fiber:label('Baumwoll-Jersey','cotton jersey','jersey de coton')}]),features:Object.freeze([
   feature(label('Silhouette','Silhouette','Silhouette'),label('Körpernahe Linie','Close-fitting line','Ligne près du corps')),
   feature(label('Ausschnitt','Neckline','Encolure'),label('Tiefer V-Ausschnitt','Deep V-neck','Décolleté en V profond')),
   feature(label('Ärmel','Sleeves','Manches'),label('Langarm','Long sleeves','Manches longues')),
   feature(label('Akzent','Detail','Détail'),label('Goldfarbenes CR-Monogramm','Gold-coloured CR monogram','Monogramme CR doré'))
  ])}),
  halfzip:Object.freeze({...common,measurements:chart([
   ['chest',label('Brustumfang','Chest circumference','Tour de poitrine'),[86,94,102]],
   ['waist',label('Taillenweite','Waist measurement','Mesure à la taille'),[72,80,88]],
   ['hem',label('Saumumfang','Hem circumference','Tour de l’ourlet'),[90,98,106]],
   ['length',label('Gesamtlänge','Total length','Longueur totale'),[58,60,62]],
   ['sleeve',label('Ärmellänge','Sleeve length','Longueur des manches'),[59,60,61]]
  ]),composition:Object.freeze([{percentage:100,fiber:label('Merinowolle','merino wool','laine mérinos')}]),features:Object.freeze([
   feature(label('Kragen','Collar','Col'),label('Stehkragen','Stand collar','Col montant')),
   feature(label('Verschluss','Fastening','Fermeture'),label('Kurzer Reißverschluss','Short zip','Fermeture zippée courte')),
   feature(label('Ärmel','Sleeves','Manches'),label('Langarm','Long sleeves','Manches longues')),
   feature(label('Akzente','Details','Détails'),label('Goldfarbene Details und CR-Monogramm','Gold-coloured details and CR monogram','Détails dorés et monogramme CR'))
  ])}),
  trousers:Object.freeze({...common,measurements:chart([
   ['waistband',label('Bundumfang','Waistband circumference','Tour de ceinture'),[70,78,86]],
   ['hips',label('Hüftumfang','Hip circumference','Tour de hanches'),[104,112,120]],
   ['thigh',label('Oberschenkelumfang','Thigh circumference','Tour de cuisse'),[70,74,78]],
   ['knee',label('Knieumfang','Knee circumference','Tour de genou'),[66,70,74]],
   ['opening',label('Beinöffnung pro Bein','Leg opening per leg','Ouverture par jambe'),[64,68,72]],
   ['inseam',label('Innenbeinlänge','Inseam length','Longueur d’entrejambe'),[78,79,80]],
   ['length',label('Gesamtlänge inkl. Bund','Total length including waistband','Longueur totale, ceinture comprise'),[108,110,112]],
   ['waistbandHeight',label('Bundhöhe','Waistband height','Hauteur de ceinture'),[5,5,5]]
  ]),features:Object.freeze([
   feature(label('Silhouette','Silhouette','Silhouette'),label('Weites Bein','Wide leg','Jambe ample')),
   feature(label('Schnitt','Cut','Coupe'),label('Palazzohose für Damen','Women’s palazzo trousers','Pantalon palazzo pour femme')),
   feature(label('Bund','Waistband','Ceinture'),label('Bundfalten und goldfarbener Knopf','Pleats and gold-coloured button','Plis et bouton doré')),
   feature(label('Akzente','Details','Détails'),label('Goldfarbener Knopf und CR-Monogramm','Gold-coloured button and CR monogram','Bouton doré et monogramme CR'))
  ])}),
  'trousers-men':Object.freeze({...common,measurements:chart([
   ['waistband',label('Bundumfang','Waistband circumference','Tour de ceinture'),[82,90,98]],
   ['hips',label('Hüftumfang','Hip circumference','Tour de hanches'),[104,112,120]],
   ['thigh',label('Oberschenkelumfang','Thigh circumference','Tour de cuisse'),[64,68,72]],
   ['knee',label('Knieumfang','Knee circumference','Tour de genou'),[48,52,56]],
   ['opening',label('Beinöffnung pro Bein','Leg opening per leg','Ouverture par jambe'),[42,44,46]],
   ['inseam',label('Innenbeinlänge','Inseam length','Longueur d’entrejambe'),[78,80,82]],
   ['length',label('Gesamtlänge inkl. Bund','Total length including waistband','Longueur totale, ceinture comprise'),[104,107,110]],
   ['waistbandHeight',label('Bundhöhe','Waistband height','Hauteur de ceinture'),[4,4,4]]
  ]),features:Object.freeze([
   feature(label('Silhouette','Silhouette','Silhouette'),label('Gerades, schmaleres Bein','Straight, narrower leg','Jambe droite et moins ample')),
   feature(label('Schnitt','Cut','Coupe'),label('Herrenhose mit Bundfalten','Men’s pleated trousers','Pantalon à plis pour homme')),
   feature(label('Bund','Waistband','Ceinture'),label('Bundfalten und goldfarbener Knopf','Pleats and gold-coloured button','Plis et bouton doré')),
   feature(label('Akzente','Details','Détails'),label('Goldfarbener Knopf und CR-Monogramm','Gold-coloured button and CR monogram','Bouton doré et monogramme CR'))
  ])})
 });
})();
