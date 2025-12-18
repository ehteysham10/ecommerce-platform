Phase 1: Project Setup & Configuration

Purpose: Project environment ready karna aur basic server + DB connection setup karna.

Tasks & Features:

Initialize Node.js project (npm init)

Install dependencies:

Express, Mongoose, dotenv, bcrypt, jsonwebtoken, cors, morgan

Setup ES6 modules ("type": "module" in package.json)

Create .env for environment variables:

PORT, MONGO_URI, JWT_SECRET

Create server.js as main entry point

Setup MongoDB connection (config/db.js)

Setup basic Express server with JSON parser and root test route

Deliverable: Server running + connected to MongoDB

Phase 2: Authentication & User Management

Purpose: Secure login/signup and role-based access.

Features:

User Roles: Buyer, Seller, Admin

User Model: name, email, password, role, timestamps

APIs:

POST /api/auth/register → register as buyer/seller

POST /api/auth/login → login, return JWT + refresh token

POST /api/auth/refresh-token → refresh JWT

GET /api/users/me → get logged-in user profile

PATCH /api/users/me → update profile info

Middlewares:

authMiddleware → verify JWT

roleMiddleware → restrict routes based on role

Validation:

Email format, password min length

Security:

Hash password using bcrypt, store JWT securely

Deliverable: Fully working auth system with roles

Phase 3: Products Management

Purpose: Allow sellers to manage products, buyers to browse.

Features:

Product Model:

sellerId, name, description, price, category, stock, images, timestamps

APIs:

POST /api/products → add product (seller only)

GET /api/products → list all products (filters: category, price, seller)

GET /api/products/:id → product details

PATCH /api/products/:id → update product (seller only)

DELETE /api/products/:id → delete product (seller only)

Validation:

Price > 0, stock >= 0, name required

Optional Features:

Pagination, sorting, search

Soft delete for products

Deliverable: CRUD + list products with filters

Phase 4: Orders Management

Purpose: Buyers can place orders, sellers/admin can manage them.

Features:

Order Model:

buyerId, items [{productId, quantity, price}], totalPrice, status, timestamps

Order Status: pending → confirmed → shipped → delivered → cancelled

APIs:

POST /api/orders → create order (buyer only)

GET /api/orders/me → buyer’s order history

PATCH /api/orders/:id/status → update status (seller/admin only)

GET /api/orders → list all orders (admin only)

Validation:

Product exists, stock available, totalPrice calculated automatically

Notes:

Decrease product stock when order is confirmed

Optional: notification/email when status changes

Deliverable: Full order system with status tracking

Phase 5: Reviews & Ratings

Purpose: Buyers can rate and review products.

Features:

Review Model: productId, buyerId, rating, comment, timestamps

APIs:

POST /api/products/:id/review → add review (buyer only)

GET /api/products/:id/reviews → get all reviews

Validation:

Rating: 1–5

One review per buyer per product

Deliverable: Product review system integrated

Phase 6: Admin Dashboard APIs

Purpose: Admin can monitor users, sellers, and orders.

Features:

APIs:

GET /api/admin/users → list all users

GET /api/admin/sellers → list all sellers

GET /api/admin/orders → list all orders

Optional Stats: total users, total sellers, total sales

Role Restriction: Admin only

Deliverable: Admin monitoring endpoints