# AD SL Today — Backend

Node.js + Express + MongoDB (Mongoose) API for the AD SL Today classified
ads platform. See the root [`CLAUDE.md`](../CLAUDE.md) for full project
conventions and the manual bank-transfer payment flow this backend
implements.

## Stack

- Node.js + Express
- MongoDB via Mongoose
- JWT auth (`jsonwebtoken`) + `bcryptjs` password hashing
- `express-validator` for request validation
- `multer` for local disk image uploads
- `morgan` for request logging, `cors` for cross-origin requests

## Image storage decision: local disk (`/uploads`), not Cloudinary

**Choice: local disk storage via Multer**, served statically from
`/uploads`. Reasons:

- No cloud budget/Cloudinary account has been set up for this project yet,
  and CLAUDE.md explicitly allows either choice as long as it's documented.
- Keeps the stack simple and free to run locally / on a single small VPS
  while the product is manual-payment/pre-revenue.
- The image field on the `Ad` model stores plain string paths
  (e.g. `/uploads/ads/<filename>.png`), so swapping storage backends later
  does not require a schema migration — only the upload middleware and the
  value written to `images` need to change.

**How to swap to Cloudinary later:**
1. Add `cloudinary` as a dependency and Cloudinary credentials to `.env`
   (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).
2. Replace the `multer.diskStorage` engine in `src/middleware/upload.js`
   with `multer-storage-cloudinary` (or upload the buffer to Cloudinary
   manually inside the controller using `multer.memoryStorage()`).
3. In `adController.createAd`, store the returned Cloudinary `secure_url`
   values in the `images` array instead of local `/uploads/...` paths.
4. Remove the `app.use('/uploads', express.static(...))` line from
   `src/server.js` once nothing references local paths anymore.

Uploaded files are validated server-side (JPEG/PNG/WEBP/GIF only, size and
file-count limits configurable via `.env`).

## Auth notes

`bcryptjs` (pure JavaScript) is used instead of the native `bcrypt` package
to avoid native-module build/prebuild issues across Node versions and
platforms. It implements the same bcrypt algorithm and hash format, so
hashes are fully interoperable if you ever switch to native `bcrypt`.

## Project structure

```
backend/
├── package.json
├── .env.example
├── scripts/
│   └── seedCategories.js       # one-off category seed script (not run on server start)
├── uploads/
│   └── ads/                    # uploaded ad images (gitignored, created on demand)
└── src/
    ├── server.js                # app entrypoint: middleware, routes, error handling, listen
    ├── config/
    │   └── db.js                 # Mongoose connection (logs + exits non-zero on failure)
    ├── models/
    │   ├── User.js
    │   ├── Category.js
    │   ├── Ad.js
    │   └── Order.js
    ├── middleware/
    │   ├── auth.js               # `protect` — verifies JWT, loads req.user
    │   ├── isAdmin.js            # `isAdmin` — requires req.user.role === "admin"
    │   ├── validate.js           # express-validator error formatter
    │   ├── upload.js             # multer local-disk config for ad images
    │   └── errorHandler.js       # 404 handler + centralised error handler
    ├── controllers/
    │   ├── authController.js
    │   ├── adController.js
    │   ├── checkoutController.js
    │   └── categoryController.js
    ├── routes/
    │   ├── index.js               # mounts all /api/v1/* routers
    │   ├── authRoutes.js
    │   ├── adRoutes.js
    │   ├── checkoutRoutes.js
    │   └── categoryRoutes.js
    └── utils/
        ├── generateToken.js
        └── generateUserCode.js
```

## Setup

```bash
cd backend
cp .env.example .env   # then fill in real values
npm install
npm run seed:categories   # optional: seed the starter category list
npm run dev                # nodemon, or `npm start` for production
```

The server logs and exits with a non-zero status code if `MONGO_URI` is
missing or the MongoDB connection fails at startup — it does not crash-loop
or attempt to serve requests without a database connection.

## API routes (all prefixed `/api/v1`)

### Auth — `/api/v1/auth`

| Method | Path            | Auth        | Description                                   |
|--------|-----------------|-------------|------------------------------------------------|
| POST   | `/register`     | Public      | Register a new user (bcrypt-hashed password)   |
| POST   | `/login`        | Public      | Log in, returns a JWT                          |
| GET    | `/me`           | User        | Get the current authenticated user's profile   |
| GET    | `/admin/users`  | Admin       | List all users (admin dashboard)               |

### Categories — `/api/v1/categories`

| Method | Path   | Auth  | Description                                   |
|--------|--------|-------|------------------------------------------------|
| GET    | `/`    | Public| List all categories                            |
| POST   | `/`    | Admin | Create a category                              |
| DELETE | `/:id` | Admin | Delete a category                              |

### Ads — `/api/v1/ads`

| Method | Path             | Auth  | Description                                                        |
|--------|------------------|-------|----------------------------------------------------------------------|
| GET    | `/`              | Public| List **approved** ads only. Query: `category`, `search`, `page`, `limit` |
| GET    | `/:id`           | Public| Get a single **approved** ad by id (404 if not approved/not found — no existence leak) |
| GET    | `/mine`          | User  | List the current user's own ads, any status                        |
| POST   | `/`              | User  | Create an ad (multipart/form-data, field `images[]`, up to 6 files). Created with status `pending_payment` |
| GET    | `/admin/all`     | Admin | List all ads regardless of status. Optional `?status=` filter       |
| PATCH  | `/:id/approve`   | Admin | Approve an ad -> status `approved`, publicly visible                |
| PATCH  | `/:id/reject`    | Admin | Reject an ad -> status `rejected`. Body: `{ "reason": string }`     |

### Checkout — `/api/v1/checkout`

Nested as its own top-level resource (not under `/ads`) since an Order is
a distinct resource from an Ad, and this keeps the admin "view all
submitted user codes/payments" listing simple (`GET /admin/all`).

| Method | Path            | Auth  | Description                                                              |
|--------|-----------------|-------|----------------------------------------------------------------------------|
| POST   | `/`             | User  | Body: `{ "adId": string }`. Must own the ad. Creates an Order + unique `userCode`, returns bank details + WhatsApp number. Idempotent — repeat calls return the existing order. |
| GET    | `/:adId`        | User  | Fetch the checkout/order details for one of your own ads                    |
| GET    | `/admin/all`    | Admin | List every order (userCode + payment status) for the admin dashboard        |
| PATCH  | `/:id/confirm`  | Admin | Manually mark an order's bank-transfer payment as `confirmed`, after the admin verifies the receipt + userCode sent via WhatsApp. Does **not** by itself approve the ad — approving/rejecting the ad is a separate action. |

There is **no real payment gateway** anywhere in this flow. The bank
account details, `ADMIN_WHATSAPP_NUMBER`, and generated `userCode` are the
only pieces of "payment" data the API handles; the actual money transfer
and receipt are handled manually by the user and admin outside the app.

## Environment variables

See [`.env.example`](./.env.example) for the full list with placeholder
values, including `PORT`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`,
`ADMIN_WHATSAPP_NUMBER`, `BANK_ACCOUNT_NUMBER`, `BANK_ACCOUNT_NAME`,
`BANK_NAME`, `BANK_BRANCH`, upload limits, and `CLIENT_ORIGIN` for CORS.

## Known limitations / notes

- `npm audit` reports a moderate-severity advisory in `qs` (a transitive
  dependency of Express 4.x's `body-parser`) that currently has no newer
  patched release compatible with Express 4. It is not triggered by any
  code path in this backend (we don't use custom `qs` array-limit/`stringify`
  options). Revisit when Express 5 or an updated `body-parser` is adopted.
- Category management (`POST`/`DELETE /api/v1/categories`) and the admin
  users/orders listing endpoints are small additions beyond the minimum
  spec, added because the frontend Post Ad form and Admin Dashboard need
  them (category dropdown, "manage users", "view all submitted user
  codes/payments" per `CLAUDE.md`).
