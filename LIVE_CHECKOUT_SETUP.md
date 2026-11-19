# Live-Checkout – vorbereiteter Stand

## Aktueller Testablauf

Seit 19. November 2026 ist der vollständige Browser-Checkout als ausdrücklich gekennzeichnete Demo aktiv. Auf Wunsch des Betreibers stehen Versandkosten und Service-E-Mail noch nicht fest. Deshalb werden 4,90 € Beispielversand, `service@chevalier-et-roth.example` und ein Demo-Preis von 100 € für die Herrenhose eingesetzt. Diese Werte werden ausschließlich vom Demo-Zweig verwendet und niemals als bestätigter Live-Katalog an Stripe gesendet. Die Demo speichert keine Adressdaten und löst keine E-Mail, Zahlung oder echte Bestellung aus.

Der Livebetrieb bleibt an die unten genannten tatsächlichen Verbindungen gebunden. Bei der aktuellen Prüfung war der Stripe-Live-Schlüssel im Hosting bereits als Secret hinterlegt; Webhook-Signaturschlüssel und Appwrite-Serverschlüssel fehlten. Das Hosting ist weiterhin eigentümerprivat. Die Stripe-App verlangte eine erneute Anmeldung. Eine echte End-to-End-Zahlung wurde daher nicht ausgelöst oder als erfolgreich behauptet.


Die Website enthält eine funktionierende Preisvorschau und einen technisch vorbereiteten Live-Checkout. Die produktive Zahlungsannahme bleibt gesperrt, bis die unten genannten tatsächlichen Verbindungen bestätigt sind. Ein verbundenes Stripe-Konto über die Chat-Anwendung liefert der Website keinen Server-Schlüssel.

## Bestätigt

- Händlerkonto: `acct_1UP2TOKqnO4wSRwR`, Chevalier et Roth, Luxemburg; Zahlungen und Auszahlungen freigeschaltet.
- Produktpreise: Half-Zip 110 €, Body 90 €, Hose 100 €. Der Warenwert bleibt unverändert.
- Der Betreiber hat erklärt, derzeit nicht mehrwertsteuerregistriert zu sein. Die 17%-Aufteilung ist deshalb ausschließlich eine ausdrücklich beschriftete Rechenvorschau. Es werden weder `automatic_tax` noch tatsächliche Steuersätze aktiviert.
- Geplant ist POST Luxembourg als Versanddienstleister für Europa. Bestätigte Paketgewichte, Verpackungsdaten und endgültige Versandpreise stehen noch aus. Die Website stellt fehlende Versandkosten nicht als kostenlosen Versand dar.
- Bestätigte Zusammensetzungen (19. November 2026): Half-Zip und Body je 47 % Baumwolle, 47 % Modal, 6 % Elasthan; Herrenhose 96 % Baumwolle, 4 % Elasthan; Damenhose 65 % Viskose, 30 % Polyamid, 5 % Elasthan. Die Größentabellen sind hinterlegt; verbindliche Pflegehinweise stehen noch aus.

## Bereits im Stripe-Konto vorhandene Live-Links

| Angebot | Preis | Bestehender Link |
| --- | ---: | --- |
| Half-Zip | 110 € | https://buy.stripe.com/dRmfZiefe6dLanufawabK03 |
| Body | 90 € | https://buy.stripe.com/9B6aEY4EEau17bi0fCabK02 |
| Hose | 100 € | https://buy.stripe.com/dRmeVe3AA6dLdzGd2oabK01 |
| Je ein Produkt | 300 € | https://buy.stripe.com/aFa14oefe6dLeDK4vSabK00 |

Diese Links sind echte bestehende Zahlungsseiten. Bei der Prüfung enthielten sie weder Farb-/Größenfelder noch eine Lieferadressabfrage. Sie sind kein Ersatz für eine beliebige Warenkorbauswahl mit verschiedenen Varianten und Mengen. Die Website leitet deshalb keinen solchen Warenkorb auf einen unpassenden Festlink um.

## Notwendige Serververbindung

1. Einen eingeschränkten Stripe-Live-Schlüssel im Secrets-Speicher des Hostings hinterlegen, nicht im Chat, Quellcode oder GitHub. Die Anbindung benötigt die tatsächlich verwendeten Checkout-, Produkt-/Preis- und Kontolese-Rechte. Anleitung: https://docs.stripe.com/keys#manage-your-api-keys .
2. Ein öffentlich erreichbares Backend für den Shop und Stripe-Ereignisse bereitstellen. Die aktuelle Sites-Vorschau ist nur für den Eigentümer zugänglich; ihr Zugang wurde nicht geändert. GitHub Pages führt selbst keine Server-API aus. Einen privaten Zugangstoken niemals ins Frontend übernehmen.
3. Einen Stripe-Webhook auf `/api/stripe/webhook` für `checkout.session.completed`, `checkout.session.async_payment_succeeded` und `checkout.session.async_payment_failed` einrichten. Den Signaturschlüssel als `STRIPE_WEBHOOK_SECRET` speichern. Die Implementierung prüft Signatur, Zeitfenster, Modus, Händler und den tatsächlichen Zahlungsstatus.
4. Einen passenden Appwrite-Serverzugang mit minimalen benötigten Rechten als `APPWRITE_SERVER_KEY` speichern. Die vorhandene Bestelltabelle und ihre Spalten müssen vor der Freigabe gegen das Schema in `worker/stripe.mjs` geprüft werden. Die Speicherung ist über die Stripe-Session-ID idempotent; Fehler werden für erneute Zustellversuche gemeldet.
5. Lieferländer und Versandpreis anhand der bestätigten Paketdaten konfigurieren. Erst danach `shippingConfirmed:true` setzen.

Der Server erwartet zusätzlich `STRIPE_CHECKOUT_MODE=live`, `STRIPE_EXPECTED_ACCOUNT=acct_1UP2TOKqnO4wSRwR`, `STRIPE_PUBLIC_BACKEND=true` und `STRIPE_FULFILLMENT_CONFIRMED=true`. Die letzten beiden Freigaben dürfen erst nach tatsächlicher Prüfung gesetzt werden. Der öffentliche Status nennt die noch fehlenden Voraussetzungen, ohne Schlüssel oder Kundendaten offenzulegen. `STRIPE_STOREFRONT_URL` kann auf die vorhandene GitHub-Pages-Adresse zeigen; nur diese ausdrücklich erlaubte Herkunft erhält CORS-Zugriff.

Zahlungen werden nicht allein durch einen Erfolgsparameter im Browser bestätigt. Bestellungen entstehen ausschließlich nach bestätigten Stripe-Daten über den geprüften Ereigniseingang. Eine vollständige Live-Freigabe setzt außerdem die tatsächlichen Geschäfts-, Liefer- und Produktangaben voraus.

## Ergänzung: synchronisierte Rabattcodes

Admin-Verwaltung und Checkout-Rabatte sind in `DISCOUNT_CODES.md` dokumentiert. Der vorhandene Hosting-Schlüssel benötigt zusätzlich die tatsächlich genutzten Rechte für Coupons und Promotion Codes. Die serverseitige Adminprüfung verwendet kurzlebige Appwrite-JWTs und die konfigurierte Admin-Team-ID; dafür ist kein neuer privilegierter Browser-Schlüssel nötig. Rabattverwaltung und Codeprüfung öffnen die produktive Zahlungsannahme nicht automatisch.
