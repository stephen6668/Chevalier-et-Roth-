window.CRSiteConfig = {
  brandName: 'Chevalier & Roth',
  currency: 'EUR',

  // Luxembourg standard VAT. Prices on the website are gross prices.
  vatRate: 0.17,
  pricesIncludeVat: true,

  // REQUIRED BEFORE PUBLIC SALES — replace with verified business data.
  legalName: '[ENTER LEGAL COMPANY / TRADER NAME]',
  legalForm: '[ENTER LEGAL FORM]',
  registeredAddress: '[ENTER REGISTERED BUSINESS ADDRESS]',
  returnAddress: '[ENTER RETURN ADDRESS]',
  phone: '[ENTER BUSINESS PHONE]',
  email: '[ENTER BUSINESS EMAIL]',
  registrationNumber: '[ENTER RCS / REGISTRATION NUMBER]',
  vatNumber: '[ENTER VAT NUMBER]',
  businessPermit: '[ENTER BUSINESS PERMIT NUMBER IF APPLICABLE]',

  // Public sales settings
  shippingCountries: ['Luxembourg', 'Belgium', 'France', 'Germany'],
  deliveryEstimate: '[ENTER DELIVERY TIME, e.g. 3–7 business days]',

  // Central Appwrite commerce tables. Create these exact custom IDs once.
  commerceDatabaseId: '6ac7d6740035408079f7',
  productTableId: 'cr_products',
  codeTableId: 'cr_codes',
  orderTableId: 'cr_orders',

  // Stripe publishable key for the embedded Checkout form (safe to expose in the browser).
  stripePublishableKey: '',

  // Stripe Checkout will be called through an Appwrite Function domain.
  // Example: https://xxxxxxxx.fra.appwrite.run
  stripeCheckoutEndpoint: '',

  // Website URL used by the Stripe function for success/cancel redirects.
  siteUrl: 'https://stephen6668.github.io/Chevalier-Roth'
};
