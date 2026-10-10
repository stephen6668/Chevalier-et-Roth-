import Stripe from 'stripe';
import crypto from 'node:crypto';
import { Client, TablesDB } from 'node-appwrite';

const DATABASE_ID='6ac7d6740035408079f7';
const PRODUCTS_TABLE='cr_products';
const ORDERS_TABLE='cr_orders';

function orderRowId(sessionId){
  return 'ord_'+crypto.createHash('sha256').update(sessionId).digest('hex').slice(0,28);
}

export default async ({req,res,log,error})=>{
  try{
    if(req.method!=='POST')return res.text('Method not allowed',405);

    const secret=process.env.STRIPE_SECRET_KEY;
    const webhookSecret=process.env.STRIPE_WEBHOOK_SECRET;
    if(!secret||!webhookSecret)return res.text('Stripe webhook not configured',500);

    const stripe=new Stripe(secret,{apiVersion:'2026-03-25.dahlia; custom_checkout_payment_form_preview=v1'});
    const signature=req.headers['stripe-signature'];
    const event=stripe.webhooks.constructEvent(req.bodyBinary,signature,webhookSecret);

    if(event.type!=='checkout.session.completed')return res.text('ok',200);

    const session=event.data.object;
    const rowId=orderRowId(session.id);

    const key=req.headers['x-appwrite-key'];
    const endpoint=process.env.APPWRITE_FUNCTION_API_ENDPOINT||'https://fra.cloud.appwrite.io/v1';
    const project=process.env.APPWRITE_FUNCTION_PROJECT_ID||'6ac779cc001f0d093856';
    const client=new Client().setEndpoint(endpoint).setProject(project).setKey(key);
    const tables=new TablesDB(client);

    try{
      await tables.getRow({databaseId:DATABASE_ID,tableId:ORDERS_TABLE,rowId});
      return res.text('already processed',200);
    }catch(e){
      if(e?.code!==404 && e?.type!=='row_not_found')throw e;
    }

    const lineResult=await stripe.checkout.sessions.listLineItems(session.id,{
      limit:100,
      expand:['data.price.product']
    });

    const soldItems=[];
    for(const line of lineResult.data||[]){
      const product=line.price?.product;
      const meta=product && typeof product==='object' ? (product.metadata||{}) : {};
      const productId=meta.productId;
      if(!productId)continue;

      const qty=Math.max(1,Number(line.quantity||1));
      await tables.decrementRowColumn({
        databaseId:DATABASE_ID,
        tableId:PRODUCTS_TABLE,
        rowId:productId,
        column:'stock',
        value:qty,
        min:0
      });

      soldItems.push({
        productId,
        name:line.description||product.name||productId,
        qty,
        size:meta.size||'',
        color:meta.color||''
      });
    }

    const customerName=session.customer_details?.name||'';
    const email=session.customer_details?.email||session.customer_email||'';
    const total=Number(session.amount_total||0)/100;

    await tables.createRow({
      databaseId:DATABASE_ID,
      tableId:ORDERS_TABLE,
      rowId,
      data:{
        number:'CR-'+session.id.slice(-10).toUpperCase(),
        stripeSessionId:session.id,
        customer:customerName,
        email,
        total,
        status:'paid',
        items:JSON.stringify(soldItems),
        date:new Date().toISOString()
      }
    });

    log(`Order ${session.id} processed; stock updated.`);
    return res.text('ok',200);
  }catch(e){
    error(e?.stack||String(e));
    return res.text(e?.message||'Webhook failed',400);
  }
};
