import Stripe from 'stripe';
import { Client, TablesDB, Query } from 'node-appwrite';

const DATABASE_ID='6ac7d6740035408079f7';
const PRODUCTS_TABLE='cr_products';
const CODES_TABLE='cr_codes';

function cors(origin='https://stephen6668.github.io'){
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, x-appwrite-user-jwt',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
}
function parseList(v){try{const x=JSON.parse(v||'[]');return Array.isArray(x)?x:[]}catch{return[]}}
function activeCode(c){
  if(!c?.active)return false;
  const today=new Date().toISOString().slice(0,10);
  if(c.start && today<c.start)return false;
  if(c.end && today>c.end)return false;
  if(Number(c.maxUses||0)>0 && Number(c.uses||0)>=Number(c.maxUses||0))return false;
  return true;
}

export default async ({ req, res, log, error }) => {
  const headers=cors();
  if(req.method==='OPTIONS') return res.empty(204,headers);

  try{
    if(req.method!=='POST') return res.json({error:'Method not allowed'},405,headers);

    const key=req.headers['x-appwrite-key'];
    const endpoint=process.env.APPWRITE_FUNCTION_API_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
    const project=process.env.APPWRITE_FUNCTION_PROJECT_ID || '6ac779cc001f0d093856';
    const client=new Client().setEndpoint(endpoint).setProject(project).setKey(key);
    const tables=new TablesDB(client);

    const payload=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    const action=payload.action||'checkout:create';
    const cart=Array.isArray(payload.cart)?payload.cart:[];
    const discountCode=String(payload.discountCode||'').trim().toUpperCase();

    async function loadCart(){
      if(!cart.length) throw new Error('Cart is empty.');
      const items=[];
      for(const item of cart){
        const p=await tables.getRow({databaseId:DATABASE_ID,tableId:PRODUCTS_TABLE,rowId:String(item.id)});
        const qty=Math.max(1,Math.min(20,Number(item.qty)||1));
        if(p.active===false) throw new Error(`${p.name} is not available.`);
        if(Number(p.stock||0)<qty) throw new Error(`${p.name} has only ${p.stock} item(s) left.`);
        items.push({item,p,qty});
      }
      return items;
    }

    async function getDiscount(items){
      if(!discountCode)return null;
      const result=await tables.listRows({
        databaseId:DATABASE_ID,tableId:CODES_TABLE,
        queries:[Query.equal('code',[discountCode]),Query.limit(1)]
      });
      const c=result.rows?.[0];
      if(!c || !activeCode(c))return null;
      const subtotal=items.reduce((s,x)=>s+Number((x.p.salePrice>0?x.p.salePrice:x.p.price)||0)*x.qty,0);
      if(subtotal<Number(c.minOrder||0))return null;
      return c;
    }

    if(action==='discount:validate'){
      const items=await loadCart();
      const c=await getDiscount(items);
      if(!c)return res.json({ok:false,message:'Code is invalid or not active.'},200,headers);
      return res.json({ok:true,code:c.code,percent:Number(c.percent||0)},200,headers);
    }

    const stripeSecret=process.env.STRIPE_SECRET_KEY;
    if(!stripeSecret)return res.json({error:'Stripe is not configured on the server.'},500,headers);
    const stripe=new Stripe(stripeSecret,{apiVersion:'2026-03-25.dahlia; custom_checkout_payment_form_preview=v1'});

    const customer=payload.customer||{};
    if(!customer.email||!customer.firstName||!customer.lastName)return res.json({error:'Missing customer details.'},400,headers);

    const items=await loadCart();
    const code=await getDiscount(items);
    const allowedProducts=code?parseList(code.products):[];
    const allowedCategories=code?parseList(code.categories):[];

    const VAT_RATE=0.17;
    let taxableNetCents=0;
    const lineItems=[];

    for(const {item,p,qty} of items){
      const base=Number((p.salePrice>0?p.salePrice:p.price)||0);
      let eligible=!!code;
      if(eligible && allowedProducts.length && !allowedProducts.includes(p.$id))eligible=false;
      if(eligible && allowedCategories.length && !allowedCategories.includes(p.category))eligible=false;
      const rate=eligible?Number(code.percent||0)/100:0;
      const netCents=Math.round(base*100*(1-rate));
      taxableNetCents+=netCents*qty;

      lineItems.push({
        quantity:qty,
        price_data:{
          currency:'eur',
          unit_amount:netCents,
          product_data:{
            name:p.name,
            description:`${String(item.size||'')} · ${String(item.color||'')} · VAT added at checkout`.slice(0,240),
            metadata:{
              productId:p.$id,
              size:String(item.size||'').slice(0,80),
              color:String(item.color||'').slice(0,80)
            }
          }
        }
      });
    }

    const vatCents=Math.round(taxableNetCents*VAT_RATE);
    if(vatCents>0){
      lineItems.push({quantity:1,price_data:{currency:'eur',unit_amount:vatCents,product_data:{name:'VAT (17%)'}}});
    }

    const session=await stripe.checkout.sessions.create({
      ui_mode:'custom',
      mode:'payment',
      line_items:lineItems,
      billing_address_collection:'auto',
      phone_number_collection:{enabled:false},
      automatic_tax:{enabled:false},
      submit_type:'auto',
      shipping_address_collection:{
        allowed_countries:['AD','AL','AT','AX','BA','BE','BG','BY','CH','CZ','DE','DK','EE','ES','FI','FO','FR','GB','GG','GI','GR','HR','HU','IE','IM','IS','IT','JE','LI','LT','LU','LV','MC','MD','ME','MK','MT','NL','NO','PL','PT','RO','RS','RU','SE','SI','SJ','SK','SM','UA','VA']
      },
      name_collection:{individual:{enabled:true,optional:true}},
      saved_payment_method_options:{payment_method_save:'enabled'},
      integration_identifier:'custom_embedded_web_0002'
    });

    log(`Created checkout ${session.id}`);
    return res.json({client_secret:session.client_secret},200,headers);
  }catch(e){
    error(e?.stack||String(e));
    return res.json({error:e?.message||'Checkout failed.'},500,headers);
  }
};
