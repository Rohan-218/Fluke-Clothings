````markdown
# Fluke (E-Com)

Fluke is a modern e-commerce application built using the MERN stack. It features product listings, shopping cart management, and a foundation for the checkout process.

## Overview

This project focuses on:
- Responsive product browsing
- Product detail views
- Shopping cart interactions
- Checkout flow foundation
- Clean, scalable frontend structure

## Git Branches and Deployments

The branches separate the frontend, backend, and standalone static storefront:

| Branch | Purpose |
| --- | --- |
| `dev` | Frontend development with the application server. |
| `server-dev` | Backend development. |
| `static-ui` | Static frontend with its assets. This version does not require a backend and is deployed on Render at [e-commerce-45b1.onrender.com](https://e-commerce-45b1.onrender.com). |

## Tech Stack

- Frontend: React + Vite
- Language: JavaScript
- Styling: CSS
- Package manager: npm

## Project Structure

```text
Fluke (E-Com)/
├── frontend/
│   ├── public/
│   ├── src/
│   ├── .eslintrc*
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
├── .gitignore
├── README.md
└── package.json
```

## Prerequisites

Before running the app, make sure you have:
- Node.js 18 or later
- npm 9 or later

## Getting Started

1. Open a terminal in the project root
2. Navigate to the frontend app:
```bash
cd frontend
```

3. Install dependencies:
```bash
npm install
```

4. Start the development server:
```bash
npm run dev
```

The app should open in the browser at the local Vite URL, usually:
- http://localhost:5173

## Available Scripts

Inside the `frontend` folder:

```bash
npm run dev      # Start the Vite dev server
npm run build    # Create a production build
npm run preview  # Preview the built app
npm run lint     # Run ESLint checks
```

## Environment Variables

If the app needs API configuration, create a `.env` file inside `frontend/`:

```env
VITE_API_URL=http://localhost:5000
```

## Features

Current and planned features include:
- Product catalog
- Search and filtering
- Shopping cart
- Checkout flow
- Responsive layout
- Backend integration support

## Development Notes

- Keep components modular and reusable
- Separate business logic from UI where possible
- Use environment variables for API configuration
- Follow consistent naming and folder conventions

## Deployment

To deploy the app:
```bash
cd frontend
npm run build
```

Then publish the generated `dist` folder to a static hosting platform such as Vercel, Netlify, or GitHub Pages.

## License

This project does not currently have a license assigned.

## Notes

This repository currently focuses on the frontend storefront. Additional features such as a backend API, authentication, and database support can be added as the project grows.
````