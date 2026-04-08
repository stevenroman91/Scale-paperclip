---
name: pennylane-accounting
description: Integration with Pennylane API — invoices sync, accounting entries, financial statements generation
slug: pennylane-accounting
version: 0.1.0
tags:
  - finance
  - accounting
  - pennylane
---

# Pennylane Accounting

Integration with the Pennylane API for accounting, invoicing, and financial reporting across Scale Group entities.

## API Reference

### Base URL

```
https://app.pennylane.com/api/external/v1
```

### Authentication

Bearer token in the `Authorization` header:

```
Authorization: Bearer <api-token>
```

API tokens are generated in Pennylane under Settings > Developers > API Keys. Each Scale Group entity has its own token.

### Rate Limits

- 100 requests per minute per API token
- Implement exponential backoff on 429 responses
- Batch operations where possible to minimize API calls

---

## Endpoints

### GET /customer_invoices

List customer (sales) invoices with filters.

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `filter[status]` | string | `draft`, `pending`, `paid`, `late` |
| `filter[customer_id]` | string | Filter by customer |
| `filter[date_from]` | string | Invoice date lower bound (YYYY-MM-DD) |
| `filter[date_to]` | string | Invoice date upper bound (YYYY-MM-DD) |
| `filter[due_date_from]` | string | Due date lower bound |
| `filter[due_date_to]` | string | Due date upper bound |
| `page` | integer | Page number (default 1) |
| `per_page` | integer | Results per page (default 25, max 100) |

**Request:**
```http
GET /api/external/v1/customer_invoices?filter[status]=late&filter[date_from]=2026-03-01&per_page=50
Authorization: Bearer <token>
```

**Response:**
```json
{
  "invoices": [
    {
      "id": "inv_abc123",
      "invoice_number": "FA-2026-0042",
      "status": "late",
      "date": "2026-02-15",
      "due_date": "2026-03-15",
      "customer": {
        "id": "cust_001",
        "name": "Acme Corp",
        "email": "billing@acme.com"
      },
      "currency": "EUR",
      "amount": 5000.00,
      "tax_amount": 1000.00,
      "total_amount": 6000.00,
      "paid_amount": 0.00,
      "remaining_amount": 6000.00,
      "line_items": [
        {
          "label": "Consulting - March 2026",
          "quantity": 10,
          "unit_price": 500.00,
          "vat_rate": 20.0,
          "amount": 5000.00,
          "category_id": "cat_706000"
        }
      ],
      "pdf_url": "https://app.pennylane.com/invoices/inv_abc123.pdf"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total_pages": 1,
    "total_entries": 3
  }
}
```

### POST /customer_invoices

Create a new customer invoice.

**Request:**
```http
POST /api/external/v1/customer_invoices
Authorization: Bearer <token>
Content-Type: application/json

{
  "invoice": {
    "customer_id": "cust_001",
    "date": "2026-04-01",
    "due_date": "2026-04-30",
    "currency": "EUR",
    "line_items": [
      {
        "label": "SaaS License - April 2026",
        "quantity": 1,
        "unit_price": 2500.00,
        "vat_rate": 20.0,
        "category_id": "cat_706000",
        "product_id": "prod_001"
      }
    ],
    "special_mention": "Escompte de 2% pour paiement sous 10 jours"
  }
}
```

**Response (201 Created):**
```json
{
  "invoice": {
    "id": "inv_new456",
    "invoice_number": "FA-2026-0078",
    "status": "draft",
    "total_amount": 3000.00
  }
}
```

### GET /supplier_invoices

List supplier (purchase) invoices.

**Parameters:** Same filter pattern as customer invoices, plus:

| Parameter | Type | Description |
|---|---|---|
| `filter[supplier_id]` | string | Filter by supplier |
| `filter[archived]` | boolean | Include archived invoices |

**Request:**
```http
GET /api/external/v1/supplier_invoices?filter[status]=pending&per_page=100
Authorization: Bearer <token>
```

### GET /categories

Retrieve the chart of accounts (plan comptable).

**Request:**
```http
GET /api/external/v1/categories
Authorization: Bearer <token>
```

**Response:**
```json
{
  "categories": [
    { "id": "cat_601000", "number": "601000", "label": "Achats de matieres premieres" },
    { "id": "cat_606300", "number": "606300", "label": "Fournitures d'entretien" },
    { "id": "cat_613200", "number": "613200", "label": "Locations immobilieres" },
    { "id": "cat_621000", "number": "621000", "label": "Personnel exterieur" },
    { "id": "cat_641000", "number": "641000", "label": "Remunerations du personnel" },
    { "id": "cat_645000", "number": "645000", "label": "Charges de securite sociale" },
    { "id": "cat_706000", "number": "706000", "label": "Prestations de services" },
    { "id": "cat_707000", "number": "707000", "label": "Ventes de marchandises" }
  ]
}
```

### GET /products

Retrieve the product catalog.

**Request:**
```http
GET /api/external/v1/products
Authorization: Bearer <token>
```

### GET /customers

List all customers.

**Request:**
```http
GET /api/external/v1/customers?page=1&per_page=100
Authorization: Bearer <token>
```

**Response:**
```json
{
  "customers": [
    {
      "id": "cust_001",
      "name": "Acme Corp",
      "email": "billing@acme.com",
      "address": "12 Rue de la Paix, 75002 Paris",
      "vat_number": "FR12345678901",
      "payment_conditions": "30_days",
      "outstanding_amount": 6000.00
    }
  ]
}
```

### GET /suppliers

List all suppliers.

**Request:**
```http
GET /api/external/v1/suppliers?page=1&per_page=100
Authorization: Bearer <token>
```

### GET /company

Retrieve company information and fiscal year settings.

**Request:**
```http
GET /api/external/v1/company
Authorization: Bearer <token>
```

---

## Workflows

### 1. Monthly P&L Generation

**Trigger:** 5th business day of each month.

**Steps:**

1. Call `GET /customer_invoices` with `filter[date_from]` and `filter[date_to]` for the previous month. Paginate to collect all invoices.
2. Call `GET /supplier_invoices` with the same date range. Paginate fully.
3. Call `GET /categories` to resolve category IDs to PCG account numbers and labels.
4. Aggregate by category:
   - **Revenue (Class 7):** Sum of customer invoices grouped by category (706xxx, 707xxx, etc.)
   - **Purchases (Class 6):** Sum of supplier invoices by category (601xxx-606xxx)
   - **Personnel costs (641xxx-645xxx):** From payroll data (cross-reference `payroll-fr` skill)
   - **External services (611xxx-628xxx):** From supplier invoices
5. Calculate:
   - Gross margin = Revenue - Cost of goods sold
   - EBITDA = Gross margin - Operating expenses
   - Net result = EBITDA - Depreciation - Financial charges - Tax
6. Compare with previous month and same month last year for variance analysis.
7. Generate formatted P&L report.

### 2. Invoice Sync Workflow

**Trigger:** Daily at 9:00 AM CET.

**Steps:**

1. Retrieve all `pending` and `late` customer invoices from Pennylane.
2. Cross-reference with Qonto transactions (via `qonto-banking` skill) to identify payments received.
3. For each matched payment:
   - Verify the amount matches (tolerance: 0.01 EUR for rounding).
   - If matched, update the invoice status to `paid` in Pennylane.
4. For `late` invoices (past due date with no payment):
   - First reminder: 7 days past due.
   - Second reminder: 15 days past due.
   - Escalation to CFO: 30 days past due.
5. Log all sync actions for audit trail.

### 3. Financial Statements Export

**Trigger:** On demand, typically for quarterly and annual closings.

**Steps:**

1. Call `GET /company` to confirm fiscal year boundaries.
2. Retrieve all customer and supplier invoices for the fiscal period.
3. Build the following statements:
   - **Bilan (Balance Sheet):** Assets (Class 1-5 debit) vs. Liabilities (Class 1-5 credit)
   - **Compte de Resultat (Income Statement):** Revenue (Class 7) minus Expenses (Class 6)
   - **Balance Generale:** Trial balance of all accounts
   - **Grand Livre:** Detailed journal by account
4. Generate FEC (Fichier des Ecritures Comptables) export:
   - Format: pipe-delimited text file conforming to Article A 47 A-1 du LPF
   - Fields: JournalCode, JournalLib, EcritureNum, EcritureDate, CompteNum, CompteLib, CompAuxNum, CompAuxLib, PieceRef, PieceDate, EcritureLib, Debit, Credit, EcrLettrage, DateLettrage, ValidDate, Montantdevise, Idevise
5. Validate FEC file using checksum rules before export.

### 4. Accounts Receivable Aging

**Trigger:** Weekly on Monday at 8:00 AM CET.

**Steps:**

1. Retrieve all customer invoices with `filter[status]=pending` and `filter[status]=late`.
2. Calculate age buckets:
   - Current (not yet due)
   - 1-30 days overdue
   - 31-60 days overdue
   - 61-90 days overdue
   - 90+ days overdue
3. Compute total outstanding per customer and per age bucket.
4. Flag accounts with total outstanding > 10,000 EUR or age > 60 days for CFO review.
5. Generate AR aging report.

---

## Error Handling

| HTTP Status | Meaning | Action |
|---|---|---|
| 400 | Malformed request | Check JSON syntax and required fields |
| 401 | Invalid or expired token | Refresh API token in Pennylane settings |
| 403 | Insufficient scope | Verify token permissions cover the endpoint |
| 404 | Resource not found | Confirm the resource ID exists |
| 422 | Validation error | Parse `errors` array for field-level messages, correct and retry |
| 429 | Rate limited | Exponential backoff, starting at 2 seconds |
| 500+ | Server error | Retry up to 3 times, then alert ops team |

---

## Data Model: French Chart of Accounts (PCG) Mapping

| Class | Range | Description |
|---|---|---|
| 1 | 100000-199999 | Capitaux (equity and long-term liabilities) |
| 2 | 200000-299999 | Immobilisations (fixed assets) |
| 3 | 300000-399999 | Stocks (inventory) |
| 4 | 400000-499999 | Tiers (receivables and payables) |
| 5 | 500000-599999 | Financier (cash and bank) |
| 6 | 600000-699999 | Charges (expenses) |
| 7 | 700000-799999 | Produits (revenue) |

Key accounts for Scale Group:

| Account | Label | Usage |
|---|---|---|
| 401000 | Fournisseurs | Supplier payables |
| 411000 | Clients | Customer receivables |
| 512000 | Banque (Qonto) | Main bank account |
| 512100 | Banque (Revolut) | Secondary bank account |
| 606300 | Fournitures administratives | Office supplies |
| 613200 | Locations immobilieres | Office rent |
| 621000 | Personnel exterieur | Freelancer costs |
| 641000 | Remunerations du personnel | Salaries |
| 645000 | Charges sociales | Social charges |
| 706000 | Prestations de services | Consulting revenue |

---

## Security Considerations

- **Token storage.** Store API tokens in a secrets manager. Never embed tokens in code or configuration files.
- **Read-only preference.** Use read-only tokens for reporting workflows. Only use write-enabled tokens for invoice creation workflows.
- **Data sensitivity.** Customer and supplier data (names, addresses, VAT numbers) is personal data under RGPD. Do not log full response bodies.
- **FEC compliance.** The FEC export is a legally mandated format. Validate output before submission to avoid penalties.
- **Reconciliation integrity.** Never auto-mark invoices as paid without matching a confirmed bank transaction. Always require amount match within tolerance.
- **Audit logging.** Log every write operation (invoice creation, status changes) with operator identity, timestamp, and request payload.
