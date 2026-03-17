## Slooze Food Ordering – Fullstack Take Home

This repo implements the Slooze take‑home assignment described in [`SDE Take Home Assignment.pdf`](./SDE%20Take%20Home%20Assignment.pdf):

- Fullstack food ordering app
- Role‑based access (Admin / Manager / Member)
- Country‑scoped access (India / America) for Managers & Members
- Built with **NestJS + GraphQL + Prisma** and **Next.js + TypeScript + Tailwind + Apollo Client**

---

### 1. Tech Stack

- **Backend**: NestJS 11, GraphQL (code‑first, Apollo driver), Prisma ORM (SQLite)
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Apollo Client 4
- **Auth**: Email + password login → JWT, custom middleware + guards for RBAC + ReBAC

---

### 2. Backend – Getting Started

```bash
cd backend
npm install

# Prisma
npx prisma migrate dev --name init
npm run prisma:seed

# Run backend (http://localhost:3000)
npm run start:dev
```

GraphQL Playground will be available at `http://localhost:3000/graphql`.

---

### 3. Seeded Users & Roles

All users have **password `password123`**.

- **Admin (Nick Fury)**
  - Email: `nick.fury@slooze.xyz`
  - Role: `ADMIN`, Country: `INDIA`
- **Managers**
  - `captain.marvel@slooze.xyz` – Manager, INDIA
  - `captain.america@slooze.xyz` – Manager, AMERICA
- **Members**
  - `thanos@slooze.xyz` – Member, INDIA
  - `thor@slooze.xyz` – Member, INDIA
  - `travis@slooze.xyz` – Member, AMERICA

Role capabilities are implemented exactly as in the PDF:

- View restaurants & menu items – **Admin / Manager / Member**
- Create order – **Admin / Manager / Member**
- Checkout & pay – **Admin / Manager only**
- Cancel order – **Admin / Manager only**
- Update payment method – **Admin only**

Managers & Members are restricted to restaurants/orders/payment methods in **their own country**.

---

### 4. Frontend – Getting Started

```bash
cd frontend
npm install

# Run Next.js on port 3001
npm run dev -- --port 3001
```

Open `http://localhost:3001` – you will be redirected to `/login`.

The frontend talks to the backend GraphQL API at `http://localhost:3000/graphql` via Apollo Client.

---

### 5. Frontend Routes & Flows

- **`/login`**
  - Login form with **pre‑filled credentials** (Nick Fury, Admin).
  - You can change the email to any of the seeded users listed above to test different roles.
  - On success, stores JWT + user (role, country) in `localStorage` and redirects to `/restaurants`.

- **`/restaurants`**
  - Lists restaurants & menu items (scoped by country for non‑admins).
  - Allows building a simple cart and creating an order via `createOrder`.
  - Header links:
    - **My Orders** → `/orders`
    - **Payment Methods** (Admin only) → `/payment-methods`
    - **Logout** – clears token/user and returns to `/login`.

- **`/orders`**
  - Shows `myOrders` for the logged‑in user.
  - Managers/Admins see **Checkout** and **Cancel** buttons per order:
    - `checkoutOrder` is restricted to Admin/Manager.
    - `cancelOrder` is restricted to Admin/Manager.

- **`/payment-methods`** (Admin only)
  - Lists all payment methods (admin can see org‑wide).
  - Form to add a new payment method (`addPaymentMethod`), restricted to Admin.

---

### 6. Architecture Overview

- **Prisma schema**
  - `User` with `role` (`ADMIN | MANAGER | MEMBER`) and `country` (`INDIA | AMERICA`)
  - `Restaurant`, `MenuItem`, `Order`, `OrderItem`, `PaymentMethod`, `Payment`

- **Auth & RBAC**
  - `login` mutation → returns JWT.
  - `AuthMiddleware` parses JWT and attaches `req.user`.
  - `CurrentUser` decorator + `RolesGuard` enforce role checks.
  - Service methods enforce additional ReBAC (country) and ownership rules.

---

### 7. Testing with GraphQL

Example queries (when backend is running at `http://localhost:3000/graphql`):

```graphql
# Login
mutation {
  login(email: "nick.fury@slooze.xyz", password: "password123") {
    token
    user {
      id
      role
      country
    }
  }
}
```

Use the returned token as:

```json
{
  "Authorization": "Bearer <token>"
}
```

in the GraphQL Playground HTTP headers, then:

```graphql
query {
  restaurants {
    id
    name
    country
    menus {
      id
      name
      price
    }
  }
}
```

and the rest of the order/payment mutations as described in the code.

---

### 8. Notes

- Designed to be easy to run locally: SQLite DB (`prisma/dev.db`) and seeded data.
- Backend & frontend are intentionally decoupled by port to mirror a real deployment.
- The UI is intentionally kept clean and modern with Tailwind classes so you can iterate quickly on styling or branding.


