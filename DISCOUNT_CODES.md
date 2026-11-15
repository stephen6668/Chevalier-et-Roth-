# Rabattcodes und Administration

Die geschützte Verwaltung liegt unter `admin.html` und ist über „Administration“ im Footer erreichbar. Anmeldung und Berechtigung verwenden das vorhandene Appwrite-Konto und die bestätigte Mitgliedschaft im bestehenden Admin-Team.

## Bedienung

1. In der Administration „Rabattcodes · Stripe“ öffnen.
2. Einen Code mit Buchstaben, Ziffern oder Bindestrichen, den prozentualen Rabatt und gegebenenfalls Mindestbestellwert, Enddatum und Einlösungslimit anlegen.
3. „Code bei Stripe aktiv“ auswählen und speichern. Die Oberfläche meldet Erfolg erst nach Bestätigung durch Stripe. Aktivieren und Deaktivieren bestehender Codes wirkt direkt auf den jeweiligen Stripe-Promotion-Code.

Im Checkout wird ein Code einmal eingegeben und mit „Anwenden“ bestätigt. Der Server prüft den aktuellen Stripe-Status, Bedingungen und Warenkorbpreise. Die Zahlungsanfrage enthält anschließend nur den Code; der Server prüft ihn erneut und übergibt die passende Promotion-Code-ID über `discounts[0][promotion_code]` an Stripe Checkout. Kunden müssen ihn dort nicht erneut eingeben. Ein ungültiger Code wird nicht stillschweigend als Vollpreiszahlung fortgesetzt.

Diese Verwaltung unterstützt globale Prozentcodes von 1 bis 100 %. Aktivierte Codes gelten sofort; zukünftige Starttermine zunächst als inaktive Entwürfe speichern. Stripe zählt Einlösungen selbst. Frühere Appwrite-Einträge werden nicht automatisch aktiviert, gelöscht oder überschrieben. Codes mit Produkt-/Kategoriebedingungen oder bereits vorhandenen Appwrite-Einlösungen werden nicht als neue globale Stripe-Codes importiert.

## Technische Verbindung

- `STRIPE_SECRET_KEY` bleibt ausschließlich im Hosting-Secret gespeichert. Für Rabattverwaltung sind Konto-Leserechte sowie die erforderlichen Lese-/Schreibrechte für Coupons und Promotion Codes nötig.
- `STRIPE_EXPECTED_ACCOUNT` bindet die Verbindung an das bestehende Händlerkonto. Test- und Live-Modus bleiben getrennt.
- `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID` und `APPWRITE_ADMIN_TEAM_ID` sind vertrauenswürdige Serverkonfiguration. Sie enthalten keine geheimen Schlüssel.
- Jede Adminanfrage verwendet einen neu angeforderten kurzlebigen Appwrite-JWT. Der Server prüft das Konto und die bestätigte Teammitgliedschaft selbst. Ein sichtbarer Adminbereich oder eine Browservariable reicht nicht aus.
- `GET /api/admin/codes` liest die verwalteten Stripe-Codes. `POST /api/admin/codes` speichert sie. `POST /api/discount/validate` prüft einen Kundencode. Alle Antworten werden ohne Cache ausgeliefert.
- GitHub Pages führt keine Server-API aus. Rabattverwaltung erfolgt auf der gehosteten Website; der bestehende private Zugriff wird durch diese Änderung nicht erweitert.

Ein Code-Speichern erzeugt keine Bestellung und löst keine Zahlung aus. Die vorhandenen Freigaben für Livezahlungen (Versand, Webhook, Bestellspeicherung und öffentliche Erreichbarkeit) bleiben bestehen. Die vollständige Zahlungsfreigabe ist in `LIVE_CHECKOUT_SETUP.md` beschrieben.

Stripe-Referenzen: [Promotion Codes](https://docs.stripe.com/api/promotion_codes), [Checkout-Rabatte](https://docs.stripe.com/payments/checkout/discounts).
