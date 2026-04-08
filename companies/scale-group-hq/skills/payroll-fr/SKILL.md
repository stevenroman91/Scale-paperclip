---
name: payroll-fr
description: French payroll management — social charges calculation, DSN declarations, payslip generation
slug: payroll-fr
version: 0.1.0
tags:
  - hr
  - payroll
  - france
  - social-charges
---

# Payroll FR

French payroll management for Scale Group: social charges calculation, DSN declarations, payslip generation, and payment execution.

## Regulatory Framework

Scale Group entities operate under the **Convention Collective Syntec (IDCC 1486)**, applicable to consulting, engineering, and IT services companies in France. All calculations and rules below follow Syntec provisions unless otherwise noted.

---

## Salary Structure

### From Gross to Net: Complete Calculation

```
Salaire Brut
  - Cotisations salariales (employee charges)
  = Net avant impot (net before tax)
  - Prelevement a la Source (PAS — income tax withholding)
  = Net a payer (take-home pay)
```

### Reference Values (2026)

| Parameter | Value | Notes |
|---|---|---|
| SMIC mensuel brut | 1,766.92 EUR | Based on 35h/week, may be updated annually |
| Plafond Securite Sociale (PMSS) | 3,864.00 EUR/month | 2026 estimate, updated each January |
| Plafond annuel (PASS) | 46,368.00 EUR/year | PMSS x 12 |
| Minimum Syntec (Position 1.1, coeff 95) | 1,850.00 EUR | Syntec minimum above SMIC |
| Valeur du point Syntec | 22.03 EUR | Minimum = coefficient x valeur du point |

### Syntec Classification Grid

| Position | Coefficient | Minimum Brut Mensuel | Typical Role |
|---|---|---|---|
| 1.1 | 95 | 1,850.00 EUR | Junior consultant, SDR |
| 2.1 | 115 | 2,533.45 EUR | Consultant, Account Executive |
| 2.3 | 150 | 3,304.50 EUR | Senior consultant, Tech Lead |
| 3.1 | 170 | 3,745.10 EUR | Manager, Senior Engineer |
| 3.2 | 210 | 4,626.30 EUR | Senior Manager, Director |
| 3.3 | 270 | 5,948.10 EUR | VP, C-level |

---

## Social Charges Breakdown

### Employee Charges (Cotisations Salariales) — ~22-25% of gross

| Charge | Base | Rate | Cap |
|---|---|---|---|
| Securite sociale maladie | Gross | 0.00% | — (0% since 2018 for most employees) |
| Securite sociale vieillesse (plafonnee) | Gross up to PMSS | 6.90% | PMSS |
| Securite sociale vieillesse (deplafonnee) | Total gross | 0.40% | None |
| Assurance chomage | Gross up to 4x PMSS | 0.00% | — (0% since Oct 2018) |
| Retraite complementaire AGIRC-ARRCO T1 | Gross up to PMSS | 3.15% | PMSS |
| Retraite complementaire AGIRC-ARRCO T2 | Gross between PMSS and 8x PMSS | 8.64% | 8x PMSS |
| CEG (Contribution d'Equilibre Generale) T1 | Gross up to PMSS | 0.86% | PMSS |
| CEG T2 | Gross between PMSS and 8x PMSS | 1.08% | 8x PMSS |
| CSG deductible | 98.25% of gross + employer-paid benefits | 6.80% | None |
| CSG non-deductible | 98.25% of gross + employer-paid benefits | 2.40% | None |
| CRDS | 98.25% of gross + employer-paid benefits | 0.50% | None |
| Mutuelle salariale | Forfait or % | ~1.00% | Per contract |
| Prevoyance salariale (Syntec cadres) | Gross up to PMSS | 0.50% | PMSS (minimum Syntec) |

### Employer Charges (Cotisations Patronales) — ~42-47% of gross

| Charge | Base | Rate | Cap |
|---|---|---|---|
| Securite sociale maladie | Total gross | 7.00% | None (13% if salary < 2.5x SMIC: reduced to 7%) |
| Securite sociale vieillesse (plafonnee) | Gross up to PMSS | 8.55% | PMSS |
| Securite sociale vieillesse (deplafonnee) | Total gross | 2.02% | None |
| Allocations familiales | Total gross | 3.45% | None (5.25% if salary > 3.5x SMIC) |
| Assurance chomage | Gross up to 4x PMSS | 4.05% | 4x PMSS |
| AGS (assurance garantie salaires) | Gross up to 4x PMSS | 0.15% | 4x PMSS |
| Retraite complementaire AGIRC-ARRCO T1 | Gross up to PMSS | 4.72% | PMSS |
| Retraite complementaire AGIRC-ARRCO T2 | Gross between PMSS and 8x PMSS | 12.95% | 8x PMSS |
| CEG T1 | Gross up to PMSS | 1.29% | PMSS |
| CEG T2 | Gross between PMSS and 8x PMSS | 1.62% | 8x PMSS |
| Accidents du travail (AT/MP) | Total gross | ~1.00% | None (rate varies by SIRET) |
| Contribution formation professionnelle | Total gross | 1.00% | None (0.55% if <11 employees) |
| Taxe d'apprentissage | Total gross | 0.68% | None |
| Contribution au dialogue social | Total gross | 0.016% | None |
| Mutuelle patronale | Forfait or % | ~1.50% | Per contract (minimum 50% of total) |
| Prevoyance patronale (Syntec cadres) | Gross up to PMSS | 1.50% | PMSS (minimum Syntec) |
| Forfait social (on employer-paid prevoyance/mutuelle) | Employer contributions | 8.00% | On certain benefits |

### Reduction Generale (ex-Fillon)

For salaries below 1.6x SMIC, a degressive reduction applies on employer charges:

```
Coefficient = (T / 0.6) x [(1.6 x SMIC annuel / salaire brut annuel) - 1]
T = total rate of eligible charges (approximately 0.3194 for companies > 50 employees)
Reduction = Salaire brut annuel x Coefficient
```

The reduction is capped at the total eligible charges. It decreases linearly and reaches zero at 1.6x SMIC.

---

## Workflows

### 1. Monthly Payroll Calculation

**Trigger:** 20th of each month (preparation for payment by 25th).

**Steps:**

1. **Collect inputs** for each employee:
   - Gross salary (from contract/latest amendment)
   - Variable pay / bonuses for the period
   - Overtime hours (heures supplementaires), if any — first 8h at +25%, beyond at +50%
   - Absences: conges payes (no deduction if within rights), arret maladie (IJSS offset), conge sans solde (deduction)
   - Avantages en nature (company car, meals, etc.) — add to gross for charge calculation

2. **Calculate employee charges** using the rate table above:
   - Apply each charge line to the appropriate base (capped or uncapped)
   - Sum all employee contributions = total cotisations salariales

3. **Calculate employer charges** using the rate table above:
   - Check if Reduction Generale applies (salary < 1.6x SMIC)
   - Apply AT/MP rate specific to the entity's SIRET
   - Sum all employer contributions = total cotisations patronales

4. **Calculate net avant impot:**
   ```
   Net avant impot = Brut - Cotisations salariales
   ```

5. **Apply Prelevement a la Source (PAS):**
   - Use the employee's individualized rate (transmitted by DGFIP via DSN return)
   - If no rate available, use the default grid (taux neutre) based on monthly net imposable
   ```
   PAS = Net imposable x Taux PAS
   Net a payer = Net avant impot - PAS
   ```

6. **Compute total employer cost:**
   ```
   Cout employeur = Brut + Cotisations patronales
   ```

7. **Generate payslip** with all mandatory French mentions:
   - Employee identity, job title, Syntec classification (position, coefficient)
   - Period, hours worked, gross salary
   - Each charge line (employee and employer portions)
   - Net avant impot, PAS amount and rate, net a payer
   - Cumuls annuels (year-to-date totals)
   - Conges payes balance (acquired, taken, remaining)

### 2. DSN Declaration

**Trigger:** By the 15th of the month following the pay period (e.g., March payroll DSN due by April 15th). Companies > 50 employees: by the 5th.

**Types of DSN:**

| Type | Trigger | Content |
|---|---|---|
| DSN mensuelle | Monthly | All employees: salaries, charges, PAS |
| DSN evenementielle — Arret de travail | Within 5 days of sick leave start | Employee ID, start date, last day worked |
| DSN evenementielle — Fin de contrat | Within 5 days of contract end | Employee ID, end date, reason, STC details |
| DSN evenementielle — Reprise anticipee | When employee returns early from leave | Employee ID, return date |

**Monthly DSN Steps:**

1. Compile all payroll data for the period into DSN-compatible format.
2. Validate data integrity:
   - NIR (numero de securite sociale) present for all employees
   - Consistency between declared gross and calculated charges
   - PAS amounts match DGFIP-provided rates
3. Generate the DSN file (NEODES format, XML-based).
4. Submit electronically via net-entreprises.fr or the DSN portal.
5. Monitor return messages (CRM — Compte-Rendu Metier) for errors or warnings.
6. Correct and resubmit if errors are flagged (common: NIR mismatch, rate discrepancies).

### 3. Freelancer Payment Processing

**Trigger:** Upon receipt of a valid invoice from a freelancer.

**Steps:**

1. **Receive invoice** and validate:
   - Invoice contains all legal mentions (SIRET, TVA number if applicable, detailed description)
   - Amount matches the agreed rate/contract
   - Services were actually delivered (confirmation from project manager)
   - Check for auto-entrepreneur TVA franchise mention if applicable

2. **Tax treatment:**
   - No social charges for the company (freelancer handles their own)
   - TVA: if freelancer is TVA-registered, verify TVA amount; if auto-entrepreneur below threshold, no TVA
   - Withholding: none for French freelancers; for non-EU freelancers, check withholding tax treaty obligations

3. **Approve and schedule payment:**
   - Submit for manager approval (project manager + CFO for amounts > 5,000 EUR)
   - Once approved, create SEPA transfer via `qonto-banking` or `revolut-business` skill
   - Reference: `FREELANCE-YYYY-MM-LASTNAME-INVNUMBER`

4. **Record in accounting:**
   - Debit: 621000 (Personnel exterieur) or 604000 (Achats d'etudes et prestations)
   - Credit: 401000 (Fournisseurs)
   - Sync with Pennylane via `pennylane-accounting` skill

### 4. Payroll Simulation

**Trigger:** On demand (hiring decision, raise negotiation).

**Input:** Desired gross salary (brut mensuel).

**Output table:**

```
| Element                    | Amount     |
|----------------------------|------------|
| Salaire brut               | 4,000.00   |
| Cotisations salariales     | -920.00    |
| Net avant impot            | 3,080.00   |
| PAS (estimated 7.5%)       | -231.00    |
| Net a payer (estimated)    | 2,849.00   |
| Cotisations patronales     | +1,760.00  |
| Cout total employeur       | 5,760.00   |
| Ratio cout/net             | 2.02x      |
```

---

## Payroll Calendar

| Day of Month | Action |
|---|---|
| 1st-5th | Collect variable elements (overtime, absences, bonuses) |
| 10th-15th | Calculate payroll, generate payslips for review |
| 15th-18th | Manager and CFO validation of payroll |
| 20th | Finalize payslips, send to employees |
| 23rd | Prepare salary transfers via Qonto/Revolut |
| 25th | Salary payment date (credited to employee accounts) |
| 5th or 15th (M+1) | Submit DSN declaration |
| 15th (M+1) | Pay social charges to URSSAF and pension funds |

---

## Error Handling and Compliance Risks

| Risk | Prevention | Response |
|---|---|---|
| Incorrect charge rates | Update rates from URSSAF baremes each January and upon mid-year changes | Recalculate affected payslips, issue complementary bulletin |
| Missed DSN deadline | Calendar alerts at D-5, D-3, D-1 | Late submission penalty: 1.5% of charges per missing month + 51 EUR per employee per month |
| SMIC violation | Automated check: no gross salary below SMIC for full-time | Immediate correction, back-pay if applicable |
| PAS rate mismatch | Use DGFIP-returned individual rate; fall back to neutral rate | Contact DGFIP for rate clarification |
| Missing payslip mentions | Template includes all mandatory fields per Article R3243-1 Code du travail | Audit payslip template quarterly |
| Overtime cap exceeded | Track: max 220 overtime hours/year per Syntec convention | Alert manager before cap is reached |

---

## Data Model

### Employee Payroll Record

| Field | Type | Description |
|---|---|---|
| `employee_id` | string | Internal identifier |
| `nir` | string | Numero de securite sociale (13 digits + key) |
| `last_name` | string | Nom de famille |
| `first_name` | string | Prenom |
| `date_of_birth` | date | Date de naissance |
| `entry_date` | date | Date d'entree |
| `contract_type` | string | `CDI`, `CDD`, `apprentissage`, `stage` |
| `syntec_position` | string | e.g., `2.1` |
| `syntec_coefficient` | integer | e.g., `115` |
| `gross_monthly` | float | Salaire brut mensuel contractuel |
| `work_hours` | float | Heures mensuelles (151.67 for 35h/week) |
| `pas_rate` | float | Taux de prelevement a la source (0.00-0.43) |
| `iban` | string | Compte bancaire pour virement |
| `mutual_option` | string | Mutuelle family option (isolee, duo, famille) |

---

## Security Considerations

- **Data classification.** Payroll data is highly sensitive personal data (RGPD Article 9 for health-related absences). Apply strict access controls.
- **NIR handling.** Social security numbers must be encrypted at rest and never logged in plain text.
- **Payslip distribution.** Deliver payslips via secure channel only (encrypted email or employee portal). Never send via unencrypted email or messaging.
- **Audit trail.** Every payroll calculation must be logged with version, operator, and timestamp. Payslips are legal documents with 5-year retention requirement (50 years recommended for career reconstruction).
- **Segregation of duties.** The person calculating payroll should not be the same person approving payments. Calculation by Payroll Manager, approval by CFO.
- **Backup.** Monthly payroll data and DSN files must be backed up and archived for at least 5 years (legal obligation) and preferably 10 years.
