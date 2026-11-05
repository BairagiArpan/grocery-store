HEAD

# grocery-store

# Sri Krishna Enterprise

Mobile-first grocery catalogue with a private mobile admin panel.

## Features in this starter

- Customer catalogue with search, category filters and product details
- INR pricing and stock display
- Phone, WhatsApp and email contact links (configured in Admin > Store settings)
- Customer reviews submitted as `pending`; only approved reviews are public
- Admin email/password login
- Admin product create, edit, delete, stock and visibility controls
- Product image upload to Firebase Storage
- Store name, tagline, contact details, hero image and logo URL settings
- Firestore and Storage security rules

## 1. Install

```bash
npm install
```

## 2. Create Firebase project

1. Create a project at https://console.firebase.google.com/
2. Add a Web App and copy its Firebase config.
3. Enable Authentication > Sign-in method > Email/Password.
4. Create the store owner's account in Authentication > Users > Add user.
5. Create Firestore Database.
6. Enable Storage (check the current Firebase plan/billing requirements for Storage).
7. Copy `.env.example` to `.env` and fill in the Firebase web config values.

Firebase web config is not a secret; access is controlled by Firestore and Storage security rules. Never put service-account private keys in this frontend project.

## 3. Set the admin UID securely

1. In Firebase Console > Authentication > Users, open the store owner's user.
2. Copy the user's UID.
3. Replace `ADMIN_UID_HERE` in BOTH `firestore.rules` and `storage.rules` with that exact UID.
4. Publish both rules in Firebase Console (Firestore > Rules and Storage > Rules).

Do not allow customers to create accounts as admins. Only the owner account whose UID is allowlisted can manage the store.

## 4. Deploy rules

Paste `firestore.rules` into Firestore Rules and `storage.rules` into Storage Rules in Firebase Console, then publish.

## 5. Run locally

```bash
npm run dev
```

For a production build:

```bash
npm run build
npm run preview
```

## 6. Deploy

Build the project and deploy the `dist` folder using Firebase Hosting or another static host. Configure SPA rewrites to `/index.html`.

## First-time setup checklist

- Add the shop's real phone number, WhatsApp number (country code included, e.g. 91...), email and address in Admin > Store settings.
- Add products and categories from the Admin panel.
- Upload the real storefront photo as the hero image URL (or extend branding upload for direct upload).
- The supplied logo is included at `public/logo.png`.
- Replace sample preview products with real products in Admin. Sample products are shown only while Firestore has no product documents.

## Important

- This is a functional starter foundation, not yet a production-audited deployment.
- Firebase Storage may require a billing-enabled project depending on current Firebase policy/region. Check Firebase console before enabling it.
- Add App Check, abuse protection/rate limiting for public review submission, backups and monitoring before a public production launch.
- Do not store customer passwords or sensitive information in Firestore.
  ed2247a (initial commit)
