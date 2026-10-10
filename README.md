# Chevalier & Roth — Stripe + Appwrite Function

This folder contains the server-side checkout function. Never put the Stripe secret key in GitHub Pages or in `site-config.js`.

## Appwrite Function
Create a Node.js 22 function in the same Appwrite project.

Suggested settings:
- Runtime: Node.js 22
- Entrypoint: `main.js`
- Execute access: Any
- Build command: `npm install`

Upload/deploy `main.js` and `package.json`.

## Function environment variables
Set these directly in Appwrite:
- `STRIPE_SECRET_KEY` = your Stripe secret key
- `SITE_URL` = `https://stephen6668.github.io/Chevalier-Roth`
- `SHIPPING_LU_CENTS` = your Luxembourg shipping fee in cents
- `SHIPPING_BE_CENTS` = your Belgium shipping fee in cents
- `SHIPPING_FR_CENTS` = your France shipping fee in cents
- `SHIPPING_DE_CENTS` = your Germany shipping fee in cents
- `STRIPE_AUTOMATIC_TAX` = `false` until your Stripe Tax / VAT setup has been reviewed; set to `true` only when configured correctly.

Example: a €6.90 shipping fee is entered as `690`.

## Connect the website
After deployment, Appwrite gives the function a generated HTTPS domain ending in `.appwrite.run`.

Put that URL in:
`site-config.js`

Example:
`stripeCheckoutEndpoint: 'https://xxxxxxxx.fra.appwrite.run'`

## Stripe
Create the Stripe account directly at Stripe and complete the legitimate business / identity verification requested by Stripe. Do not bypass age or identity checks.

## Important
- The function validates product prices server-side, so a visitor cannot change the price in their browser.
- Current server-side promotion support: `WELCOME10` = 10%.
- For a full production backend, add an Appwrite Orders table and a Stripe webhook before treating the website admin as the accounting source of truth.


## Central catalogue / stock update

This function now reads product price and stock from Appwrite table `cr_products` instead of a hard-coded product list.
It also validates discount codes from `cr_codes`.

Appwrite Function scopes required:
- rows.read

The browser checkout payload includes `action: "checkout:create"`.
