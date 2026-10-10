# Stripe Integration TODO

This file is the single source of truth for the remaining Stripe setup.

## Values to Replace

The following values are placeholders and must be updated before going live.

**Files containing placeholders:**
- [site-config.js](site-config.js)

| Field | Current Value | What to Set |
|---|---|---|
| `stripePublishableKey` | empty string | Your Stripe publishable key, for example a `pk_test_...` key while testing. |
| `stripeCheckoutEndpoint` | empty string | The public HTTPS domain of the deployed Appwrite Stripe function, for example `https://xxxxxxxx.fra.appwrite.run`. |

There are **no sample-only placeholders** in `mode` or `line_items`: the existing integration already uses one-time payments (`mode: "payment"`) and builds real line items from the Chevalier & Roth server-side product catalogue.

## Configured Parameters

These parameters were configured in Checkout Studio and are already set in the existing Checkout Session creation call.

**Files containing these parameters:**
- [stripe-appwrite-function/main.js](stripe-appwrite-function/main.js)

| Parameter | Value |
|---|---|
| `ui_mode` | `custom` because the installed Stripe SDK is `^18.0.0` (below 21.0.0) |
| `mode` | `payment` |
| `billing_address_collection` | `auto` |
| `phone_number_collection.enabled` | `false` |
| `automatic_tax.enabled` | `false` |
| `submit_type` | `auto` |
| `shipping_address_collection.allowed_countries` | AD, AL, AT, AX, BA, BE, BG, BY, CH, CZ, DE, DK, EE, ES, FI, FO, FR, GB, GG, GI, GR, HR, HU, IE, IM, IS, IT, JE, LI, LT, LU, LV, MC, MD, ME, MK, MT, NL, NO, PL, PT, RO, RS, RU, SE, SI, SJ, SK, SM, UA, VA |
| `name_collection.individual.enabled` | `true` |
| `name_collection.individual.optional` | `true` |
| `saved_payment_method_options.payment_method_save` | `enabled` |
| `integration_identifier` | `custom_embedded_web_0002` |
| `payment_method_collection` | omitted because this integration uses `mode: "payment"` |

The Stripe server client also uses:
`2026-03-25.dahlia; custom_checkout_payment_form_preview=v1`

## Setup and Next Steps

### 1. Stripe keys

In Stripe test mode, copy your publishable key into `site-config.js`:

```js
stripePublishableKey: 'pk_test_...'
```

Store the Stripe **secret** key only in the Appwrite Function environment:

```text
STRIPE_SECRET_KEY=sk_test_...
```

Never put `STRIPE_SECRET_KEY` into GitHub Pages or browser JavaScript.

### 2. Deploy the Appwrite Function

Deploy:
- `stripe-appwrite-function/main.js`
- `stripe-appwrite-function/package.json`

The function uses the existing Stripe dependency:

```text
stripe ^18.0.0
```

Keep these existing function environment variables configured:
- `STRIPE_SECRET_KEY`
- `SHIPPING_LU_CENTS`
- `SHIPPING_BE_CENTS`
- `SHIPPING_FR_CENTS`
- `SHIPPING_DE_CENTS`

`SITE_URL` can remain configured for other project use, although the embedded form no longer uses Checkout redirect URLs.

### 3. Connect the function to the website

After the Appwrite Function is deployed, copy its public `.appwrite.run` domain into:

```js
stripeCheckoutEndpoint: 'https://xxxxxxxx.fra.appwrite.run'
```

in `site-config.js`.

The function must allow execution from the public storefront because customers create payment sessions from the checkout page.

### 4. How the integration works

1. The customer reviews the order and enters the delivery details.
2. The browser sends the current cart and customer details to the Appwrite Function.
3. The function validates product IDs and prices server-side.
4. The function creates a Stripe Checkout Session and returns only `client_secret`.
5. The page initializes Stripe with the required Checkout Form beta flag.
6. Stripe renders the secure payment form in the `#checkout-form` iframe container.
7. Stripe's Checkout Form SDK handles payment confirmation.

### 5. Test mode

Use Stripe test mode first. A standard successful Stripe test card is:

```text
4242 4242 4242 4242
Any future expiry date
Any 3-digit CVC
Any valid postal code
```

For 3D Secure testing, a commonly used Stripe test card is:

```text
4000 0025 0000 3155
```

Do not use real card details while the integration is in test mode.

### 6. Before live payments

- Complete Stripe's legitimate identity/business verification.
- Do not bypass age, identity, or business verification requirements.
- Replace `pk_test_...` / `sk_test_...` with the corresponding live keys only after testing.
- Confirm your real shipping prices.
- Test successful payment, failed payment, cancellation and refund flows.
- Add production order persistence / fulfillment tracking before treating the website admin as the accounting source of truth.
- Consider a Stripe webhook for authoritative payment-completed fulfillment and order-status updates.
- Keep product prices server-side as the source of truth.

## Project Structure of Stripe Files

- [checkout.html](checkout.html) — embedded Stripe payment form
- [site-config.js](site-config.js) — publishable key and Appwrite Function URL
- [stripe-appwrite-function/main.js](stripe-appwrite-function/main.js) — server-side Checkout Session creation
- [stripe-appwrite-function/package.json](stripe-appwrite-function/package.json) — Stripe SDK dependency
- [STRIPE_INTEGRATION_TODO.md](STRIPE_INTEGRATION_TODO.md) — this setup checklist

## Resources

- https://support.stripe.com
- https://docs.stripe.com/mcp
