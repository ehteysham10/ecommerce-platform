# 📄 Project Documentation: Multi-Vendor E-Commerce Backend

This document provides a comprehensive overview of the system's design, features, and technical specifications.

---

## 🏗 System Architecture

The project follows a **Modular Monolith** architecture using **Node.js, Express, and MongoDB**.

- **Routing Layer**: Centralized versioning in `src/routes/v1.js`.
- **Controller Layer**: Decoupled business logic from routes.
- **Model Layer**: Mongoose schemas with validation and automated aggregation (Ratings/Stocks).
- **Middleware**: Custom handlers for Authentication, Multi-tenant Role Authorization, and Cloudinary uploads.
- **External Services**: Cloudinary (Media), Nodemailer (Emails), MongoDB Atlas (Database).

---

## 🛡 Security & Authentication

### JWT Strategy

- Stateless authentication using JSON Web Tokens.
- **Refresh Protection**: Deactivated accounts are blocked instantly via middleare checks on every request.
- **Role Hierarchy**:
  - `buyer`: Order placement & reviews.
  - `seller`: Inventory & order management.
  - `admin`: Moderation & Analytics.
  - `super_admin`: System-level user control.

### Hardening

- **Helmet**: Secure HTTP headers.
- **CORS**: Cross-Origin Resource Sharing enabled.
- **Input Sanitization**: `express.json()` and `express.urlencoded()` limits.

---

## 📦 Key Modules

### 1. Product Management

- Multi-image support (Cloudinary).
- Paginated search and category filtering.
- Automated `averageRating` updates.

### 2. Multi-Vendor Order Flow

- **One Order, Multiple Sellers**: A single transaction can contain products from different sellers.
- **Atomic Stock Management**: Simultaneous stock reduction during order placement.
- **Status Lifecycle**: Items move through `pending` -> `confirmed` -> `shipped` -> `delivered`.

### 3. Review & Rating System

- **Authenticity Lock**: Only users who have received the item can review it.
- **One-per-user**: Unique index prevents spamming multiple reviews on a single product.

### 4. Admin Insights

- Aggregated financial data (Total Revenue, Avg Order Value).
- Dynamic platform-wide auditing (`AuditLog`).

---

## 🗂 Database Schema (Simplified)

### User

```json
{
  "name": "String",
  "email": "String (unique)",
  "role": "Enum ['buyer', 'seller', 'admin']",
  "isActive": "Boolean"
}
```

### Order

```json
{
  "buyerId": "ObjectId",
  "items": [
    { "productId": "ObjectId", "sellerId": "ObjectId", "status": "String" }
  ],
  "totalAmount": "Number",
  "paymentStatus": "Enum"
}
```

---

## 🛠 Tech Stack

| Component          | Technology         |
| :----------------- | :----------------- |
| **Runtime**        | Node.js            |
| **Framework**      | Express            |
| **Database**       | MongoDB + Mongoose |
| **File Storage**   | Cloudinary         |
| **Authentication** | JWT + Bcrypt       |
| **Mailing**        | Nodemailer         |

---

## 📈 Future Roadmap

- [ ] Redis caching for product listings.
- [ ] Stripe/PayPal integration for real payments.
- [ ] Socket.io for real-time order status updates.
