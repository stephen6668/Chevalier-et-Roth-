'use strict';
// Confirmed visual details only. Add composition, care and measurements here
// after the manufacturer has supplied the actual information.
// composition: [{percentage: 100, fiber: {de: '…', en: '…', fr: '…'}}]
// care: [{de: '…', en: '…', fr: '…'}]
// measurements: {columns: [{key: 'length', label: {de: '…', en: '…', fr: '…'}}],
//   rows: [{size: 'S', values: {length: 0}}], note: {de: '…', en: '…', fr: '…'}}
// The example schema above is not product data; no example values are rendered.
(() => {
 const sizes=window.CR_SIZES||Object.freeze(['S','M','L']);
 const label=(de,en,fr)=>Object.freeze({de,en,fr});
 const feature=(name,value)=>Object.freeze({label:name,value});
 const common={sizes,measurementUnit:'cm',composition:null,care:Object.freeze([]),measurements:null};
 window.CR_PRODUCT_SPECS=Object.freeze({
  body:Object.freeze({...common,composition:Object.freeze([{percentage:100,fiber:label('Baumwoll-Jersey','cotton jersey','jersey de coton')}]),features:Object.freeze([
   feature(label('Silhouette','Silhouette','Silhouette'),label('Körpernahe Linie','Close-fitting line','Ligne près du corps')),
   feature(label('Ausschnitt','Neckline','Encolure'),label('Tiefer V-Ausschnitt','Deep V-neck','Décolleté en V profond')),
   feature(label('Ärmel','Sleeves','Manches'),label('Langarm','Long sleeves','Manches longues')),
   feature(label('Akzent','Detail','Détail'),label('Goldfarbenes CR-Monogramm','Gold-coloured CR monogram','Monogramme CR doré'))
  ])}),
  halfzip:Object.freeze({...common,composition:Object.freeze([{percentage:100,fiber:label('Merinowolle','merino wool','laine mérinos')}]),features:Object.freeze([
   feature(label('Kragen','Collar','Col'),label('Stehkragen','Stand collar','Col montant')),
   feature(label('Verschluss','Fastening','Fermeture'),label('Kurzer Reißverschluss','Short zip','Fermeture zippée courte')),
   feature(label('Ärmel','Sleeves','Manches'),label('Langarm','Long sleeves','Manches longues')),
   feature(label('Akzente','Details','Détails'),label('Goldfarbene Details und CR-Monogramm','Gold-coloured details and CR monogram','Détails dorés et monogramme CR'))
  ])}),
  trousers:Object.freeze({...common,features:Object.freeze([
   feature(label('Silhouette','Silhouette','Silhouette'),label('Weites Bein','Wide leg','Jambe ample')),
   feature(label('Schnitt','Cut','Coupe'),label('Palazzohose für Damen','Women’s palazzo trousers','Pantalon palazzo pour femme')),
   feature(label('Bund','Waistband','Ceinture'),label('Bundfalten und goldfarbener Knopf','Pleats and gold-coloured button','Plis et bouton doré')),
   feature(label('Akzente','Details','Détails'),label('Goldfarbener Knopf und CR-Monogramm','Gold-coloured button and CR monogram','Bouton doré et monogramme CR'))
  ])}),
  'trousers-men':Object.freeze({...common,features:Object.freeze([
   feature(label('Silhouette','Silhouette','Silhouette'),label('Gerades, schmaleres Bein','Straight, narrower leg','Jambe droite et moins ample')),
   feature(label('Schnitt','Cut','Coupe'),label('Herrenhose mit Bundfalten','Men’s pleated trousers','Pantalon à plis pour homme')),
   feature(label('Bund','Waistband','Ceinture'),label('Bundfalten und goldfarbener Knopf','Pleats and gold-coloured button','Plis et bouton doré')),
   feature(label('Akzente','Details','Détails'),label('Goldfarbener Knopf und CR-Monogramm','Gold-coloured button and CR monogram','Bouton doré et monogramme CR'))
  ])})
 });
})();
