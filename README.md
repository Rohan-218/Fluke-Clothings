# Fluke (E-Com)

Fluke is a clothing e-commerce application with a customer storefront, an admin dashboard, and a REST API. The storefront and dashboard are React applications built with Vite; the API uses Express and MongoDB.

## Features

- Browse, search, and view clothing products
- Register and log in, then manage a persistent shopping cart
- Place orders and view order history
- Administer products, orders, and users from a separate dashboard
- Upload product images through Cloudinary

## Project structure

```text
.
├── admin/       # React/Vite admin dashboard (port 5174)
├── backend/     # Express API and MongoDB models (port 3000 by default)
└── frontend/    # React/Vite customer storefront (port 5173)
```

Each app has its own `package.json` and dependencies. There is no root-level npm package or shared install command.

## Requirements

- Node.js `^20.19.0` or `>=22.12.0` (required by the Vite version used by the frontend and admin apps)
- npm
- A MongoDB database
- Cloudinary credentials for product image uploads

## Local setup

### 1. Configure the backend

In a terminal at the repository root:

```bash
cd backend
npm install
```

Copy `.env.sample` to `.env` and set the values:

```env
PORT=3000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>
CLOUDINARY_API_KEY=<cloudinary-api-key>
CLOUDINARY_SECRET_KEY=<cloudinary-secret>
CLOUDINARY_NAME=<cloudinary-cloud-name>
JWT_SECRET=<long-random-secret>
FRONTEND_URL=<store_frontend_url>
ADMIN_URL=<admin_panel_url>
```

`MONGODB_URI` should be the MongoDB connection URI without a database-name suffix; the API appends `/fluke-clothing`. The two `VITE_*_URL` values configure the API's allowed browser origins.

Start the API:

```bash
cd backend
npm run server
```

For a non-watching start, use `npm start`. The API health check is available at `http://localhost:PORT/`.

### 2. Configure and run the storefront

In a second terminal at the repository root:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_BACKEND_URL=http://localhost:PORT
```

Start the development server:

```bash
npm run dev
```

The storefront runs at `http://localhost:5173/`.

### 3. Configure and run the admin dashboard

In a third terminal at the repository root:

```bash
cd admin
npm install
```

Create `admin/.env`:

```env
VITE_BACKEND_URL=http://localhost:PORT
```

Start the dashboard:

```bash
npm run dev
```

The admin dashboard runs at `http://localhost:5174/`. Sign in with an account that has system/admin access.

## Scripts

Run these commands from the corresponding app directory:

| App | Command | Description |
| --- | --- | --- |
| `frontend/` or `admin/` | `npm run dev` | Start the Vite development server |
| `frontend/` or `admin/` | `npm run build` | Create a production build in `dist/` |
| `frontend/` or `admin/` | `npm run preview` | Preview the production build locally |
| `frontend/` or `admin/` | `npm run lint` | Run ESLint |
| `backend/` | `npm run server` | Start the API with nodemon |
| `backend/` | `npm start` | Start the API with Node.js |

## API overview

The API is served from the backend base URL and exposes:

- `/api/auth` — registration, login, logout, and authentication checks
- `/api/product` — public product listing/details and protected product administration
- `/api/cart` — authenticated cart operations
- `/api/order` — order creation, history, cancellation, and protected order administration
- `/api/user` — user data and administration

Authentication uses cookies, so the frontend and admin development origins must match the backend CORS settings.

## Production builds

Build each Vite app from its own directory:

```bash
cd frontend
npm run build
```

```bash
cd admin
npm run build
```

Each build is written to that app's `dist/` directory. Deploy the backend and each frontend separately, set each frontend's `VITE_BACKEND_URL` to the deployed API URL, and set the backend's `FRONTEND_URL` and `ADMIN_URL` to the deployed frontend origins. Configure production credentials through the hosting provider's environment settings rather than committing `.env` files.

## License

This project is proprietary and all rights are reserved by the author.

The source code is publicly available for viewing and evaluation purposes only. Copying, modifying, redistributing, or commercially using this code without prior written permission is prohibited.
