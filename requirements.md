💳 PHASE 4.1 — ORDER PAYMENT FLOW (DUMMY STRIPE)

1. Objective

Implement a payment simulation for orders so that after a buyer places an order, the backend updates the order status based on the payment outcome. This will make the system mimic a real e-commerce payment lifecycle.

2. Actors & Permissions
   Roles

Buyer

Admin (optional for overriding payments)

Access Rules

Only authenticated buyers can initiate payment for their orders

Buyers can only pay for orders they created

Sellers do not handle payment

Admin can optionally update payment status manually

3. Order Payment Entity Requirements
   Fields

orderId (reference Order, required)

status (enum: pending, confirmed, cancelled)

totalAmount (number, required)

buyerId (reference User, required)

paymentMethod (string: stripe-dummy)

createdAt / updatedAt (auto)

Constraints

Order status must initially be pending

Status can only transition:

pending → confirmed (payment success)

pending → cancelled (payment failed)

Stock must only be reduced after payment is confirmed

Payment must be linked to buyerId and orderId

4. APIs & Functional Requirements
   4.1 Initiate Payment

Endpoint allows buyer to pay for an order

Input: orderId

Validate order exists and belongs to buyer

Validate stock availability

Simulate payment via dummy Stripe keys from environment variables

On payment success:

Update order.status = confirmed

Reduce product stock

On payment failure:

Update order.status = cancelled

Restore product stock

4.2 Order Status Response

Endpoint returns updated order status (confirmed or cancelled)

Include orderId, status, totalAmount, and payment method in response

5. Security & Validation

Buyer must be authenticated

Buyer cannot pay for orders they don’t own

Payment simulation must respect order stock

Status transitions must be strictly enforced

Only one payment attempt allowed per order in normal flow

6. Error Handling

Insufficient stock → return validation error

Invalid orderId → return not found error

Unauthorized buyer → return forbidden error

Payment failure → return status cancelled with reason

7. Testing Requirements

Buyer can create order → status = pending

Buyer initiates payment → status updates to confirmed on success

Buyer initiates payment with insufficient stock → status = cancelled

Buyer cannot pay for another buyer’s order

Product stock updated correctly after payment success

Order status cannot skip stages

8. Documentation Requirements

Document new endpoint(s) in README.md

Include:

Endpoint URL and method

Required headers and body

Response structure

Status transitions

Mention dummy Stripe keys must be in environment variables

9. Phase Completion Criteria

Phase is complete when:

Order creation returns pending status

Payment API simulates Stripe payment

Order status updates correctly (confirmed / cancelled)

Stock is updated correctly after payment

API is tested, secure, and documented
