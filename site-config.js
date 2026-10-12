window.CRSiteConfig = {
  brandName: 'Chevalier & Roth',
  currency: 'EUR',

  // Luxembourg standard VAT. Product and set prices are shown before VAT; VAT is added to the final total.
  vatRate: 0.17,
  pricesIncludeVat: false,

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
  // Ordering is temporarily disabled while the first collection is being prepared.
  orderingEnabled: false,
  currentCollectionProductIds: ['p1', 'p2', 'p3'],
  shippingCountries: ['Luxembourg', 'Belgium', 'France', 'Germany'],
  deliveryEstimate: '[ENTER DELIVERY TIME, e.g. 3–7 business days]',

  // Appwrite connection used by the public giveaway, waitlist and admin.
  appwriteEndpoint: 'https://fra.cloud.appwrite.io/v1',
  appwriteProjectId: '6ac779cc001f0d093856',

  // Central Appwrite commerce tables. Create these exact custom IDs once.
  commerceDatabaseId: '6ac7d6740035408079f7',
  productTableId: 'cr_products',
  codeTableId: 'cr_codes',
  orderTableId: 'cr_orders',
  giveawayTableId: 'cr_giveaway',


  // Giveaway social profiles. Replace these two URLs if your real handles are different.
  tiktokUrl: 'https://www.tiktok.com/@chevalierandroth',
  instagramUrl: 'https://www.instagram.com/chevalierandroth/',

  // First collection launch + giveaway draw (Luxembourg time).
  launchAt: '2027-01-02T00:00:00+01:00',

  // Stripe publishable key for the embedded Checkout form (safe to expose in the browser).
  stripePublishableKey: '',

  // Stripe Checkout will be called through an Appwrite Function domain.
  // Example: https://xxxxxxxx.fra.appwrite.run
  stripeCheckoutEndpoint: '',

  // Website URL used by the Stripe function for success/cancel redirects.
  siteUrl: 'https://stephen6668.github.io/Chevalier-et-Roth-'
};
