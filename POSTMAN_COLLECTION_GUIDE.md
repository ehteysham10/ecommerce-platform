# 🚀 Postman Testing Guide

This guide provides request templates and JSON examples for all API endpoints.  
**Base URL:** `http://localhost:5000/api/v1`

---

## 🔐 1. Authentication (`/auth`)

### Register User

- **Method:** `POST`
- **URL:** `/auth/register`
- **Body (JSON):**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123!",
  "role": "buyer"
}
```

_(Note: role can be 'buyer' or 'seller')_

### Login

- **Method:** `POST`
- **URL:** `/auth/login`
- **Body (JSON):**

```json
{
  "email": "jane@example.com",
  "password": "Password123!"
}
```

---

## 🛒 2. Products (`/products`)

### Create Product (Seller Only)

- **Method:** `POST`
- **URL:** `/products`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Body (form-data):**
  - `title`: Premium Headphones
  - `description`: Noise cancelling headphones
  - `price`: 299.99
  - `category`: Electronics
  - `stock`: 50
  - `images`: (Select 1-5 files)

### Get All Products (Public)

- **Method:** `GET`
- **URL:** `/products?keyword=headphone&page=1&limit=10`

---

## 📦 3. Orders & Payments (`/orders`)

### Place Order (Buyer Only)

- **Method:** `POST`
- **URL:** `/orders`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Body (JSON):**

```json
{
  "items": [{ "productId": "658123...", "quantity": 2 }],
  "shippingAddress": {
    "address": "123 Main St",
    "city": "London",
    "postalCode": "E1 6AN",
    "country": "UK"
  },
  "paymentMethod": "Stripe"
}
```

### Pay for Order (Buyer Only)

- **Method:** `POST`
- **URL:** `/orders/<ORDER_ID>/pay`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Body (JSON):**

```json
{
  "stripeToken": "tok_visa"
}
```

_(Use `"stripeToken": "fail"` to test a failed payment)_

### Update Item Status (Seller Only)

- **Method:** `PATCH`
- **URL:** `/orders/<ORDER_ID>/status`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Body (JSON):**

```json
{
  "itemId": "item_id_here",
  "status": "shipped"
}
```

---

## ⭐ 4. Reviews (`/reviews`)

### Create Review (Purchased Buyers Only)

- **Method:** `POST`
- **URL:** `/reviews`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Body (JSON):**

```json
{
  "productId": "658123...",
  "rating": 5,
  "comment": "Amazing sound quality!"
}
```

---

## 📊 5. Admin Dashboard (`/admin`)

### Get System Stats

- **Method:** `GET`
- **URL:** `/admin/stats`
- **Headers:** `Authorization: Bearer <ADMIN_TOKEN>`

### Moderate Product

- **Method:** `PATCH`
- **URL:** `/admin/products/<ID>/moderate`
- **Body (JSON):**

```json
{
  "isActive": false
}
```

---

## 🛠 6. System

### Health Check

- **Method:** `GET`
- **URL:** `http://localhost:5000/api/health`
  _(Note: /api/health is not under v1 per requirements)_
