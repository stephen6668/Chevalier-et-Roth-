# Chevalier & Roth — Simple GitHub Pages Website

This version is intentionally plain static HTML/CSS/JavaScript so GitHub Pages does not need to build anything.

## IMPORTANT: do not use GitHub Actions for this version

1. Upload ALL files from this folder directly into the ROOT of your repository.
2. Make sure `index.html` is directly visible in the repository root.
3. GitHub → Settings → Pages.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Branch: `main`
6. Folder: `/ (root)`
7. Save.

There is no `.github/workflows` folder in this package.

## Admin demo login
Email: admin@chevalier-roth.lu
Password: CR-Demo-2026

Important: because GitHub Pages is public static hosting, this password is not secure for a production shop. Admin changes are stored in your current browser only.

## Product images
Upload your JPG/PNG/WebP files to the repository root or create an `images` folder.
Then enter paths such as:
- images/polo-1.jpg
- images/polo-2.jpg

in the Admin product editor.


## Bilder sofort anzeigen

Lege deine Bilder in den Ordner `images/`.
Die vier Standardprodukte sind bereits mit festen Bildpfaden verbunden.

Beispiel:
`images/signature-polo-navy-01.jpg`

Die Produktbilder werden direkt auf der Startseite und im Shop angezeigt. Man muss das Produkt nicht erst öffnen.

Falls du die alte Website schon einmal im Browser geöffnet hattest:
- Windows: Strg + F5
- oder Browser-Cache für die Seite löschen

Die Website aktualisiert außerdem alte gespeicherte Produktdaten automatisch, falls dort vorher keine Bildpfade hinterlegt waren.


APPWRITE LOGIN / REGISTRATION
-----------------------------
Project ID: 6ac779cc001f0d093856
Endpoint: https://fra.cloud.appwrite.io/v1

In Appwrite Console you must add your GitHub Pages domain as a Web platform.
Example hostname: stephen6668.github.io
Also enable Email/Password authentication.

The customer Account page now supports registration, login and logout through Appwrite.

WAITLIST
--------
Every product card and product page has a JOIN WAITLIST button.
For now, the selected products are stored in the signed-in user's Appwrite account preferences. This works across devices for that user.
To create one central admin list of all waiting customers, create an Appwrite Database/Table for the waitlist and provide its database/table ID so the site can write entries there.


APPWRITE LOGIN DEBUG UPDATE
---------------------------
Die Login- und Registrierungsformulare validieren E-Mail/Passwort jetzt vor dem Request.
Appwrite-Fehler werden unter dem Formular mit Fehler-Typ, Code und Originalmeldung angezeigt.
Zusätzlich erscheint der vollständige Fehler mit F12 -> Console.

Wenn ein CORS-/Domainfehler erscheint, in Appwrite die GitHub-Pages-Domain als Web Platform hinzufügen.


APPWRITE: "Creating account..." bleibt hängen
----------------------------------------------
Diese Version beendet Appwrite-Anfragen automatisch nach 15 Sekunden und zeigt dann einen verständlichen Fehler.

Auf account.html erscheint oben ein Verbindungstest.
Wenn dort "Appwrite-Verbindung fehlgeschlagen" steht:
1. Appwrite Console öffnen.
2. Dein Projekt öffnen.
3. Platforms / Add platform / Web.
4. Als Hostname exakt den auf der Website angezeigten Hostnamen eintragen.
   Für GitHub Pages meistens: stephen6668.github.io
5. Speichern.
6. GitHub-Seite mit Strg+F5 neu laden.

Project ID:
6ac779cc001f0d093856

Endpoint:
https://fra.cloud.appwrite.io/v1


EMAIL FIX
---------
Die frühere E-Mail-Prüfung hatte einen Fehler im regulären Ausdruck. Diese Version akzeptiert normale gültige E-Mail-Adressen wie name@gmail.com korrekt.

ADMIN WAITLIST
--------------
admin.html enthält jetzt eine Wartelisten-Tabelle.
Bei der reinen GitHub-Pages-Version kann sie nur Einträge aus demselben Browser anzeigen.
Für eine echte zentrale Liste aller Besucher benötigen wir Appwrite Database + Collection + sichere Admin-Berechtigungen.


=================================================
ECHTE APPWRITE-WARTELISTE + APPWRITE-ADMIN
=================================================

Eingetragene IDs:
Project ID: 6ac779cc001f0d093856
Database ID: 6ac7d6740035408079f7
Waitlist Table ID: 6ac7d6e1002f38269b6a
Admin Team ID: 6ac7d7fc0029522fc7bf

WAITLIST TABLE – benötigte Columns:
userId       Varchar/Text   required
name         Varchar/Text   required
email        Email oder Varchar/Text required
productId    Varchar/Text   required
productName  Varchar/Text   required
size         Varchar/Text   optional
color        Varchar/Text   optional
status       Varchar/Text   required, default "waiting"

$createdAt wird automatisch von Appwrite angelegt.

TABLE SETTINGS:
1. Row security: ON
2. Permissions:
   - Users / authenticated users: CREATE
   - Admin Team 6ac7d7fc0029522fc7bf: READ, UPDATE, DELETE
   - Normale Kunden NICHT global READ geben.

ADMIN:
Dein echtes Admin-Konto muss in Appwrite Auth existieren und Mitglied im Team
6ac7d7fc0029522fc7bf sein. admin.html prüft diese Team-Mitgliedschaft.

KUNDEN:
Kunden müssen eingeloggt sein, bevor sie sich auf die Warteliste setzen.
Beim Eintragen wird eine echte Row in TablesDB angelegt.
Im Kundenkonto bleibt zusätzlich eine kleine persönliche Liste in Appwrite Preferences gespeichert,
damit der Kunde seine eigenen Einträge bequem sehen und entfernen kann.

SICHERHEIT:
Kein API-Key und kein Admin-Passwort ist im GitHub-Code gespeichert.


APPWRITE AUTH SYNTAX FIX
-----------------------
Die Registrierung und der Login wurden für das eingebundene Appwrite Web SDK v17 korrigiert.

Wichtig:
account.create(...) verwendet jetzt:
account.create(ID.unique(), email, password, name)

Login verwendet:
account.createEmailPasswordSession(email, password)

Der Fehler "Missing required parameter: email" entstand, weil vorher ein Objekt an eine SDK-Version übergeben wurde,
die an dieser Stelle Positionsparameter erwartet.

Nach dem Upload auf GitHub: Strg + F5.


TABLESDB FIX
------------
Fehler:
"Appwrite.TablesDB is not a constructor"
oder
"Cannot read properties of null (reading createRow)"

Ursache:
Die Website hat vorher Appwrite Web SDK 17.0.0 geladen. Diese alte Browser-Version enthält TablesDB nicht.
Die Website lädt jetzt Appwrite Web SDK 27.0.0.

Nach dem Hochladen auf GitHub:
1. Alle neuen Dateien ersetzen.
2. GitHub Pages kurz warten lassen.
3. Website mit STRG + F5 neu laden.
4. Falls nötig Browser-Cache für stephen6668.github.io löschen.

Die Konto-Seite zeigt jetzt zusätzlich:
TablesDB: OK

Erst wenn dort "TablesDB: OK" steht, sollte die echte Warteliste getestet werden.
