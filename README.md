Food Ordering System (RBAC + Country-Based Access)
-------------------------------------------------------
# Project Overview

This is a full-stack web application that allows users to:

* View restaurants and menu items
* Create food orders
* Checkout and make payments
* Cancel orders
* Manage payment methods

The system is built with **Role-Based Access Control (RBAC)** and **Country-Based Data Restrictions** to ensure secure and controlled access.

----------------------------------------------------

# User Roles

| User            | Role    | Country |
| --------------- | ------- | ------- |
| Nick Fury       | Admin   | Global  |
| Captain Marvel  | Manager | India   |
| Captain America | Manager | America |
| Thanos          | Member  | India   |
| Thor            | Member  | India   |
| Travis          | Member  | America |

----------------------------------------------

# RBAC Permissions

 Feature               | Admin | Manager | Member |
------------------------------------------------------------
 View Restaurants          Y         Y         Y
 Create Order              Y         Y         Y
 Checkout & Pay            Y         Y         N
 Cancel Order              Y         Y         N
 Update Payment Method     Y         N         N

RBAC is implemented using **custom decorators and guards** in the backend.

-----------------------------------------------------------

# Country-Based Access

* Managers and Members can only access data from their assigned country
* Admin has global access

# Example:

* India Manager → Access only India data
* America Member → Access only America data

This is enforced using **middleware + query filtering logic**

-----------------------------------------------

# Tech Stack

# Frontend

* Next.js (App Router)
* TypeScript

# Backend

* NestJS
* GraphQL

# Database

* SQLite (dev.db)

# ORM

* Prisma

# Other

* JWT Authentication
* Role Guards
* Middleware

-------------------------------------------------

# Project Structure

# Frontend

src/
 ├ app/
 │   ├ login/
 │   ├ orders/
 │   ├ payment-methods/
 │   ├ restaurants/
 │   ├ layout.tsx
 │   └ page.tsx
 ├ lib/
 │   └ apollo-client.ts
```

----------------------------------------------

# Backend

src/
 ├ auth/
 │   ├ auth.middleware.ts
 │   ├ auth.module.ts
 |   ├ auth.module.ts
 |   ├ auth.resplver.ts
 │   ├ auth.service.ts
 │   ├ roles.guard.ts
 │   ├ roles.decorator.ts
 │   └ current-user.decorator.ts
 │
 ├ order/
 |   ├ order.model.ts
 │   ├ order.module.ts
 │   ├ order.service.ts
 │   ├ order.resolver.ts
 │
 ├ payment/
 |   ├ payment.model.ts
 │   ├ payment.module.ts
 │   ├ payment.service.ts
 │   ├ payment.resolver.ts
 │
 ├ restaurant/
 |   ├ restaurant.model.ts
 │   ├ restaurant.module.ts
 │   ├ restaurant.service.ts
 │   ├ restaurant.resolver.ts
 │
 ├ prisma.service.ts
 ├ app.module.ts
 ├ app.resolver.ts
 └ main.ts

-------------------------------------------------------

# Database (Prisma)

prisma/
 ├ schema.prisma
 ├ seed.ts
 ├ migrations/
 └ dev.db

------------------------------------------------

# Architecture

Frontend (Next.js)
        ↓
GraphQL API (NestJS)
        ↓
Prisma ORM
        ↓
SQLite Database

-----------------------------------------------------

# Database Design

Main Entities:

* **User**

  * id, name, role, country

* **Restaurant**

  * id, name, country

* **MenuItem**

  * id, name, price, restaurantId

* **Order**

  * id, userId, status, country, totalAmount

* **OrderItem**

  * id, orderId, menuItemId, quantity

* **PaymentMethod**

  * id, userId, type

---

# API Endpoints (GraphQL)

# Auth

* Login / Authentication

# Restaurant

* Get restaurants with menu items

# Order

* Create order
* Add items to order
* Checkout order
* Cancel order

# Payment

* Update payment method

--------------------------------------------------------------------

# Getting Started

# Install dependencies

# Backend


cd backend
npm install


# Frontend


cd frontend
npm install


-----------------------------------------------------------

# Setup Database


npx prisma migrate dev
npx prisma db seed

-----------------------------------------------------------

# Run Application

# Backend


npm run start:dev


# Frontend


npm run dev

--------------------------------------------------------

# Access App

* Frontend → http://localhost:3001
* GraphQL → http://localhost:3000/graphql 

----------------------------------------------------------

# Key Features

* Role-Based Access Control (RBAC)
* Country-Based Data Restriction (Bonus)
* GraphQL API with clean structure
* Prisma ORM integration
* Modular NestJS architecture
* Secure authentication with middleware
* Scalable and maintainable code

----------------------------------------------------------

# Submission Includes

* GitHub Repository
* README Documentation
* Prisma Schema & Migrations
* API (GraphQL) Implementation
* Project Structure

---------------------------------------------------

# Author

Harshada Mali

-------------------------------------------------------
