---
name: revolut-business
description: Integration with Revolut Business API — card expenses, FX tracking, international payments
slug: revolut-business
version: 0.1.0
tags:
  - finance
  - banking
  - revolut
---

# Revolut Business

Integration with the Revolut Business API for multi-currency operations, card expense management, FX tracking, and international payments.

## API Reference

### Base URL

```
https://b2b.revolut.com/api/1.0
```

For sandbox/testing:
```
https://sandbox-b2b.revolut.com/api/1.0
```

### Authentication

OAuth 2.0 Bearer token flow:

1. Generate a key pair and upload the public key in the Revolut Business API settings.
2. Request an access token using a signed JWT assertion:

```http
POST https://b2b.revolut.com/api/1.0/auth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code=<auth_code>&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&client_assertion=<signed_jwt>
```

3. Use the returned access token in all subsequent requests:

```
Authorization: Bearer <access_token>
```

4. Refresh tokens before expiry (token lifetime: 40 minutes). Use the refresh token endpoint:

```http
POST https://b2b.revolut.com/api/1.0/auth/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&refresh_token=<refresh_token>&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&client_assertion=<signed_jwt>
```

### Rate Limits

- 600 requests per minute per access token
- Batch requests where possible (especially for transaction retrieval)
- Implement exponential backoff for 429 responses

---

## Endpoints

### GET /accounts

List all accounts (multi-currency).

**Request:**
```http
GET /api/1.0/accounts
Authorization: Bearer <access_token>
```

**Response:**
```json
[
  {
    "id": "acc_eur_001",
    "name": "Main EUR",
    "balance": 85420.50,
    "currency": "EUR",
    "state": "active",
    "public": true,
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2026-04-07T18:30:00Z"
  },
  {
    "id": "acc_usd_001",
    "name": "USD Operations",
    "balance": 12300.00,
    "currency": "USD",
    "state": "active",
    "public": false,
    "created_at": "2024-06-01T09:00:00Z",
    "updated_at": "2026-04-07T18:30:00Z"
  },
  {
    "id": "acc_gbp_001",
    "name": "GBP Operations",
    "balance": 4500.75,
    "currency": "GBP",
    "state": "active",
    "public": false,
    "created_at": "2025-01-10T14:00:00Z",
    "updated_at": "2026-04-06T12:00:00Z"
  }
]
```

### GET /accounts/:id

Retrieve a specific account.

**Request:**
```http
GET /api/1.0/accounts/acc_eur_001
Authorization: Bearer <access_token>
```

### GET /transactions

List transactions with filters.

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `from` | string | ISO 8601 datetime lower bound |
| `to` | string | ISO 8601 datetime upper bound |
| `counterparty` | string | Counterparty account ID |
| `count` | integer | Number of results (max 1000) |
| `type` | string | `atm`, `card_payment`, `card_refund`, `card_chargeback`, `card_credit`, `exchange`, `transfer`, `loan`, `fee`, `refund`, `topup`, `topup_return`, `tax`, `tax_refund` |

**Request:**
```http
GET /api/1.0/transactions?from=2026-03-01T00:00:00Z&to=2026-03-31T23:59:59Z&count=1000
Authorization: Bearer <access_token>
```

**Response:**
```json
[
  {
    "id": "txn_rev_001",
    "type": "card_payment",
    "state": "completed",
    "created_at": "2026-03-15T14:22:00Z",
    "completed_at": "2026-03-15T14:22:00Z",
    "merchant": {
      "name": "AWS",
      "city": "Seattle",
      "category_code": "7372",
      "country": "US"
    },
    "legs": [
      {
        "leg_id": "leg_001",
        "account_id": "acc_eur_001",
        "amount": -1250.00,
        "currency": "EUR",
        "bill_amount": -1350.00,
        "bill_currency": "USD",
        "description": "AWS Monthly - March"
      }
    ],
    "card": {
      "card_number": "****1234",
      "first_name": "Marie",
      "last_name": "Dupont"
    }
  },
  {
    "id": "txn_rev_002",
    "type": "transfer",
    "state": "completed",
    "created_at": "2026-03-20T09:00:00Z",
    "completed_at": "2026-03-20T09:05:00Z",
    "legs": [
      {
        "leg_id": "leg_002",
        "account_id": "acc_eur_001",
        "amount": -3500.00,
        "currency": "EUR",
        "counterparty": {
          "id": "cp_001",
          "account_id": "ext_acc_001",
          "account_type": "external",
          "name": "Freelancer GmbH"
        },
        "description": "Payment for Q1 consulting"
      }
    ]
  }
]
```

### GET /transactions/:id

Retrieve a single transaction by ID.

**Request:**
```http
GET /api/1.0/transactions/txn_rev_001
Authorization: Bearer <access_token>
```

### POST /pay

Create an external payment to a counterparty.

**Request:**
```http
POST /api/1.0/pay
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "request_id": "pay-2026-04-freelancer-001",
  "account_id": "acc_eur_001",
  "receiver": {
    "counterparty_id": "cp_001",
    "account_id": "ext_acc_001"
  },
  "amount": 3500.00,
  "currency": "EUR",
  "reference": "INV-2026-Q1-CONSULTING"
}
```

**Response (200 OK):**
```json
{
  "id": "txn_pay_003",
  "state": "pending",
  "created_at": "2026-04-08T10:00:00Z",
  "request_id": "pay-2026-04-freelancer-001"
}
```

**Important:** The `request_id` field is an idempotency key. Always use a unique, deterministic value to prevent duplicate payments.

### POST /transfer

Internal transfer between Revolut accounts (e.g., EUR to USD).

**Request:**
```http
POST /api/1.0/transfer
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "request_id": "internal-2026-04-eur-to-usd",
  "source_account_id": "acc_eur_001",
  "target_account_id": "acc_usd_001",
  "amount": 5000.00,
  "currency": "EUR",
  "reference": "FX conversion for US vendor payments"
}
```

### GET /counterparties

List all saved counterparties (beneficiaries).

**Request:**
```http
GET /api/1.0/counterparties
Authorization: Bearer <access_token>
```

**Response:**
```json
[
  {
    "id": "cp_001",
    "name": "Freelancer GmbH",
    "phone": "+49123456789",
    "profile_type": "business",
    "country": "DE",
    "state": "created",
    "created_at": "2025-06-15T10:00:00Z",
    "accounts": [
      {
        "id": "ext_acc_001",
        "currency": "EUR",
        "type": "external",
        "account_no": "DE89370400440532013000",
        "iban": "DE89370400440532013000",
        "bic": "COBADEFFXXX",
        "recipient_charges": "no"
      }
    ]
  }
]
```

### POST /counterparties

Add a new counterparty.

**Request:**
```http
POST /api/1.0/counterparties
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "profile_type": "business",
  "name": "US SaaS Vendor Inc",
  "bank_country": "US",
  "currency": "USD",
  "account_no": "123456789",
  "routing_number": "021000021",
  "email": "billing@vendor.com",
  "address": {
    "street_line1": "100 Main St",
    "city": "New York",
    "region": "NY",
    "postcode": "10001",
    "country": "US"
  }
}
```

### GET /rate

Get current FX exchange rate.

**Request:**
```http
GET /api/1.0/rate?from=EUR&to=USD&amount=10000
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "from": {
    "amount": 10000.00,
    "currency": "EUR"
  },
  "to": {
    "amount": 10850.00,
    "currency": "USD"
  },
  "rate": 1.085,
  "fee": {
    "amount": 0.00,
    "currency": "EUR"
  }
}
```

---

## Workflows

### 1. Multi-Currency Treasury Dashboard

**Trigger:** Daily at 8:30 AM CET.

**Steps:**

1. Call `GET /accounts` to retrieve all account balances.
2. For each non-EUR account, call `GET /rate` to get the current EUR equivalent.
3. Compute total treasury in EUR:
   - EUR balance + SUM(foreign balance x rate to EUR)
4. Compare to previous day's snapshot (stored from prior run).
5. Generate treasury summary:
   - Per-currency balances (actual and EUR equivalent)
   - Daily FX impact (change in EUR value due to rate movements, not transactions)
   - Total consolidated balance in EUR
6. Combine with Qonto balances (via `qonto-banking` skill) for full group treasury view.

### 2. FX Tracking and Optimization

**Trigger:** Continuous monitoring, checked every 4 hours during business hours.

**Steps:**

1. Retrieve all `exchange` type transactions for the current month via `GET /transactions?type=exchange`.
2. For each exchange transaction, record:
   - Source currency and amount
   - Target currency and amount
   - Applied rate vs. mid-market rate at that time
   - Implicit fee (spread)
3. Track monthly FX costs:
   - Total spread cost across all conversions
   - Average spread percentage
4. Alert CFO if:
   - Monthly FX costs exceed 500 EUR
   - A single conversion spread exceeds 0.5%
5. Recommend optimal timing: monitor rate trends and suggest converting when EUR is strong relative to needed currencies.

### 3. International Payment Workflow

**Trigger:** On request (e.g., freelancer invoice received).

**Steps:**

1. Check if the counterparty already exists via `GET /counterparties`. Search by name or IBAN.
2. If not found, create the counterparty via `POST /counterparties` with full banking details.
3. Determine which account to pay from:
   - If amount currency matches an existing account with sufficient balance, use that account.
   - Otherwise, check FX rate via `GET /rate` and decide whether to convert first or pay directly from EUR (auto-conversion).
4. Create the payment via `POST /pay`:
   - Set `request_id` to a unique deterministic value: `pay-YYYY-MM-counterparty-invoice_ref`
   - Include invoice reference in the `reference` field
5. Monitor payment state: poll `GET /transactions/:id` until state is `completed` or `failed`.
6. Log the payment for reconciliation with Pennylane accounting.

### 4. Card Expense Monitoring

**Trigger:** Daily at 6:00 PM CET.

**Steps:**

1. Retrieve all `card_payment` transactions for the current day via `GET /transactions?type=card_payment&from=<today_start>&to=<now>`.
2. For each transaction, extract:
   - Cardholder name (from `card.first_name`, `card.last_name`)
   - Merchant name and category
   - Amount (both billing currency and account currency)
3. Apply policy rules:
   - Single transaction > 500 EUR: flag for manager review
   - Merchant category in blocked list (e.g., gambling, personal services): flag immediately
   - Cardholder exceeds monthly card budget (tracked as running total): alert and notify cardholder
4. Generate daily card expense summary for the Controller.

---

## Error Handling

| HTTP Status | Meaning | Action |
|---|---|---|
| 400 | Bad request | Parse error message, fix request parameters |
| 401 | Token expired or invalid | Trigger token refresh flow using refresh token |
| 403 | Insufficient permissions | Check API certificate permissions |
| 404 | Resource not found | Verify resource ID |
| 409 | Conflict (duplicate request_id) | The payment was already created; retrieve existing transaction |
| 422 | Validation error | Check field-level error messages |
| 429 | Rate limited | Back off exponentially starting at 1 second |
| 500+ | Server error | Retry up to 3 times with backoff, then alert |

**Token refresh logic:**

```
if response.status == 401:
    new_token = refresh_access_token(refresh_token)
    retry original request with new_token
    if refresh fails:
        alert ops — re-authorization needed
```

---

## Data Model

### Transaction Leg Fields

Each transaction contains one or more `legs` representing the money movement:

| Field | Type | Description |
|---|---|---|
| `leg_id` | string | Unique leg identifier |
| `account_id` | string | Revolut account involved |
| `amount` | float | Signed amount (negative = outflow) |
| `currency` | string | Account currency |
| `bill_amount` | float | Original billing amount (for card transactions) |
| `bill_currency` | string | Original billing currency |
| `description` | string | Transaction description |
| `counterparty` | object | Counterparty details (for transfers) |

### Transaction States

| State | Description |
|---|---|
| `pending` | Payment created, awaiting processing |
| `completed` | Successfully settled |
| `declined` | Rejected (insufficient funds, compliance) |
| `failed` | Technical failure |
| `reverted` | Reversed after completion |

---

## Security Considerations

- **Private key protection.** The JWT signing private key must be stored in a hardware security module or encrypted secrets manager. Never store in code repositories.
- **Token rotation.** Access tokens expire after 40 minutes. Always handle refresh automatically. Store refresh tokens encrypted at rest.
- **Idempotency keys.** Always set `request_id` on payment and transfer requests. Use a deterministic format (e.g., `pay-{date}-{counterparty}-{invoice}`) to prevent duplicate payments in case of retries.
- **Payment approval.** For payments above 5,000 EUR, require explicit CFO confirmation before calling `POST /pay`. The API does not enforce dual approval.
- **IP restrictions.** Configure API access certificates to restrict calls to known server IPs only.
- **Reconciliation.** Cross-reference every Revolut transaction with Pennylane accounting entries daily. Investigate any unmatched items within 48 hours.
- **PCI compliance.** Card numbers are masked in API responses. Never attempt to store or log full card numbers.
- **Multi-currency risk.** Log all FX rates applied. Flag any conversion where the applied rate deviates > 1% from the mid-market rate at the time.
