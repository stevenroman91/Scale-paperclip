---
name: qonto-banking
description: Integration with Qonto API v2 — account balances, transactions, categorization, wire transfers initiation
slug: qonto-banking
version: 0.1.0
tags:
  - finance
  - banking
  - qonto
---

# Qonto Banking

Integration with the Qonto API v2 for banking operations across Scale Group entities.

## API Reference

### Base URL

```
https://thirdparty.qonto.com/v2
```

### Authentication

All requests require the `Authorization` header using the format:

```
Authorization: <organization-slug>:<secret-key>
```

The organization slug and secret key are found in the Qonto web app under Settings > API Integrations. Each Scale Group entity has its own credentials.

### Rate Limits

- 100 requests per minute per API key
- 1,000 requests per hour per API key
- Respect `Retry-After` header on 429 responses
- Implement exponential backoff: wait 1s, 2s, 4s, 8s on successive failures

---

## Endpoints

### GET /organization

Returns organization details including bank account balances.

**Request:**
```http
GET /v2/organization
Authorization: <org-slug>:<secret-key>
```

**Response:**
```json
{
  "organization": {
    "slug": "scale-group-hq",
    "legal_name": "Scale Group HQ SAS",
    "bank_accounts": [
      {
        "slug": "scale-group-hq-main",
        "iban": "FR76XXXXXXXXXXXXXXXXXXXX",
        "bic": "QNTOFRP1XXX",
        "currency": "EUR",
        "balance": 142350.75,
        "balance_cents": 14235075,
        "authorized_balance": 140000.00,
        "authorized_balance_cents": 14000000,
        "status": "active"
      }
    ]
  }
}
```

### GET /transactions

List transactions with pagination and filters.

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `slug` | string | **Required.** Bank account slug |
| `status[]` | string | Filter: `pending`, `reversed`, `declined`, `completed` |
| `updated_at_from` | string | ISO 8601 datetime lower bound |
| `updated_at_to` | string | ISO 8601 datetime upper bound |
| `settled_at_from` | string | ISO 8601 settled date lower bound |
| `settled_at_to` | string | ISO 8601 settled date upper bound |
| `side` | string | `credit` or `debit` |
| `label_ids[]` | string | Filter by label (category) IDs |
| `current_page` | integer | Page number (default 1) |
| `per_page` | integer | Results per page (default 20, max 100) |

**Request:**
```http
GET /v2/transactions?slug=scale-group-hq-main&status[]=completed&side=debit&updated_at_from=2026-03-01T00:00:00Z&updated_at_to=2026-03-31T23:59:59Z&per_page=100&current_page=1
Authorization: <org-slug>:<secret-key>
```

**Response:**
```json
{
  "transactions": [
    {
      "transaction_id": "txn_abc123",
      "amount": 1500.00,
      "amount_cents": 150000,
      "currency": "EUR",
      "side": "debit",
      "operation_type": "transfer",
      "status": "completed",
      "note": "Freelance payment - March 2026",
      "reference": "PAY-2026-03-042",
      "settled_at": "2026-03-15T10:30:00.000Z",
      "updated_at": "2026-03-15T10:30:00.000Z",
      "emitted_at": "2026-03-15T09:00:00.000Z",
      "label_ids": ["lbl_freelance"],
      "counterparty": "Jean Dupont",
      "initiator": {
        "id": "usr_xyz",
        "full_name": "Marie CFO"
      },
      "attachment_ids": ["att_001"]
    }
  ],
  "meta": {
    "current_page": 1,
    "next_page": 2,
    "prev_page": null,
    "total_pages": 3,
    "total_count": 245,
    "per_page": 100
  }
}
```

### GET /transactions/:transaction_id

Retrieve a single transaction with full details.

**Request:**
```http
GET /v2/transactions/txn_abc123
Authorization: <org-slug>:<secret-key>
```

### GET /labels

Retrieve all expense category labels.

**Request:**
```http
GET /v2/labels
Authorization: <org-slug>:<secret-key>
```

**Response:**
```json
{
  "labels": [
    { "id": "lbl_001", "name": "Salaires", "parent_id": null },
    { "id": "lbl_002", "name": "Freelances", "parent_id": null },
    { "id": "lbl_003", "name": "Loyer & charges", "parent_id": null },
    { "id": "lbl_004", "name": "SaaS & abonnements", "parent_id": null },
    { "id": "lbl_005", "name": "Marketing", "parent_id": null }
  ]
}
```

### GET /memberships

List all team members with their roles and permissions.

**Request:**
```http
GET /v2/memberships
Authorization: <org-slug>:<secret-key>
```

### GET /bank_accounts

List all bank accounts for the organization.

**Request:**
```http
GET /v2/bank_accounts
Authorization: <org-slug>:<secret-key>
```

### POST /external_transfers

Initiate a SEPA wire transfer. The transfer will be created in pending status and must be approved by an authorized member in the Qonto app.

**Request:**
```http
POST /v2/external_transfers
Authorization: <org-slug>:<secret-key>
Content-Type: application/json

{
  "external_transfer": {
    "beneficiary_id": "ben_001",
    "debit_account_id": "acc_main",
    "reference": "SAL-2026-03-DURAND",
    "note": "Salaire Mars 2026 - P. Durand",
    "currency": "EUR",
    "amount": 3250.00,
    "scheduled_date": "2026-03-25"
  }
}
```

To create a transfer to a new beneficiary (by IBAN):

```json
{
  "external_transfer": {
    "beneficiary": {
      "name": "Pierre Durand",
      "iban": "FR7630006000011234567890189",
      "bic": "BNPAFRPPXXX"
    },
    "debit_account_id": "acc_main",
    "reference": "FACT-2026-03-042",
    "note": "Facture fournisseur Mars",
    "currency": "EUR",
    "amount": 2400.00,
    "label_id": "lbl_003"
  }
}
```

**Response (201 Created):**
```json
{
  "external_transfer": {
    "id": "ext_tr_789",
    "status": "pending_approval",
    "amount": 2400.00,
    "currency": "EUR",
    "reference": "FACT-2026-03-042",
    "beneficiary_name": "Pierre Durand",
    "scheduled_date": "2026-03-25"
  }
}
```

---

## Pagination

All list endpoints use page-based pagination:

```
?current_page=1&per_page=100
```

Always iterate through all pages using `meta.total_pages`:

```
page = 1
while page <= meta.total_pages:
    fetch page
    process results
    page += 1
```

---

## Workflows

### 1. Daily Cash Position Report

**Trigger:** Every business day at 8:00 AM CET.

**Steps:**

1. Call `GET /organization` to retrieve all bank account balances.
2. For each bank account, call `GET /transactions` with `settled_at_from` = yesterday 00:00, `settled_at_to` = yesterday 23:59, `status[]` = `completed`.
3. Paginate through all results to compute daily totals:
   - Total credits (inflows)
   - Total debits (outflows)
   - Net movement
4. Compare current balance to previous day (stored from last run).
5. Produce a summary report:
   - Opening balance (previous day)
   - Total inflows / outflows
   - Closing balance (current)
   - Top 5 largest transactions
6. Flag any balance below the configured minimum threshold (default: 50,000 EUR).

### 2. Monthly Reconciliation

**Trigger:** 2nd business day of each month.

**Steps:**

1. Retrieve all transactions for the previous calendar month using `updated_at_from` / `updated_at_to` and paginate fully.
2. Group transactions by `label_ids` to build a category-level expense breakdown.
3. Call `GET /labels` to resolve label IDs to human-readable names.
4. Cross-reference totals with Pennylane accounting entries (use the `pennylane-accounting` skill).
5. Identify discrepancies: transactions present in Qonto but not in Pennylane, or vice versa.
6. Generate a reconciliation report listing matched, unmatched, and discrepant items.

### 3. Anomaly Detection

Run after every transaction sync. Apply the following rules:

| Rule | Logic | Action |
|---|---|---|
| **Duplicate detection** | Two transactions with same amount, same counterparty, within 24 hours | Flag for manual review |
| **Unusual amount** | Transaction amount > 2x the 90-day rolling average for that label category | Flag for CFO review |
| **Uncategorized transaction** | Transaction with empty `label_ids` older than 48 hours | Notify Controller for categorization |
| **Large single transfer** | Any single debit > 10,000 EUR | Alert CFO immediately |
| **Weekend/holiday activity** | Transaction settled on non-business day | Flag for review |

### 4. Salary Payment Execution

**Trigger:** 23rd of each month (or previous business day).

**Steps:**

1. Receive payroll data from the `payroll-fr` skill (list of employees, net amounts, IBANs).
2. For each payment, call `POST /external_transfers` with:
   - `reference`: `SAL-YYYY-MM-LASTNAME`
   - `note`: `Salaire [Month] [Year] - [Full Name]`
   - `label_id`: salary label ID
   - `scheduled_date`: 25th of month (or previous business day)
3. Log each transfer ID and status.
4. Verify all transfers are in `pending_approval` status.
5. Notify the CFO that salary transfers are ready for approval in the Qonto app.
6. After approval, monitor `GET /transactions` for status changes to `completed`.

---

## Error Handling

| HTTP Status | Meaning | Action |
|---|---|---|
| 400 | Bad request (invalid parameters) | Log error details, fix request parameters |
| 401 | Invalid credentials | Check organization slug and secret key, rotate if compromised |
| 403 | Insufficient permissions | Verify API key permissions in Qonto settings |
| 404 | Resource not found | Verify the resource ID or slug exists |
| 422 | Validation error (e.g., invalid IBAN) | Parse error body for field-level errors, correct input |
| 429 | Rate limit exceeded | Wait for `Retry-After` seconds, then retry with exponential backoff |
| 500+ | Server error | Retry up to 3 times with exponential backoff, then alert ops |

---

## Data Model Reference

### Transaction Fields

| Field | Type | Description |
|---|---|---|
| `transaction_id` | string | Unique identifier |
| `amount` | float | Transaction amount |
| `amount_cents` | integer | Amount in cents (use for calculations to avoid float issues) |
| `currency` | string | ISO 4217 currency code |
| `side` | string | `credit` (incoming) or `debit` (outgoing) |
| `operation_type` | string | `transfer`, `card`, `direct_debit`, `check`, `qonto_fee` |
| `status` | string | `pending`, `completed`, `reversed`, `declined` |
| `settled_at` | datetime | When the transaction was settled |
| `emitted_at` | datetime | When the transaction was initiated |
| `label_ids` | array | Category label IDs |
| `counterparty` | string | Name of the other party |
| `reference` | string | Wire transfer reference |
| `note` | string | Internal note |
| `attachment_ids` | array | Attached receipt/invoice IDs |

---

## Security Considerations

- **Never log or expose** the secret key in plain text. Store in a secrets manager.
- **Read-only by default.** Only enable write permissions (transfers) for the payroll execution workflow.
- **Dual approval.** All transfers initiated via API still require manual approval in Qonto by an authorized user. Never bypass this.
- **IP allowlisting.** Configure Qonto API access to only accept requests from known server IPs.
- **Audit trail.** Log every API call with timestamp, endpoint, parameters (excluding secrets), and response status for compliance.
- **Credential rotation.** Rotate API keys quarterly. Immediately revoke and rotate if any suspected compromise.
- **Amount limits.** Set a programmatic maximum transfer amount (e.g., 50,000 EUR). Refuse to initiate transfers above this without explicit CFO override.
