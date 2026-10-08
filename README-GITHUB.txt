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
