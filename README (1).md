# Stripe Stock Webhook

Deploy this as a separate Appwrite Node.js 22 function.

## Function scopes
Enable only the database scopes needed to read/write rows:
- rows.read
- rows.write

## Environment variables
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Stripe
In Stripe Workbench / Webhooks, add the function's public `.appwrite.run` domain as an endpoint and subscribe to:

`checkout.session.completed`

After each successful payment:
1. Stripe sends the completed Checkout Session to this webhook.
2. The function reads the paid line items.
3. Appwrite atomically decreases `cr_products.stock` with a minimum of 0.
4. A row is saved in `cr_orders`.
5. When stock reaches 0, the storefront automatically displays SOLD OUT on the next catalogue refresh.

Do not put either Stripe secret in GitHub Pages.
