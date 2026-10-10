import Stripe from 'stripe';

const PRODUCTS = {
  p1: { name: 'Heritage Half-Zip', unitAmount: 11000 },
  p2: { name: 'Heritage Men’s Trouser', unitAmount: 10000 },
  p3: { name: 'Maison Women’s Cardigan', unitAmount: 9000 },
  p4: { name: 'Maison Women’s Trouser', unitAmount: 10000 }
};

const COUNTRY_NAMES = {
  LU: 'Luxembourg',
  BE: 'Belgium',
  FR: 'France',
  DE: 'Germany'
};

function shippingFor(country){
  const key='SHIPPING_'+country+'_CENTS';
  const raw=process.env[key];
  if(raw === undefined || raw === ''){
    throw new Error(`Missing function environment variable ${key}`);
  }
  const cents=Number(raw);
  if(!Number.isInteger(cents) || cents < 0){
    throw new Error(`Invalid shipping amount in ${key}`);
  }
  return cents;
}

export default async ({ req, res, log, error }) => {
  try{
    if(req.method !== 'POST'){
      return res.json({ error: 'Method not allowed' }, 405);
    }

    const stripeSecret=process.env.STRIPE_SECRET_KEY;
    const siteUrl=(process.env.SITE_URL || 'https://stephen6668.github.io/Chevalier-Roth').replace(/\/$/,'');
    if(!stripeSecret){
      return res.json({ error: 'Stripe is not configured on the server.' }, 500);
    }

    const stripe=new Stripe(stripeSecret, { apiVersion: '2026-03-25.dahlia; custom_checkout_payment_form_preview=v1' });
    const payload=typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const cart=Array.isArray(payload.cart) ? payload.cart : [];
    const customer=payload.customer || {};

    if(!cart.length) return res.json({ error: 'Cart is empty.' }, 400);
    if(!customer.email || !customer.firstName || !customer.lastName) return res.json({ error: 'Missing customer details.' }, 400);
    if(!['LU','BE','FR','DE'].includes(customer.country)) return res.json({ error: 'Unsupported delivery country.' }, 400);

    const discountCode=String(payload.discountCode||'').trim().toUpperCase();
    const discountRate=discountCode === 'WELCOME10' ? 0.10 : 0;

    const VAT_RATE=0.17;
    const lineItems=[];
    let taxableNetCents=0;
    for(const item of cart){
      const product=PRODUCTS[item.id];
      const qty=Math.max(1,Math.min(20,Number(item.qty)||1));
      if(!product) return res.json({ error: 'Invalid product in cart.' }, 400);

      const discountedAmount=Math.round(product.unitAmount*(1-discountRate));
      taxableNetCents += discountedAmount * qty;
      lineItems.push({
        quantity: qty,
        price_data: {
          currency: 'eur',
          unit_amount: discountedAmount,
          product_data: {
            name: product.name,
            description: `${String(item.size||'')} · ${String(item.color||'')} · VAT added at checkout`.slice(0,240)
          }
        }
      });
    }

    const shippingCents=shippingFor(customer.country);
    if(shippingCents > 0){
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: shippingCents,
          product_data: {
            name: `Shipping · ${COUNTRY_NAMES[customer.country]}`
          }
        }
      });
    }

    const vatCents=Math.round(taxableNetCents*VAT_RATE);
    if(vatCents > 0){
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: vatCents,
          product_data: {
            name: 'VAT (17%)'
          }
        }
      });
    }

    const session=await stripe.checkout.sessions.create({
      ui_mode: 'custom',
      mode: 'payment',
      line_items: lineItems,
      billing_address_collection: 'auto',
      phone_number_collection: { enabled: false },
      automatic_tax: { enabled: false },
      submit_type: 'auto',
      shipping_address_collection: {
        allowed_countries: [
          'AD','AL','AT','AX','BA','BE','BG','BY','CH','CZ','DE','DK','EE','ES',
          'FI','FO','FR','GB','GG','GI','GR','HR','HU','IE','IM','IS','IT','JE',
          'LI','LT','LU','LV','MC','MD','ME','MK','MT','NL','NO','PL','PT','RO',
          'RS','RU','SE','SI','SJ','SK','SM','UA','VA'
        ]
      },
      name_collection: {
        individual: {
          enabled: true,
          optional: true
        }
      },
      saved_payment_method_options: {
        payment_method_save: 'enabled'
      },
      integration_identifier: 'custom_embedded_web_0002'
    });

    log(`Created Stripe Checkout Session ${session.id}`);
    return res.json({ client_secret: session.client_secret }, 200);
  }catch(e){
    error(e?.stack || String(e));
    return res.json({ error: e?.message || 'Checkout failed.' }, 500);
  }
};
