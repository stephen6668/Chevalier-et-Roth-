'use strict';
(() => {
 const selectionStorage=window.CRPrivacy.selectionStorage;
 const get=id=>document.getElementById(id),products=window.CR_PRODUCTS||[],byId=Object.fromEntries(products.map(product=>[product.id,product]));
 const config=window.CR_COMMERCE_CONFIG||{},approved=window.CR_STORE_PRICES||{},query=new URLSearchParams(location.search);
 const validSizes=window.CR_SIZES||['S','M','L'],returnStatus=query.get('status'),sessionId=query.get('session_id');
 const direct=query.has('product'),returning=returnStatus==='cancelled'||returnStatus==='success',resultOnly=returnStatus==='success',snapshotKey='cr-checkout-selection-v1';
 let items=[],catalog=null,busy=false,verifiedPaid=false,attemptId='',attemptSignature='',loadVersion=0;
 let discount=null,discountBusy=false,discountVersion=0,discountNote='',discountError='',discountState='';
 let demoReceipt=null,clearedPaidCart=false;
 const demoMode=()=>config.demoCheckout?.enabled===true&&!resultOnly;
 const words={
   "de": {
     "title": "Checkout — Chevalier & Roth",
     "selection": "IHRE BESTELLUNG",
     "previewTitle": "Ihre Bestellung.",
     "previewText": "Prüfen Sie Farbe, Größe und Menge. Ihre Lieferadresse und Zahlungsart wählen Sie im nächsten Schritt bei Stripe.",
     "item": "Stück",
     "items": "Stücke",
     "remove": "Entfernen",
     "decrease": "verringern",
     "increase": "erhöhen",
     "unavailable": "Für diese Auswahl noch nicht verfügbar.",
     "productValue": "Warenwert",
     "shipping": "Lieferkosten",
     "shippingPending": "Wird noch berechnet",
     "total": "Gesamtbetrag",
     "plusShipping": "zzgl. Versand",
     "shippingNote": "Die Lieferkosten werden vor der Zahlung bestätigt.",
     "pay": "Weiter zur sicheren Zahlung",
     "prepared": "Zahlung wird vorbereitet. Ihre Auswahl bleibt erhalten.",
     "checking": "Zahlungsverbindung wird geprüft …",
     "ready": "Gesamtpreis und Versand sind bestätigt. Sie können sicher mit Stripe bezahlen.",
     "selectFirst": "Wählen Sie zuerst ein Stück aus der Kollektion.",
     "invalidSelection": "Diese Produktvariante ist nicht verfügbar. Wählen Sie ein Stück aus der Kollektion.",
     "opening": "Der sichere Stripe-Checkout wird geöffnet …",
     "retry": "Verbindung erneut prüfen",
     "secureNote": "Sichere Zahlung mit Stripe. Ihre Zahlungsdaten werden direkt dort eingegeben.",
     "privacyCopy": "Ihre Auswahl bleibt während dieses Besuchs erhalten. Liefer- und Zahlungsdaten geben Sie direkt bei Stripe ein. Für die Bestellabwicklung werden die erforderlichen Daten sicher an Chevalier & Roth übermittelt.",
     "privacyPreview": "Eine Bestellung wird erst im abschließenden Zahlungsschritt verbindlich bestätigt.",
     "apiUnavailable": "Die Zahlung ist unter dieser Webadresse noch nicht verfügbar.",
     "connectionUnavailable": "Die Zahlungsverbindung ist gerade nicht verfügbar. Ihre Auswahl bleibt erhalten.",
     "timeout": "Die Antwort dauert zu lange. Prüfen Sie die Verbindung vor einem erneuten Versuch.",
     "invalidCheckout": "Stripe hat noch keinen gültigen Live-Checkout bestätigt.",
     "live": "STRIPE · LIVE",
     "verifyTitle": "Bestätigung wird geprüft.",
     "verifyMessage": "Wir fragen den Zahlungsstatus direkt bei Stripe ab.",
     "notConfirmed": "Zahlung nicht bestätigt.",
     "invalidReturn": "Der Rückkehrlink enthält keine gültige Live-Zahlungs-ID.",
     "verificationFailed": "Die Zahlung konnte nicht eindeutig bestätigt werden.",
     "confirmed": "Zahlung bestätigt.",
     "confirmedMessage": "wurden von Stripe als bezahlt bestätigt.",
     "completed": "Diese Zahlung ist abgeschlossen.",
     "pendingTitle": "Zahlung noch nicht bestätigt.",
     "pendingMessage": "Stripe meldet diese Zahlung noch nicht als abgeschlossen. Sie können den Status erneut prüfen.",
     "confirmationUnavailable": "Bestätigung nicht verfügbar.",
     "cancelledTitle": "Ihre Auswahl bleibt erhalten.",
     "cancelledMessage": "Der Checkout wurde verlassen. Sie können Ihre Auswahl weiter bearbeiten.",
     "verifyAgain": "Zahlungsstatus erneut prüfen",
     "previewNoteTitle": "Bis ins Detail.",
     "heading": "Eine gute Wahl.",
     "headingCopy": "Ihre Lieblingsstücke. Mit Sorgfalt ausgewählt.",
     "guestCheckout": "Gastbestellung · Kein Kundenkonto erforderlich",
     "secureCheckout": "Sicherer Checkout",
     "backToCollection": "Zur Kollektion",
     "itemsTitle": "Ihre ausgewählten Stücke.",
     "continueShopping": "Weitere Stücke entdecken",
     "emptyTitle": "Raum für Ihr Lieblingsstück.",
     "emptyCopy": "Ihr Warenkorb ist noch leer. Entdecken Sie die Signature-Kollektion und wählen Sie Ihre Farbe und Größe.",
     "stepCart": "Warenkorb",
     "stepDelivery": "Lieferung",
     "stepPayment": "Zahlung",
     "progressNote": "Lieferadresse und Zahlungsart wählen Sie anschließend bei Stripe.",
     "deliveryTitle": "Von Ihrer Auswahl zu Ihnen.",
     "addressTitle": "Ihre Lieferadresse",
     "addressCopy": "Name, E-Mail und Lieferadresse geben Sie einmal im sicheren Stripe-Checkout ein. Dort können Sie auch Ihre Rechnungsadresse angeben.",
     "paymentTitle": "Ihre Zahlungsart",
     "paymentCopy": "Die für Sie verfügbaren Zahlungsmethoden werden direkt bei Stripe angezeigt. Ihre Zahlungsdaten werden verschlüsselt verarbeitet.",
     "deliveryCountries": "Lieferung nach",
     "currencyNote": "Alle Preise in EUR.",
     "terms": "AGB",
     "withdrawal": "Widerruf",
     "privacy": "Datenschutz",
     "privacyTitle": "Mit gutem Gefühl.",
     "orderNumber": "Bestellnummer",
     "orderSaved": "Ihre Bestellung ist registriert.",
     "orderPending": "Ihre Zahlung ist bestätigt. Ihre Bestellung wird noch registriert. Bitte prüfen Sie den Status erneut.",
     "cartCleared": "Die bestellten Stücke wurden aus Ihrem Warenkorb entfernt.",
     "demoBannerTitle": "Demo-Checkout · Keine echte Bestellung",
     "demoBannerCopy": "Testen Sie den vollständigen Bestellablauf mit Beispielpreisen und Beispiel-Versandkosten. Es wird nichts bezahlt oder versendet.",
     "demoSelection": "IHR BESTELLTEST",
     "demoSummaryTitle": "Ihr Probelauf.",
     "demoHeadingCopy": "Vom Warenkorb bis zur Bestätigung. Einmal vollständig ausprobieren.",
     "demoGuest": "Demo · Ohne Zahlung oder Versand",
     "demoProgressNote": "Adresse eingeben, Übersicht prüfen und die Demo-Bestellung abschließen.",
     "demoReviewText": "Ihre Angaben werden nur für diesen Probelauf auf dieser geöffneten Seite verwendet.",
     "demoNoteTitle": "Ihr Bestelltest.",
     "demoPay": "Demo-Bestellung abschließen",
     "demoShipping": "Beispiel-Versand",
     "demoShippingNote": "Die angezeigten Lieferkosten sind ein Beispiel für diesen Test. Endgültige Versandkosten folgen.",
     "demoSecureNote": "Testzahlung – keine Kartendaten nötig. Es erfolgt keine Abbuchung.",
     "demoPrivacyCopy": "Ihre Testangaben bleiben ausschließlich auf dieser geöffneten Seite. Sie werden weder gespeichert noch an Stripe oder Chevalier & Roth übertragen.",
     "demoPrivacyPreview": "Diese Demo löst keine Bestellung, keine Zahlung und keinen Versand aus.",
     "demoPaymentServiceTitle": "Zahlungsablauf testen",
     "demoPaymentServiceCopy": "In dieser Demo benötigen Sie keine Zahlungsdaten. Sie können den Ablauf bis zur Bestellbestätigung testen.",
     "demoAddressCopy": "Nutzen Sie die Felder für Ihren Test. Die Angaben werden nur auf dieser geöffneten Seite angezeigt und nicht übertragen.",
     "demoStepPayment": "Bestätigung",
     "demoDetailsEyebrow": "FÜR IHREN PROBELAUF",
     "detailsTitle": "Wohin geht Ihr Lieblingsstück?",
     "demoDetailsIntro": "Testen Sie die Adresseingabe. Ihre Angaben bleiben ausschließlich auf dieser geöffneten Seite und werden nicht übertragen.",
     "contactLegend": "Kontakt",
     "emailLabel": "E-Mail-Adresse",
     "nameLabel": "Vor- und Nachname",
     "addressLegend": "Lieferadresse",
     "streetLabel": "Straße",
     "houseLabel": "Hausnummer",
     "postalLabel": "Postleitzahl",
     "cityLabel": "Ort",
     "countryLabel": "Land",
     "countryPlaceholder": "Land auswählen",
     "paymentLegend": "Zahlung",
     "demoPaymentTitle": "Testzahlung",
     "demoPaymentCopy": "Keine Kartendaten nötig. Es erfolgt keine Abbuchung.",
     "demoConsent": "Ich habe meine Angaben geprüft und verstehe, dass diese Demo keine Zahlung und keinen Versand auslöst.",
     "demoReady": "Bereit für Ihren Probelauf. Prüfen Sie die Angaben und schließen Sie die Demo ab.",
     "demoInvalidForm": "Bitte füllen Sie die markierten Felder aus und bestätigen Sie den Demo-Hinweis.",
     "demoPricePending": "Für diese Auswahl fehlt noch ein Beispielpreis.",
     "demoComplete": "Ihre Demo ist abgeschlossen.",
     "demoCompletedMessage": "So sieht die Bestätigung nach Ihrem Bestelltest aus. Es wurde nichts bezahlt oder bestellt.",
     "demoOrderNumber": "Demo-Referenz",
     "demoReceiptAddress": "Ihre Test-Lieferadresse",
     "demoReceiptItems": "Ihre getesteten Stücke",
     "demoReceiptTotal": "Test-Gesamtbetrag",
     "demoReceiptNote": "Keine echte Bestellung. Ihre Testangaben bleiben nur auf dieser Seite. Ihr Warenkorb bleibt zum Weiterprobieren erhalten.",
     "demoAgain": "Noch einmal testen",
     "demoFinished": "Demo abgeschlossen. Es wurde nichts bezahlt oder versendet.",
     "demoCurrencyNote": "Beispielpreise in EUR · Keine Rechnung",
     "demoNoDiscountConnection": "Rabattcodes können nur über die bestehende Serververbindung geprüft werden."
   },
   "en": {
     "title": "Checkout — Chevalier & Roth",
     "selection": "YOUR ORDER",
     "previewTitle": "Your order.",
     "previewText": "Check your colours, sizes and quantities. You will choose your delivery address and payment method at Stripe in the next step.",
     "item": "piece",
     "items": "pieces",
     "remove": "Remove",
     "decrease": "decrease",
     "increase": "increase",
     "unavailable": "Not yet available for this selection.",
     "productValue": "Product subtotal",
     "shipping": "Delivery",
     "shippingPending": "Still to be calculated",
     "total": "Order total",
     "plusShipping": "plus shipping",
     "shippingNote": "Delivery costs are confirmed before payment.",
     "pay": "Continue to secure payment",
     "prepared": "Payment is being prepared. Your selection is kept.",
     "checking": "Checking payment availability …",
     "ready": "The total price and shipping are confirmed. You can pay securely with Stripe.",
     "selectFirst": "Choose a piece from the collection first.",
     "invalidSelection": "This product variant is unavailable. Choose a piece from the collection.",
     "opening": "Opening secure Stripe Checkout …",
     "retry": "Check connection again",
     "secureNote": "Secure payment with Stripe. Payment details are entered directly there.",
     "privacyCopy": "Your selection is kept during this visit. You enter delivery and payment details directly at Stripe. The information needed to process your order is securely sent to Chevalier & Roth.",
     "privacyPreview": "An order becomes binding only when confirmed at the final payment step.",
     "apiUnavailable": "Payment is not yet available at this web address.",
     "connectionUnavailable": "The payment connection is currently unavailable. Your selection is kept.",
     "timeout": "The response is taking too long. Check the connection before trying again.",
     "invalidCheckout": "Stripe has not confirmed a valid live checkout.",
     "live": "STRIPE · LIVE",
     "verifyTitle": "Checking confirmation.",
     "verifyMessage": "We are asking Stripe directly for the payment status.",
     "notConfirmed": "Payment not confirmed.",
     "invalidReturn": "The return link does not contain a valid live payment ID.",
     "verificationFailed": "The payment could not be clearly confirmed.",
     "confirmed": "Payment confirmed.",
     "confirmedMessage": "has been confirmed as paid by Stripe.",
     "completed": "This payment is complete.",
     "pendingTitle": "Payment not yet confirmed.",
     "pendingMessage": "Stripe has not marked this payment as complete. You can check the status again.",
     "confirmationUnavailable": "Confirmation unavailable.",
     "cancelledTitle": "Your selection is kept.",
     "cancelledMessage": "Checkout was left. You can continue editing your selection.",
     "verifyAgain": "Check payment status again",
     "previewNoteTitle": "Every detail.",
     "heading": "A considered choice.",
     "headingCopy": "Your favourite pieces. Chosen with care.",
     "guestCheckout": "Guest checkout · No customer account required",
     "secureCheckout": "Secure checkout",
     "backToCollection": "Back to the collection",
     "itemsTitle": "Your selected pieces.",
     "continueShopping": "Discover more pieces",
     "emptyTitle": "Room for your favourite piece.",
     "emptyCopy": "Your bag is still empty. Discover the Signature collection and choose your colour and size.",
     "stepCart": "Your bag",
     "stepDelivery": "Delivery",
     "stepPayment": "Payment",
     "progressNote": "Choose your delivery address and payment method at Stripe next.",
     "deliveryTitle": "From your selection to your door.",
     "addressTitle": "Your delivery address",
     "addressCopy": "Enter your name, email and delivery address once in secure Stripe Checkout. You can also enter your billing address there.",
     "paymentTitle": "Your payment method",
     "paymentCopy": "Available payment methods are displayed directly at Stripe. Your payment information is encrypted.",
     "deliveryCountries": "Delivery to",
     "currencyNote": "All prices in EUR.",
     "terms": "Terms",
     "withdrawal": "Returns & withdrawal",
     "privacy": "Privacy",
     "privacyTitle": "With peace of mind.",
     "orderNumber": "Order number",
     "orderSaved": "Your order has been registered.",
     "orderPending": "Your payment is confirmed. Your order is still being registered. Please check the status again.",
     "cartCleared": "Your ordered pieces have been removed from your bag.",
     "demoBannerTitle": "Demo checkout · No real order",
     "demoBannerCopy": "Try the complete order journey with example prices and delivery costs. Nothing will be charged or dispatched.",
     "demoSelection": "YOUR ORDER TEST",
     "demoSummaryTitle": "Your trial order.",
     "demoHeadingCopy": "From your bag to confirmation. Try the whole experience.",
     "demoGuest": "Demo · No charge or delivery",
     "demoProgressNote": "Enter an address, review your selection and complete the demo order.",
     "demoReviewText": "Your details are used only for this trial on this open page.",
     "demoNoteTitle": "Your order test.",
     "demoPay": "Complete demo order",
     "demoShipping": "Example delivery",
     "demoShippingNote": "The delivery cost shown is an example for this test. Final delivery costs will follow.",
     "demoSecureNote": "Test payment – no card details needed. No money will be charged.",
     "demoPrivacyCopy": "Your test details remain on this open page only. They are neither saved nor sent to Stripe or Chevalier & Roth.",
     "demoPrivacyPreview": "This demo does not create an order, charge or dispatch.",
     "demoPaymentServiceTitle": "Try the payment journey",
     "demoPaymentServiceCopy": "No payment details are needed in this demo. Try the journey through to order confirmation.",
     "demoAddressCopy": "Use the fields for your test. Your details are displayed on this open page only and are not transmitted.",
     "demoStepPayment": "Confirmation",
     "demoDetailsEyebrow": "FOR YOUR TRIAL ORDER",
     "detailsTitle": "Where will your favourite piece go?",
     "demoDetailsIntro": "Try entering a delivery address. Your details remain on this open page only and are not transmitted.",
     "contactLegend": "Contact",
     "emailLabel": "Email address",
     "nameLabel": "Full name",
     "addressLegend": "Delivery address",
     "streetLabel": "Street",
     "houseLabel": "House number",
     "postalLabel": "Postcode",
     "cityLabel": "City",
     "countryLabel": "Country",
     "countryPlaceholder": "Select a country",
     "paymentLegend": "Payment",
     "demoPaymentTitle": "Test payment",
     "demoPaymentCopy": "No card details needed. No money will be charged.",
     "demoConsent": "I have checked my details and understand that this demo does not charge money or dispatch an order.",
     "demoReady": "Ready for your trial order. Check your details and complete the demo.",
     "demoInvalidForm": "Please complete the highlighted fields and confirm the demo notice.",
     "demoPricePending": "An example price is still missing for this selection.",
     "demoComplete": "Your demo is complete.",
     "demoCompletedMessage": "This is the confirmation after your order test. Nothing has been charged or ordered.",
     "demoOrderNumber": "Demo reference",
     "demoReceiptAddress": "Your test delivery address",
     "demoReceiptItems": "Your tested pieces",
     "demoReceiptTotal": "Test order total",
     "demoReceiptNote": "No real order. Your test details remain on this page only. Your bag is kept so you can try again.",
     "demoAgain": "Try again",
     "demoFinished": "Demo complete. Nothing has been charged or dispatched.",
     "demoCurrencyNote": "Example prices in EUR · Not an invoice",
     "demoNoDiscountConnection": "Discount codes can only be checked through the existing server connection."
   },
   "fr": {
     "title": "Paiement — Chevalier & Roth",
     "selection": "VOTRE COMMANDE",
     "previewTitle": "Votre commande.",
     "previewText": "Vérifiez les couleurs, tailles et quantités. Vous choisirez votre adresse de livraison et votre moyen de paiement chez Stripe à l’étape suivante.",
     "item": "pièce",
     "items": "pièces",
     "remove": "Retirer",
     "decrease": "diminuer",
     "increase": "augmenter",
     "unavailable": "Pas encore disponible pour cette sélection.",
     "productValue": "Sous-total des produits",
     "shipping": "Livraison",
     "shippingPending": "Reste à calculer",
     "total": "Montant total",
     "plusShipping": "hors livraison",
     "shippingNote": "Les frais de livraison sont confirmés avant le paiement.",
     "pay": "Continuer vers le paiement sécurisé",
     "prepared": "Le paiement est en préparation. Votre sélection est conservée.",
     "checking": "Vérification du paiement …",
     "ready": "Le prix total et la livraison sont confirmés. Vous pouvez payer en toute sécurité avec Stripe.",
     "selectFirst": "Choisissez d’abord une pièce de la collection.",
     "invalidSelection": "Cette variante n’est pas disponible. Choisissez une pièce de la collection.",
     "opening": "Ouverture du paiement sécurisé Stripe …",
     "retry": "Vérifier à nouveau la connexion",
     "secureNote": "Paiement sécurisé avec Stripe. Les données de paiement sont saisies directement sur ce service.",
     "privacyCopy": "Votre sélection est conservée pendant cette visite. Vous saisissez vos coordonnées de livraison et de paiement directement chez Stripe. Les informations nécessaires au traitement de votre commande sont transmises de manière sécurisée à Chevalier & Roth.",
     "privacyPreview": "La commande devient définitive uniquement après confirmation lors de la dernière étape du paiement.",
     "apiUnavailable": "Le paiement n’est pas encore disponible à cette adresse web.",
     "connectionUnavailable": "La connexion de paiement est actuellement indisponible. Votre sélection est conservée.",
     "timeout": "La réponse prend trop de temps. Vérifiez la connexion avant de réessayer.",
     "invalidCheckout": "Stripe n’a pas confirmé de paiement réel valide.",
     "live": "STRIPE · PAIEMENT RÉEL",
     "verifyTitle": "Vérification de la confirmation.",
     "verifyMessage": "Nous demandons directement à Stripe le statut du paiement.",
     "notConfirmed": "Paiement non confirmé.",
     "invalidReturn": "Le lien de retour ne contient pas d’identifiant de paiement réel valide.",
     "verificationFailed": "Le paiement n’a pas pu être confirmé clairement.",
     "confirmed": "Paiement confirmé.",
     "confirmedMessage": "ont été confirmés comme payés par Stripe.",
     "completed": "Ce paiement est terminé.",
     "pendingTitle": "Paiement pas encore confirmé.",
     "pendingMessage": "Stripe n’indique pas encore ce paiement comme terminé. Vous pouvez vérifier à nouveau son statut.",
     "confirmationUnavailable": "Confirmation indisponible.",
     "cancelledTitle": "Votre sélection est conservée.",
     "cancelledMessage": "Vous avez quitté le paiement. Vous pouvez continuer à modifier votre sélection.",
     "verifyAgain": "Vérifier à nouveau le paiement",
     "previewNoteTitle": "Chaque détail.",
     "heading": "Un choix réfléchi.",
     "headingCopy": "Vos pièces préférées. Choisies avec soin.",
     "guestCheckout": "Commande en tant qu’invité · Aucun compte client requis",
     "secureCheckout": "Paiement sécurisé",
     "backToCollection": "Retour à la collection",
     "itemsTitle": "Vos pièces sélectionnées.",
     "continueShopping": "Découvrir d’autres pièces",
     "emptyTitle": "Une place pour votre pièce préférée.",
     "emptyCopy": "Votre panier est encore vide. Découvrez la collection Signature et choisissez votre couleur et votre taille.",
     "stepCart": "Panier",
     "stepDelivery": "Livraison",
     "stepPayment": "Paiement",
     "progressNote": "Choisissez ensuite votre adresse de livraison et votre moyen de paiement chez Stripe.",
     "deliveryTitle": "De votre sélection à votre porte.",
     "addressTitle": "Votre adresse de livraison",
     "addressCopy": "Saisissez une seule fois votre nom, votre e-mail et votre adresse de livraison dans le paiement sécurisé Stripe. Vous pourrez également y indiquer votre adresse de facturation.",
     "paymentTitle": "Votre moyen de paiement",
     "paymentCopy": "Les moyens de paiement disponibles sont affichés directement chez Stripe. Vos données de paiement sont chiffrées.",
     "deliveryCountries": "Livraison vers",
     "currencyNote": "Tous les prix sont en EUR.",
     "terms": "Conditions générales",
     "withdrawal": "Rétractation",
     "privacy": "Confidentialité",
     "privacyTitle": "En toute sérénité.",
     "orderNumber": "Numéro de commande",
     "orderSaved": "Votre commande est enregistrée.",
     "orderPending": "Votre paiement est confirmé. L’enregistrement de votre commande est en cours. Veuillez vérifier à nouveau son statut.",
     "cartCleared": "Les pièces commandées ont été retirées de votre panier.",
     "demoBannerTitle": "Démonstration · Aucune commande réelle",
     "demoBannerCopy": "Essayez le parcours complet avec des prix et des frais de livraison donnés à titre d’exemple. Aucun paiement ni envoi ne sera effectué.",
     "demoSelection": "VOTRE COMMANDE TEST",
     "demoSummaryTitle": "Votre essai.",
     "demoHeadingCopy": "Du panier à la confirmation. Essayez le parcours complet.",
     "demoGuest": "Démonstration · Sans paiement ni envoi",
     "demoProgressNote": "Saisissez une adresse, vérifiez votre sélection et terminez la commande de démonstration.",
     "demoReviewText": "Vos coordonnées servent uniquement à cet essai sur cette page ouverte.",
     "demoNoteTitle": "Votre commande test.",
     "demoPay": "Terminer la commande de démonstration",
     "demoShipping": "Livraison à titre d’exemple",
     "demoShippingNote": "Les frais de livraison affichés sont un exemple pour cet essai. Les frais définitifs seront précisés ultérieurement.",
     "demoSecureNote": "Paiement test – aucune donnée de carte requise. Aucun prélèvement.",
     "demoPrivacyCopy": "Vos coordonnées de test restent uniquement sur cette page ouverte. Elles ne sont ni enregistrées ni transmises à Stripe ou à Chevalier & Roth.",
     "demoPrivacyPreview": "Cette démonstration ne crée ni commande, ni paiement, ni envoi.",
     "demoPaymentServiceTitle": "Essayer le parcours de paiement",
     "demoPaymentServiceCopy": "Aucune donnée de paiement n’est nécessaire dans cette démonstration. Essayez le parcours jusqu’à la confirmation.",
     "demoAddressCopy": "Utilisez les champs pour votre essai. Vos coordonnées sont affichées uniquement sur cette page ouverte et ne sont pas transmises.",
     "demoStepPayment": "Confirmation",
     "demoDetailsEyebrow": "POUR VOTRE ESSAI",
     "detailsTitle": "Où livrer votre pièce préférée ?",
     "demoDetailsIntro": "Essayez de saisir une adresse. Vos coordonnées restent uniquement sur cette page ouverte et ne sont pas transmises.",
     "contactLegend": "Contact",
     "emailLabel": "Adresse e-mail",
     "nameLabel": "Nom et prénom",
     "addressLegend": "Adresse de livraison",
     "streetLabel": "Rue",
     "houseLabel": "Numéro",
     "postalLabel": "Code postal",
     "cityLabel": "Ville",
     "countryLabel": "Pays",
     "countryPlaceholder": "Choisir un pays",
     "paymentLegend": "Paiement",
     "demoPaymentTitle": "Paiement test",
     "demoPaymentCopy": "Aucune donnée de carte requise. Aucun prélèvement.",
     "demoConsent": "J’ai vérifié mes coordonnées et je comprends que cette démonstration n’entraîne aucun paiement ni envoi.",
     "demoReady": "Votre essai est prêt. Vérifiez vos coordonnées et terminez la démonstration.",
     "demoInvalidForm": "Complétez les champs indiqués et confirmez l’avis de démonstration.",
     "demoPricePending": "Un prix d’exemple manque encore pour cette sélection.",
     "demoComplete": "Votre démonstration est terminée.",
     "demoCompletedMessage": "Voici la confirmation après votre essai de commande. Aucun paiement ni commande n’a été effectué.",
     "demoOrderNumber": "Référence de démonstration",
     "demoReceiptAddress": "Votre adresse de livraison test",
     "demoReceiptItems": "Vos pièces testées",
     "demoReceiptTotal": "Montant total du test",
     "demoReceiptNote": "Aucune commande réelle. Vos coordonnées restent sur cette page uniquement. Votre panier est conservé pour un nouvel essai.",
     "demoAgain": "Essayer à nouveau",
     "demoFinished": "Démonstration terminée. Aucun paiement ni envoi.",
     "demoCurrencyNote": "Prix d’exemple en EUR · Pas une facture",
     "demoNoDiscountConnection": "Les codes de réduction ne peuvent être vérifiés que via la connexion serveur existante."
   }
 };
 Object.assign(words.de,{discountLabel:'Ihr Rabattcode',discountApply:'Anwenden',discountRemove:'Code entfernen',discountTitle:'Rabatt',discountHint:'Geben Sie Ihren Code hier einmal ein.',discountChecking:'Ihr Code wird bei Stripe geprüft …',discountApplied:'Wird in Stripe übernommen. Keine zweite Eingabe nötig.',discountPending:'Bitte den Code anwenden oder entfernen, bevor Sie zur Zahlung weitergehen.',discountReapply:'Ihre Auswahl hat sich geändert. Bitte prüfen Sie den Code erneut.',discountEmpty:'Bitte einen Rabattcode eingeben.',discountFormat:'Bitte nur Buchstaben, Zahlen und Bindestriche verwenden (höchstens 64 Zeichen).',discountMismatch:'Die Preisübersicht hat sich geändert. Bitte laden Sie die Verbindung neu und prüfen Sie den Code erneut.',discountInvalid:'Dieser Rabattcode ist nicht gültig.',discountInactive:'Dieser Rabattcode ist derzeit nicht aktiv.',discountNotStarted:'Dieser Rabattcode ist noch nicht gültig.',discountExpired:'Dieser Rabattcode ist abgelaufen.',discountExhausted:'Dieser Rabattcode wurde bereits vollständig eingelöst.',discountMinimum:'Der Mindestbestellwert für diesen Code ist nicht erreicht.',discountRestricted:'Dieser Code ist für Ihre Auswahl nicht verfügbar.',discountUnavailable:'Der Rabattcode konnte gerade nicht geprüft werden. Bitte erneut versuchen.'});
 Object.assign(words.en,{discountLabel:'Your discount code',discountApply:'Apply',discountRemove:'Remove code',discountTitle:'Discount',discountHint:'Enter your code here just once.',discountChecking:'Checking your code with Stripe …',discountApplied:'It will be applied in Stripe. No need to enter it again.',discountPending:'Apply or remove the code before continuing to payment.',discountReapply:'Your selection has changed. Please check the code again.',discountEmpty:'Please enter a discount code.',discountFormat:'Use only letters, numbers and hyphens (up to 64 characters).',discountMismatch:'The price overview has changed. Check the connection and apply the code again.',discountInvalid:'This discount code is invalid.',discountInactive:'This discount code is not currently active.',discountNotStarted:'This discount code is not valid yet.',discountExpired:'This discount code has expired.',discountExhausted:'This discount code has reached its redemption limit.',discountMinimum:'The minimum order value for this code has not been reached.',discountRestricted:'This code is unavailable for your selection.',discountUnavailable:'The discount code could not be checked. Please try again.'});
 Object.assign(words.fr,{discountLabel:'Votre code de réduction',discountApply:'Appliquer',discountRemove:'Retirer le code',discountTitle:'Réduction',discountHint:'Saisissez votre code ici une seule fois.',discountChecking:'Vérification de votre code auprès de Stripe …',discountApplied:'Il sera appliqué dans Stripe. Aucune deuxième saisie nécessaire.',discountPending:'Appliquez ou retirez le code avant de passer au paiement.',discountReapply:'Votre sélection a changé. Veuillez vérifier le code à nouveau.',discountEmpty:'Veuillez saisir un code de réduction.',discountFormat:'Utilisez uniquement des lettres, des chiffres et des tirets (64 caractères maximum).',discountMismatch:'Le récapitulatif a changé. Vérifiez la connexion et appliquez le code à nouveau.',discountInvalid:'Ce code de réduction est invalide.',discountInactive:'Ce code de réduction n’est pas actif actuellement.',discountNotStarted:'Ce code de réduction n’est pas encore valable.',discountExpired:'Ce code de réduction a expiré.',discountExhausted:'Ce code a atteint sa limite d’utilisation.',discountMinimum:'Le montant minimum requis pour ce code n’est pas atteint.',discountRestricted:'Ce code n’est pas disponible pour votre sélection.',discountUnavailable:'Le code n’a pas pu être vérifié. Veuillez réessayer.'});
 Object.assign(words.de,{demoServiceTitle:'Demo-Servicekontakt',demoServiceNote:'Eine Platzhalter-Adresse für diese Demo. Hier werden keine Nachrichten versendet oder empfangen.',discountInputLabel:'Rabattcode',demoFill:'Fiktive Beispieldaten einsetzen',demoFillNote:'Sie können den Ablauf vollständig ohne eigene Angaben testen.',demoHeader:'Bestellablauf testen'});
 Object.assign(words.en,{demoServiceTitle:'Demo service contact',demoServiceNote:'A placeholder address for this demo. No messages are sent or received here.',discountInputLabel:'Discount code',demoFill:'Use fictional example details',demoFillNote:'Try the complete journey without entering your own details.',demoHeader:'Try the order journey'});
 Object.assign(words.fr,{demoServiceTitle:'Contact de service fictif',demoServiceNote:'Une adresse fictive pour cette démonstration. Aucun message n’est envoyé ni reçu ici.',discountInputLabel:'Code de réduction',demoFill:'Utiliser des coordonnées fictives',demoFillNote:'Essayez le parcours complet sans saisir vos propres coordonnées.',demoHeader:'Essayer la commande'});
 const language=()=>{const value=window.CRI18N?.getLanguage()||document.documentElement.lang;return words[value]?value:'de';};
 const demoTextKeys={secureCheckout:'demoHeader',selection:'demoSelection',previewTitle:'demoSummaryTitle',previewNoteTitle:'demoNoteTitle',previewText:'demoReviewText',headingCopy:'demoHeadingCopy',guestCheckout:'demoGuest',progressNote:'demoProgressNote',shipping:'demoShipping',shippingNote:'demoShippingNote',secureNote:'demoSecureNote',privacyCopy:'demoPrivacyCopy',privacyPreview:'demoPrivacyPreview',paymentTitle:'demoPaymentServiceTitle',paymentCopy:'demoPaymentServiceCopy',addressCopy:'demoAddressCopy',stepPayment:'demoStepPayment',currencyNote:'demoCurrencyNote',pay:'demoPay'};
 const text=key=>{const localizedKey=demoMode()&&demoTextKeys[key]||key;return words[language()][localizedKey]||words.de[localizedKey]||localizedKey;};
 const money=cents=>new Intl.NumberFormat({de:'de-DE',en:'en-GB',fr:'fr-FR'}[language()],{style:'currency',currency:'EUR'}).format(cents/100);
 const colorName=id=>({en:{bordeaux:'Bordeaux',beige:'Beige',navy:'Navy blue'},fr:{bordeaux:'Bordeaux',beige:'Beige',navy:'Bleu marine'}}[language()]?.[id]||byId[items.find(item=>item.color===id)?.product]?.variants[id]?.name||window.CR_COLORS?.find(color=>color.id===id)?.name||id);
 function el(tag,value,className){const element=document.createElement(tag);if(value!==undefined)element.textContent=String(value);if(className)element.className=className;return element;}
 const amountValid=value=>Number.isSafeInteger(value)&&value>0&&value<=1000000;
 function valid(item){return item&&byId[item.product]?.variants[item.color]&&validSizes.includes(item.size)&&Number.isInteger(item.qty)&&item.qty>0&&item.qty<=20;}
 function normalize(raw){if(!Array.isArray(raw))return [];const map=new Map();for(const item of raw.slice(0,60)){if(!valid(item))continue;const key=item.product+'/'+item.color+'/'+item.size,prior=map.get(key);map.set(key,{product:item.product,color:item.color,size:item.size,qty:Math.min(20,(prior?.qty||0)+item.qty)});}return [...map.values()];}
 function readCart(){try{const v3=selectionStorage.getItem('cr-selection-v3'),raw=JSON.parse(v3===null?(selectionStorage.getItem('cr-selection-v2')||'[]'):v3);return normalize(v3===null&&Array.isArray(raw)?raw.map(item=>({...item,color:'bordeaux'})):raw);}catch{return [];}}
 function readSnapshot(){try{return normalize(JSON.parse(sessionStorage.getItem(snapshotKey)||sessionStorage.getItem('cr-stripe-test-selection-v1')||'[]'));}catch{return [];}}
 if(direct){const item={product:query.get('product'),color:query.get('color')||'bordeaux',size:query.get('size')||'M',qty:1};if(valid(item))items=[item];}
 else items=returning?readSnapshot():readCart();
 function saveSelection(){if(!direct&&!returning){try{selectionStorage.setItem('cr-selection-v3',JSON.stringify(items));}catch{}}try{sessionStorage.setItem(snapshotKey,JSON.stringify(items));}catch{}}
 function productURL(item){return 'product.html?'+new URLSearchParams({product:item.product,color:item.color,size:item.size,lang:language()});}
 function price(item){const example=config.demoCheckout?.productPrices?.[item.product];if(demoMode()&&amountValid(example))return {amount:example,available:true};const server=catalog?.currency==='eur'?catalog.prices?.[item.product]:null;const preview=approved.currency==='eur'?approved.products?.[item.product]:null;return amountValid(server?.amount)?server:amountValid(preview?.amount)?preview:null;}
 function liveCatalog(){return catalog?.mode==='live'&&catalog.testMode===false&&catalog.configured===true&&catalog.currency==='eur';}
 function shippingAmount(){if(demoMode()){const demo=config.demoCheckout;return demo.currency==='eur'&&Number.isSafeInteger(demo.shippingAmount)&&demo.shippingAmount>=0&&demo.shippingAmount<=100000?demo.shippingAmount:null;}return liveCatalog()&&catalog.shippingConfirmed===true&&Number.isSafeInteger(catalog.shippingAmount)&&catalog.shippingAmount>=0?catalog.shippingAmount:null;}
 function pricesReady(){return items.length>0&&liveCatalog()&&catalog.ready===true&&catalog.canCharge===true&&catalog.webhookConfigured===true&&catalog.orderStorageConfigured===true&&catalog.backendPublic===true&&shippingAmount()!==null&&items.every(item=>amountValid(catalog.prices?.[item.product]?.amount)&&catalog.prices[item.product].available!==false);}
 const cartSignature=()=>JSON.stringify(items);
 const typedCode=()=>get('checkout-code').value.trim().toUpperCase();
 function subtotalAmount(){return items.length>0&&items.every(item=>price(item))?items.reduce((sum,item)=>sum+price(item).amount*item.qty,0):null;}
 function discountMatches(){return !!discount&&discount.code===typedCode()&&discount.signature===cartSignature()&&discount.subtotal===subtotalAmount();}
 function discountReady(){return !discountBusy&&(!typedCode()||discountMatches());}
 function canPay(){if(demoMode())return !busy&&!demoReceipt&&items.length>0&&items.every(item=>price(item))&&shippingAmount()!==null&&shippingCountries().length>0&&discountReady();return !busy&&!verifiedPaid&&!resultOnly&&pricesReady()&&discountReady();}
 function invalidateDiscount(note=''){discountVersion++;discount=null;discountBusy=false;discountNote=note;discountError='';discountState='';attemptId='';attemptSignature='';}
 function selectionChanged(){invalidateDiscount(typedCode()?'discountReapply':'');}
 function discountErrorText(error){const key={discount_invalid:'discountInvalid',discount_inactive:'discountInactive',discount_not_started:'discountNotStarted',discount_expired:'discountExpired',discount_exhausted:'discountExhausted',discount_minimum:'discountMinimum',discount_restricted:'discountRestricted',discount_unavailable:'discountUnavailable',prices_unconfigured:'discountMismatch',product_unavailable:'discountRestricted'}[error?.code];return key?text(key):error?.message||text('discountUnavailable');}
 function status(message,state=''){get('checkout-status').textContent=message;get('checkout-status').dataset.state=state;}
 function displayStatus(){if(resultOnly)return;if(demoReceipt)status(text('demoFinished'));else if(verifiedPaid)status(text('completed'));else if(busy)status(text('opening'));else if(!items.length)status(text(direct?'invalidSelection':'selectFirst'));else if(!discountReady())status(text(discountBusy?'discountChecking':'discountPending'));else if(demoMode())status(text(canPay()?'demoReady':'demoPricePending'));else status(text(pricesReady()?'ready':'prepared'));}
 function staticLabels(){
  document.title=text('title');document.querySelectorAll('[data-checkout-text]').forEach(element=>{element.textContent=text(element.dataset.checkoutText);});
  get('checkout-pay').textContent=text('pay');get('checkout-reload').textContent=text('retry');get('checkout-verify-again').textContent=text('verifyAgain');
  const demoEmail=demoMode()&&typeof config.demoCheckout.serviceEmail==='string'?config.demoCheckout.serviceEmail.slice(0,200):'';get('checkout-demo-contact').hidden=!demoEmail;get('checkout-demo-service-email').textContent=demoEmail;document.body.dataset.checkoutMode=demoMode()?'demo':'live';get('checkout-demo-banner').hidden=!demoMode();get('checkout-demo-details').hidden=!demoMode()||!!demoReceipt;get('checkout-demo-again').hidden=!demoReceipt;
 }
 function renderDiscount(){
  if(discount&&!discountMatches())invalidateDiscount(typedCode()?'discountReapply':'');
  const applied=discountMatches(),code=typedCode(),message=get('checkout-code-status');
  document.querySelector('.checkout-promotion').hidden=resultOnly;
  document.querySelector('.checkout-promotion').setAttribute('aria-busy',String(discountBusy));
  get('checkout-code').disabled=busy||verifiedPaid||resultOnly||!!demoReceipt;
  get('checkout-code-apply').disabled=busy||verifiedPaid||resultOnly||!!demoReceipt||discountBusy||!items.length;
  get('checkout-code-remove').hidden=!code&&!discountBusy&&!discountError&&!discountNote;
  get('checkout-code-remove').disabled=busy||verifiedPaid||resultOnly||!!demoReceipt;
  message.textContent=discountBusy?text('discountChecking'):discountError?discountErrorText(discountError):applied?text('discountApplied'):text(discountNote||'discountHint');
  message.dataset.state=discountError||discountState==='error'?'error':applied?'success':'';
  get('checkout-discount-row').hidden=!applied;
  get('checkout-discount-label').textContent=applied?text('discountTitle')+' · '+discount.code:text('discountTitle');
  get('checkout-discount-amount').textContent=applied?'−'+money(discount.discountAmount):'';
  return applied?discount.discountAmount:0;
 }
 function render(){
  staticLabels();const container=get('checkout-items');container.replaceChildren();const count=items.reduce((sum,item)=>sum+item.qty,0);get('checkout-item-count').textContent=count+' '+text(count===1?'item':'items');get('checkout-empty').hidden=items.length>0;
  items.forEach(item=>{
   const product=byId[item.product],variant=product.variants[item.color],name=colorName(item.color),line=el('article',undefined,'checkout-line'),imageLink=el('a',undefined,'checkout-line-image');imageLink.href=productURL(item);imageLink.setAttribute('aria-label',product.name+' · '+name+' / '+item.size);
   const image=el('img'),photo=window.CR_PRODUCT_GALLERIES?.[item.product]?.[item.color]?.[0],sources=[...new Set([photo?.src,photo?.fallbackSrc,'assets/studio-photo-pending.svg'].filter(Boolean))];let imageAttempt=0;image.onerror=()=>{if(++imageAttempt<sources.length)image.src=sources[imageAttempt];else image.onerror=null;};image.src=sources[0];image.alt='';image.width=110;image.height=140;imageLink.append(image);
   const details=el('div'),heading=el('h3'),link=el('a',product.name);link.href=productURL(item);heading.append(link);details.append(heading,el('p',name+' / '+item.size));const controls=el('div',undefined,'checkout-quantity');
   for(const [label,delta]of [['−',-1],['+',1]]){const button=el('button',label);button.type='button';button.setAttribute('aria-label',product.name+' '+name+' '+item.size+' '+text(delta<0?'decrease':'increase'));button.disabled=busy||verifiedPaid||resultOnly||!!demoReceipt||(delta>0&&item.qty>=20);button.addEventListener('click',()=>{item.qty+=delta;if(item.qty<1)items.splice(items.indexOf(item),1);selectionChanged();saveSelection();render();});controls.append(button);if(delta<0)controls.append(el('span',item.qty));}
   const remove=el('button',text('remove'),'checkout-remove');remove.type='button';remove.disabled=busy||verifiedPaid||resultOnly||!!demoReceipt;remove.addEventListener('click',()=>{items.splice(items.indexOf(item),1);selectionChanged();saveSelection();render();});controls.append(remove);details.append(controls);if(price(item)?.available===false)details.append(el('p',text('unavailable')));
   const amount=price(item);line.append(imageLink,details,el('strong',amount?money(amount.amount*item.qty):'—','checkout-line-total'));container.append(line);
  });
  const subtotal=subtotalAmount(),shipping=shippingAmount(),discountAmount=renderDiscount(),discountedSubtotal=subtotal===null?null:subtotal-discountAmount;
  get('checkout-subtotal').textContent=subtotal===null?'—':money(subtotal);
  get('checkout-shipping').textContent=shipping===null?text('shippingPending'):money(shipping);
  get('checkout-total').textContent=discountedSubtotal===null?'—':shipping===null?money(discountedSubtotal)+' '+text('plusShipping'):money(discountedSubtotal+shipping);
  get('checkout-total').dataset.final=String(subtotal!==null&&shipping!==null);
  get('checkout-pay').disabled=!canPay();get('checkout-pay').hidden=!!demoReceipt||resultOnly;get('checkout-reload').hidden=pricesReady()||resultOnly||demoMode();renderCountries();displayStatus();if(demoReceipt)renderDemoReceipt();
 }
 function shippingCountries(){const source=demoMode()?config.demoCheckout.shippingCountries:liveCatalog()&&catalog.shippingConfirmed===true?catalog.shippingCountries:[];return Array.isArray(source)?[...new Set(source.filter(code=>typeof code==='string'&&/^[A-Z]{2}$/.test(code)))].slice(0,64):[];}
 function countryName(code){try{return new Intl.DisplayNames([language()],{type:'region'}).of(code)||code;}catch{return code;}}
 function renderCountries(){
  const countries=shippingCountries(),container=get('checkout-destinations');container.hidden=!countries.length;
  const names=countries.map(countryName);try{get('checkout-country-list').textContent=new Intl.ListFormat(language(),{style:'long',type:'conjunction'}).format(names);}catch{get('checkout-country-list').textContent=names.join(', ');}
  if(!demoMode())return;const select=get('checkout-country'),signature=language()+':'+countries.join(',');
  if(select.dataset.options!==signature){const selected=select.value;select.replaceChildren();const placeholder=el('option',text('countryPlaceholder'));placeholder.value='';select.append(placeholder);countries.forEach(code=>{const option=el('option',countryName(code));option.value=code;select.append(option);});select.value=countries.includes(selected)?selected:'';select.dataset.options=signature;}
 }
 function renderDemoReceipt(){
  result(text('demoBannerTitle'),text('demoComplete'),text('demoCompletedMessage'),'demo');
  const receipt=get('checkout-order-confirmation');receipt.hidden=false;receipt.replaceChildren();
  const reference=el('p',undefined,'checkout-receipt-reference');reference.append(el('span',text('demoOrderNumber')),el('strong',demoReceipt.number));receipt.append(reference);
  const columns=el('div',undefined,'checkout-receipt-columns'),address=el('section'),pieces=el('section');address.append(el('h3',text('demoReceiptAddress')));
  const customer=demoReceipt.address;address.append(el('p',[customer.name,customer.street+' '+customer.houseNumber,customer.postal+' '+customer.city,countryName(customer.country),customer.email].join('\n'),'checkout-receipt-address'));
  pieces.append(el('h3',text('demoReceiptItems')));const list=el('ul');demoReceipt.items.forEach(item=>list.append(el('li',byId[item.product].name+' · '+colorName(item.color)+' / '+item.size+' · '+item.qty+' × '+money(item.unitAmount))));pieces.append(list);columns.append(address,pieces);receipt.append(columns);
  const totals=el('dl',undefined,'checkout-receipt-totals');for(const [label,value] of [[text('productValue'),demoReceipt.subtotal],...(demoReceipt.discountAmount?[[text('discountTitle')+' · '+demoReceipt.discountCode,-demoReceipt.discountAmount]]:[]),[text('shipping'),demoReceipt.shipping],[text('demoReceiptTotal'),demoReceipt.total]]){const row=el('div');row.append(el('dt',label),el('dd',money(value)));totals.append(row);}receipt.append(totals,el('p',text('demoReceiptNote'),'checkout-receipt-note'));get('checkout-demo-again').hidden=false;
 }
 function completeDemo(){
  if(!demoMode()||!canPay())return;
  const form=get('checkout-details-form');form.querySelectorAll('input[required]:not([type=checkbox])').forEach(input=>input.setCustomValidity(input.value.trim()?'':text('demoInvalidForm')));
  if(!form.reportValidity()){get('checkout-form-message').textContent=text('demoInvalidForm');return;}
  get('checkout-form-message').textContent='';const fields=Object.fromEntries(['email','name','street','houseNumber','postal','city','country'].map(name=>[name,String(new FormData(form).get(name)||'').trim()]));
  if(!shippingCountries().includes(fields.country)){get('checkout-country').setCustomValidity(text('demoInvalidForm'));form.reportValidity();return;}
  const subtotal=subtotalAmount(),discountAmount=discountMatches()?discount.discountAmount:0,shipping=shippingAmount();
  demoReceipt={number:'DEMO-'+crypto.randomUUID().replaceAll('-','').slice(0,12).toUpperCase(),address:fields,items:items.map(item=>({...item,unitAmount:price(item).amount})),subtotal,discountAmount,discountCode:discountMatches()?discount.code:'',shipping,total:subtotal-discountAmount+shipping};
  setStep(2);render();get('checkout-result').scrollIntoView?.({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
 }
 function setStep(index){document.querySelectorAll('.checkout-progress li').forEach((step,i)=>{if(i===index)step.setAttribute('aria-current','step');else step.removeAttribute('aria-current');});}
 get('checkout-demo-fill').addEventListener('click',()=>{if(!demoMode()||demoReceipt)return;const examples={email:'max@example.invalid',name:'Max Mustermann',street:'Musterstraße',houseNumber:'1',postal:'1234',city:'Luxemburg',country:shippingCountries().includes('LU')?'LU':shippingCountries()[0]};const form=get('checkout-details-form');for(const [name,value]of Object.entries(examples)){const input=form.elements.namedItem(name);input.value=value;input.setCustomValidity('');}get('checkout-demo-consent').checked=false;get('checkout-form-message').textContent='';setStep(1);get('checkout-demo-consent').focus();});
 get('checkout-details-form').addEventListener('focusin',()=>setStep(1));
 get('checkout-details-form').addEventListener('submit',event=>{event.preventDefault();completeDemo();});
 get('checkout-details-form').addEventListener('input',event=>{event.target.setCustomValidity?.('');get('checkout-form-message').textContent='';});
 get('checkout-demo-again').addEventListener('click',()=>{demoReceipt=null;setStep(0);get('checkout-result').hidden=true;get('checkout-order-confirmation').hidden=true;render();get('checkout-name').focus();});
 function clearPurchasedCart(){
  if(clearedPaidCart||!items.length)return;const marker='cr-checkout-cleared:'+sessionId;
  try{if(sessionStorage.getItem(marker)==='true'){clearedPaidCart=true;return;}}catch{}
  const current=readCart();for(const purchased of items){const row=current.find(item=>item.product===purchased.product&&item.color===purchased.color&&item.size===purchased.size);if(row)row.qty=Math.max(0,row.qty-purchased.qty);}
  try{selectionStorage.setItem('cr-selection-v3',JSON.stringify(current.filter(item=>item.qty>0)));clearedPaidCart=true;try{sessionStorage.setItem(marker,'true');}catch{}}catch{}
 }
 function backendURL(path){
  if(config.backendOrigin){const base=new URL(config.backendOrigin);if(base.protocol!=='https:'||base.username||base.password)throw new Error(text('apiUnavailable'));return new URL(path,base.origin).href;}
  return new URL(path,location.origin).href;
 }
 const staticOnly=()=>!config.backendOrigin&&location.hostname.endsWith('.github.io');
 async function api(path,options={}){
  if(staticOnly())throw new Error(text('apiUnavailable'));
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{const response=await fetch(backendURL(path),{...options,credentials:'same-origin',cache:'no-store',signal:controller.signal});let data;try{data=await response.json();}catch{throw new Error(text('apiUnavailable'));}if(!response.ok){const error=new Error(data.message||text('connectionUnavailable'));error.code=data.error;throw error;}return data;}
  catch(error){if(error.name==='AbortError')throw new Error(text('timeout'));if(error instanceof TypeError)throw new Error(text('connectionUnavailable'));throw error;}finally{clearTimeout(timer);}
 }
 async function applyDiscount(){
  if(busy||verifiedPaid||resultOnly||demoReceipt)return;
  const code=typedCode();invalidateDiscount();get('checkout-code').value=code;
  if(!code||!/^[A-Z0-9-]{1,64}$/.test(code)){discountNote=code?'discountFormat':'discountEmpty';discountState='error';render();return;}
  if(!items.length){discountNote='selectFirst';discountState='error';render();return;}
  const version=discountVersion,signature=cartSignature();discountBusy=true;render();
  try{
   const data=await api('/api/discount/validate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code,items})});
   if(version!==discountVersion||signature!==cartSignature()||code!==typedCode())return;
   const validAmount=value=>Number.isSafeInteger(value)&&value>=0;
   if(data.code!==code||!/^promo_[A-Za-z0-9_]{1,200}$/.test(data.promotionCodeId||'')||data.currency!=='eur'||!validAmount(data.subtotal)||!validAmount(data.discountAmount)||!validAmount(data.totalAfterDiscount)||data.subtotal!==subtotalAmount()||data.discountAmount>data.subtotal||data.totalAfterDiscount!==data.subtotal-data.discountAmount||!Number.isInteger(data.percent)||data.percent<1||data.percent>100){discountNote='discountMismatch';discountState='error';return;}
   discount={code,promotionCodeId:data.promotionCodeId,discountAmount:data.discountAmount,subtotal:data.subtotal,totalAfterDiscount:data.totalAfterDiscount,percent:data.percent,signature};
  }catch(error){if(version===discountVersion&&signature===cartSignature()&&code===typedCode()){discountError=error;discountState='error';}}
  finally{if(version===discountVersion){discountBusy=false;render();}}
 }
 get('checkout-code-form').addEventListener('submit',event=>{event.preventDefault();applyDiscount();});
 get('checkout-code').addEventListener('input',()=>{invalidateDiscount(typedCode()?'discountPending':'');render();});
 get('checkout-code-remove').addEventListener('click',()=>{if(busy||verifiedPaid||resultOnly||demoReceipt)return;get('checkout-code').value='';invalidateDiscount();render();get('checkout-code').focus();});
 async function loadCatalog(){const version=++loadVersion;if(!resultOnly)status(text('checking'));try{const data=await api('/api/stripe/status');if(version!==loadVersion)return;catalog=data;render();}catch{if(version!==loadVersion)return;catalog=null;render();}}
 get('checkout-reload').addEventListener('click',loadCatalog);
 get('checkout-pay').addEventListener('click',async()=>{
  if(demoMode()){completeDemo();return;}
  if(!canPay())return;const discountCode=discountMatches()?discount.code:'';const signature=JSON.stringify({items,discountCode});if(!attemptId||attemptSignature!==signature){attemptId=crypto.randomUUID();attemptSignature=signature;}busy=true;saveSelection();render();status(text('opening'));
  try{const data=await api('/api/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({attemptId,items,locale:language(),...(discountCode?{discountCode}:{})})}),url=new URL(data.url);if(data.mode!=='live'||!/^cs_live_[a-zA-Z0-9_]{8,200}$/.test(data.id||'')||url.protocol!=='https:'||url.hostname!=='checkout.stripe.com'||url.username||url.password)throw new Error(text('invalidCheckout'));location.assign(url.href);}
  catch(error){busy=false;if(String(error.code||'').startsWith('discount_')){invalidateDiscount();discountError=error;discountState='error';}render();status(error.message,'error');}
 });
 function result(label,title,message,state=''){const panel=get('checkout-result');panel.hidden=false;panel.dataset.state=state;get('checkout-result-label').textContent=label;get('checkout-result-title').textContent=title;get('checkout-result-message').textContent=message;get('checkout-order-confirmation').hidden=true;}
 async function verifySession(){
  get('checkout-verify-again').hidden=true;result(text('live'),text('verifyTitle'),text('verifyMessage'));
  if(!/^cs_live_[a-zA-Z0-9_]{8,200}$/.test(sessionId||'')){result(text('live'),text('notConfirmed'),text('invalidReturn'));return;}
  try{const data=await api('/api/checkout/session?'+new URLSearchParams({session_id:sessionId}));if(data.id!==sessionId||data.mode!=='live'||data.testMode!==false||data.currency!=='eur'||!Number.isSafeInteger(data.amountTotal)||data.amountTotal<0)throw new Error(text('verificationFailed'));if(data.paid===true&&data.status==='complete'&&(data.paymentStatus==='paid'||data.paymentStatus==='no_payment_required'&&data.amountTotal===0)){verifiedPaid=true;clearPurchasedCart();result(text('live'),text('confirmed'),money(data.amountTotal)+' '+text('confirmedMessage'),'success');render();const order=get('checkout-order-confirmation');order.hidden=false;order.replaceChildren();if(data.orderSaved===true&&/^CR-[A-F0-9]{12}$/.test(data.orderNumber||'')){order.append(el('p',text('orderSaved')),el('p',text('orderNumber')+': '+data.orderNumber,'checkout-receipt-reference'));}else{order.append(el('p',text('orderPending')));get('checkout-verify-again').hidden=false;}status(text('completed'));}else{result(text('live'),text('pendingTitle'),text('pendingMessage'));get('checkout-verify-again').hidden=false;}}
  catch(error){result(text('live'),text('confirmationUnavailable'),error.message);get('checkout-verify-again').hidden=false;}
 }
 get('checkout-verify-again').addEventListener('click',verifySession);
 if(returnStatus==='cancelled')result(text('selection'),text('cancelledTitle'),text('cancelledMessage'));
 addEventListener('cr:privacychange',()=>{if(!direct&&!returning&&!busy){const previous=cartSignature();items=readCart();if(previous!==cartSignature())selectionChanged();render();}});
 addEventListener('cr:languagechange',()=>{render();if(returnStatus==='cancelled')result(text('selection'),text('cancelledTitle'),text('cancelledMessage'));});
 render();loadCatalog();if(returnStatus==='success')verifySession();
})();
