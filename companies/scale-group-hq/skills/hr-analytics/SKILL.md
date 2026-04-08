---
name: hr-analytics
description: HR metrics — turnover, satisfaction, cost per hire, time-to-hire, headcount evolution
slug: hr-analytics
version: 0.1.0
tags:
  - hr
  - analytics
  - metrics
---

# HR Analytics

HR metrics, formulas, benchmarks, reporting templates, and alert thresholds for Scale Group workforce management and strategic decision-making.

## Key Metrics and Formulas

### 1. Turnover Rate

**Formula:**

```
Turnover Rate (%) = (Number of Departures during period / Average Headcount during period) x 100
```

Where:
```
Average Headcount = (Headcount at start of period + Headcount at end of period) / 2
```

**Variants:**

| Variant | Formula | Use |
|---|---|---|
| Voluntary turnover | Resignations / Avg headcount x 100 | Measures employee satisfaction and retention |
| Involuntary turnover | Terminations / Avg headcount x 100 | Measures hiring quality and performance management |
| Early turnover | Departures within first year / Total new hires x 100 | Measures onboarding effectiveness |
| Regretted turnover | High-performer departures / Avg headcount x 100 | Most critical — measures loss of key talent |

**SQL Reference:**

```sql
SELECT
  subsidiary,
  COUNT(*) FILTER (WHERE departure_date BETWEEN :start AND :end) AS departures,
  (COUNT(*) FILTER (WHERE hire_date <= :end AND (departure_date IS NULL OR departure_date >= :start))) AS avg_headcount,
  ROUND(
    COUNT(*) FILTER (WHERE departure_date BETWEEN :start AND :end)::NUMERIC /
    NULLIF(COUNT(*) FILTER (WHERE hire_date <= :end AND (departure_date IS NULL OR departure_date >= :start)), 0) * 100,
    1
  ) AS turnover_rate
FROM employees
GROUP BY subsidiary;
```

**Calculation example:**
```
Start of Q1: 42 employees
End of Q1: 45 employees
Departures during Q1: 3 (2 voluntary, 1 involuntary)
Average headcount: (42 + 45) / 2 = 43.5
Quarterly turnover: 3 / 43.5 x 100 = 6.9%
Annualized turnover: 6.9% x 4 = 27.6%
```

### 2. Time-to-Hire

**Formula:**

```
Time-to-Hire (days) = Date of Offer Acceptance - Date of Job Opening Publication
```

**Breakdown by stage:**

```
Time-to-Hire = Sourcing Time + Screening Time + Interview Time + Offer Time
```

Track each stage independently to identify bottlenecks:

| Stage | Measurement | Target (days) |
|---|---|---|
| Sourcing to First Screen | Days from posting to first phone screen | 7-10 |
| Screen to Technical Interview | Days from phone screen to technical interview | 5-7 |
| Technical to Culture Fit | Days from technical to culture fit interview | 3-5 |
| Culture Fit to Offer | Days from last interview to offer sent | 2-3 |
| Offer to Acceptance | Days from offer sent to candidate decision | 3-5 |
| **Total** | | **20-30** |

**Benchmarks by role type:**

| Role | Target | Acceptable | Alert |
|---|---|---|---|
| SDR / Junior Sales | 20-25 days | 25-35 days | > 35 days |
| Account Executive | 25-35 days | 35-45 days | > 45 days |
| Tech / Engineer | 30-40 days | 40-50 days | > 50 days |
| Manager / Senior | 35-45 days | 45-60 days | > 60 days |

### 3. Cost per Hire

**Formula:**

```
Cost per Hire (EUR) = (Internal Costs + External Costs) / Number of Hires
```

**Cost components:**

| Category | Items | Typical Range |
|---|---|---|
| **Internal costs** | Recruiter salary (pro-rated time), hiring manager interview time, HR admin time, onboarding costs (training, equipment) | 2,000-5,000 EUR/hire |
| **External costs** | Job board fees, LinkedIn Recruiter license (pro-rated), headhunter fees, employer branding, candidate travel reimbursement | 1,000-15,000 EUR/hire |

**Calculation example:**
```
Q1 hires: 5
Internal costs: Recruiter time (40h x 35 EUR/h = 1,400), Manager time (10h x 60 EUR/h = 600),
  Equipment (5 x 1,200 EUR = 6,000), Training (5 x 500 EUR = 2,500) = 10,500 EUR
External costs: LinkedIn Recruiter (2,000 EUR/quarter), Welcome to the Jungle (1,250 EUR/quarter),
  Headhunter for 1 senior role (12,000 EUR) = 15,250 EUR
Total: 25,750 EUR
Cost per hire: 25,750 / 5 = 5,150 EUR
```

### 4. Employee Satisfaction (eNPS)

**Formula:**

```
eNPS = % Promoters - % Detractors
```

**Survey question:** "On a scale of 0-10, how likely are you to recommend Scale Group as a place to work?"

| Category | Score | Definition |
|---|---|---|
| Promoters | 9-10 | Enthusiastic, loyal employees |
| Passives | 7-8 | Satisfied but not engaged |
| Detractors | 0-6 | Unsatisfied, risk of departure |

**SQL Reference:**

```sql
SELECT
  ROUND(
    (COUNT(*) FILTER (WHERE enps_score >= 9)::NUMERIC / COUNT(*) * 100) -
    (COUNT(*) FILTER (WHERE enps_score <= 6)::NUMERIC / COUNT(*) * 100),
    1
  ) AS enps
FROM satisfaction_surveys
WHERE survey_date BETWEEN :start AND :end;
```

**Calculation example:**
```
40 respondents out of 45 employees (89% response rate)
Promoters (9-10): 18 employees = 45%
Passives (7-8): 14 employees = 35%
Detractors (0-6): 8 employees = 20%
eNPS = 45% - 20% = +25
```

**Survey cadence:** Quarterly, anonymous, with 3-5 follow-up questions on specific themes (management, growth, work-life balance, compensation, culture).

**Follow-up category ratings (1-5 scale):**

| Category | Question |
|---|---|
| Management | "My manager supports my development and gives me clear direction." |
| Work-life balance | "I can maintain a healthy balance between work and personal life." |
| Career growth | "I see clear growth opportunities for myself at Scale Group." |
| Compensation | "I feel fairly compensated for my work." |
| Culture | "I feel a sense of belonging and alignment with Scale Group's values." |

### 5. Absenteeism Rate

**Formula:**

```
Absenteeism Rate (%) = (Total Absent Days / Total Possible Working Days) x 100
```

Where:
```
Total Possible Working Days = Headcount x Working Days in Period
```

Working days exclude weekends and jours feries. Absent days include sick leave and unjustified absences. Conges payes, RTT, maternity/paternity leave, and formation professionnelle are excluded from absent days (they are planned, legal entitlements).

**Calculation example:**
```
Month: March 2026 (22 working days)
Headcount: 45
Total possible working days: 45 x 22 = 990
Total absent days: 28 (sick leave: 20, unjustified: 3, personal: 5)
Absenteeism rate: 28 / 990 x 100 = 2.83%
```

### 6. Revenue per Employee

**Formula:**

```
Revenue per Employee (EUR) = Total Revenue / Average Headcount
```

**Variants:**

| Variant | Formula | Use |
|---|---|---|
| Gross revenue per employee | Total revenue / Avg headcount | Overall productivity benchmark |
| Gross margin per employee | Gross margin / Avg headcount | Profitability per head |
| Revenue per revenue-generating employee | Revenue / Sales + CS headcount | Sales team productivity |

### 7. Training Hours per Employee

**Formula:**

```
Training Hours per Employee = Total Training Hours Delivered / Average Headcount
```

Track by:
- Training type: ScaleAcademy modules, external training, conferences, certifications
- Department: Sales, Tech, Operations, Finance, HR
- Mandatory vs. optional
- Completion rate for assigned modules

### 8. Retention Rate

**Formula:**

```
Retention Rate (%) = ((Employees at End of Period - New Hires during Period) / Employees at Start of Period) x 100
```

This measures how many employees who were present at the start of the period are still present at the end.

**Calculation example:**
```
Start of year: 38 employees
End of year: 48 employees
New hires during year: 15
Employees retained from start: 48 - 15 = 33
Retention rate: 33 / 38 x 100 = 86.8%
Implied turnover: 100% - 86.8% = 13.2% (5 departures from original 38)
```

### 9. Payroll-to-Revenue Ratio

**Formula:**

```
Payroll Ratio (%) = (Total Payroll Cost / Total Revenue) x 100
```

Where Total Payroll Cost = gross salaries + employer social charges (~45% of gross).

**Benchmark for B2B agencies/services:** 50-65% is healthy. Above 70% signals overstaffing or underpricing.

---

## Benchmarks for French B2B Startups (10-50 employees)

| Metric | Good | Average | Needs Attention |
|---|---|---|---|
| Annual voluntary turnover | < 12% | 12-20% | > 20% |
| Time-to-hire | < 30 days | 30-45 days | > 45 days |
| Cost per hire (non-exec) | < 4,000 EUR | 4,000-7,000 EUR | > 7,000 EUR |
| Cost per hire (executive) | < 15,000 EUR | 15,000-25,000 EUR | > 25,000 EUR |
| eNPS | > 40 | 20-40 | < 20 |
| Absenteeism rate | < 3% | 3-5% | > 5% |
| Revenue per employee | > 150,000 EUR | 100,000-150,000 EUR | < 100,000 EUR |
| Training hours per employee/year | > 30h | 15-30h | < 15h |
| Retention rate (annual) | > 85% | 75-85% | < 75% |
| Offer acceptance rate | > 85% | 70-85% | < 70% |
| Early turnover (< 1 year) | < 10% | 10-20% | > 20% |
| Payroll-to-revenue ratio | < 55% | 55-65% | > 65% |

---

## Alert Thresholds

Automatic alerts should fire when thresholds are breached:

| Metric | Threshold | Severity | Notification |
|---|---|---|---|
| Annual turnover rate (rolling 12 months) | > 20% | High | CHRO + CEO |
| Annual turnover rate (rolling 12 months) | > 30% | Critical | CHRO + CEO + Board |
| Monthly turnover spike | > 2 departures in single month (if headcount < 50) | Medium | CHRO |
| Time-to-hire (single role) | > 45 days | Medium | Talent Acquisition + Hiring Manager |
| Average time-to-hire (quarterly) | > 40 days | High | CHRO |
| eNPS | < 30 | High | CHRO + CEO |
| eNPS | < 10 | Critical | CHRO + CEO |
| eNPS drop | > 15 points quarter-over-quarter | Critical | CHRO + CEO |
| Satisfaction category score | < 3.0 / 5 | Medium | CHRO + People Dev |
| Satisfaction category score | < 2.5 / 5 | High | CHRO + People Dev |
| Absenteeism rate (monthly) | > 5% | Medium | CHRO |
| Absenteeism rate (monthly) | > 8% | High | CHRO + CEO |
| Revenue per employee (quarterly) | < 100,000 EUR annualized | High | CFO + CEO |
| Payroll-to-revenue ratio | > 65% | Medium | CFO + CEO |
| Payroll-to-revenue ratio | > 75% | Critical | CFO + CEO |
| Offer rejection rate (quarterly) | > 30% | Medium | CHRO + Talent Acquisition |
| Early turnover (rolling 12 months) | > 20% | High | CHRO + Hiring Managers |
| Training hours per employee (quarterly) | < 5h | Medium | People Development |
| Survey response rate | < 70% | Medium | CHRO |

---

## Reporting Templates

### Monthly HR Dashboard

**Audience:** CHRO, CEO, leadership team.
**Deadline:** 5th business day of following month.

**Sections:**

1. **Headcount Summary**
   - Total headcount (by entity: ScaleFast, ScaleCall, ScaleAcademy, ScaleHQ)
   - By contract type: CDI, CDD, Freelance, Alternance
   - New hires this month
   - Departures this month (voluntary / involuntary, with reasons)
   - Open positions and hiring progress

2. **Recruitment Funnel**
   - Pipeline snapshot: candidates per stage
   - Hires completed vs. target
   - Time-to-hire for closed positions this month
   - Source effectiveness (hires by channel, cost by channel)

3. **Retention and Satisfaction**
   - Rolling 12-month turnover rate (voluntary and total)
   - Latest eNPS score (if survey month) with trend chart
   - Category satisfaction scores
   - Notable departures and exit interview themes

4. **Compensation**
   - Total payroll cost (masse salariale brute + charges patronales)
   - Payroll-to-revenue ratio
   - Average employer cost per employee
   - Month-over-month evolution

5. **Absenteeism**
   - Monthly rate and 3-month rolling trend
   - Breakdown by reason (sick, personal, unjustified)

6. **Training**
   - Hours delivered this month
   - ScaleAcademy module completion rates
   - Upcoming training scheduled

7. **Key Actions**
   - Items requiring leadership attention
   - Progress on previous month's action items

**Template format:**

```
## Rapport RH — {month} {year}

### Effectifs
- Headcount total: {n} (+{new_hires} arrivees, -{departures} departs)
- Par filiale: ScaleFast {n}, ScaleCall {n}, ScaleAcademy {n}, ScaleHQ {n}
- CDI: {n} | CDD: {n} | Freelance: {n}

### Turnover
- Taux mensuel: {x}% (annualise: {y}%)
- Departs: {names} — motifs: {reasons}

### Satisfaction
- eNPS: {score} (vs {prev_quarter}: {delta})
- Points forts: {top_categories}
- Points d'attention: {low_categories}

### Recrutement
- Postes ouverts: {n}
- Time-to-hire moyen: {days} jours
- Pipeline: {sourcing} > {screening} > {interview} > {offer}

### Masse salariale
- Total brut + charges: {amount} EUR
- Ratio MS/CA: {x}%
- Evolution M-1: {delta}%
```

### Quarterly HR Review

**Audience:** Board / executive committee.
**Deadline:** 10th business day after quarter end.

**Additional sections beyond monthly:**

- Headcount evolution chart (12-month trend)
- Turnover analysis by department, seniority, tenure band
- Compensation benchmarking update (vs. market via Figures.hr, Glassdoor)
- Training completion rates and ScaleAcademy usage metrics
- Diversity metrics (gender ratio by level, age distribution)
- Budget vs. actual for HR spend
- Workforce planning: projected headcount for next 2 quarters

### Annual HR Report

**Audience:** Board, investors, auditors.
**Deadline:** End of January for previous year.

**Additional sections beyond quarterly:**

- Full-year headcount bridge: start headcount + hires - departures = end headcount
- Year-over-year metric comparisons (all KPIs)
- Employer brand metrics (LinkedIn followers, Glassdoor rating, application volume)
- Legal compliance summary (DPAE filings, DSN submissions, RGPD register)
- HR budget execution vs. plan (variance analysis)
- Strategic workforce plan for next year (hiring plan, training budget, key initiatives)
- Compensation review outcomes and pay equity analysis

---

## Data Sources and Integration

| Data Point | Source | Refresh Frequency |
|---|---|---|
| Headcount, contracts, entry/exit dates | HR system (employees table) | Real-time |
| Salary data, payroll cost | `payroll-fr` skill | Monthly |
| Recruitment pipeline, time-to-hire | `recruitment-pipeline` skill | Real-time |
| Training records | ScaleAcademy + training tracker | Weekly |
| Absence data | Leave management system (absences table) | Real-time |
| Revenue data | `pennylane-accounting` skill | Monthly |
| Employee satisfaction (eNPS) | Quarterly survey (satisfaction_surveys table) | Quarterly |
| LinkedIn employer metrics | `linkedin-publishing` skill | Weekly |

### Data Model Reference

**Table: employees**

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| name | TEXT | Full name |
| email | TEXT | Unique email |
| subsidiary | TEXT | scalefast, scalecall, scaleacademy, scalehq |
| team | TEXT | Department/team name |
| contract_type | TEXT | cdi, cdd, freelance, alternance |
| job_title | TEXT | Current job title |
| seniority_level | TEXT | junior, confirmed, senior, lead, manager |
| hire_date | DATE | Start date |
| departure_date | DATE | End date (null if active) |
| departure_reason | TEXT | resignation, termination, end_of_contract, mutual_agreement |
| gross_salary_monthly | INTEGER | Monthly gross in cents |
| variable_target_monthly | INTEGER | Variable target in cents |
| manager_id | UUID | FK to employees |
| is_active | BOOLEAN | Current employment status |

**Table: satisfaction_surveys**

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| employee_id | UUID | FK to employees |
| survey_date | DATE | Survey date |
| enps_score | INTEGER | 0-10 NPS score |
| overall_satisfaction | INTEGER | 1-5 overall score |
| categories | JSONB | Per-category scores (management, work_life_balance, career_growth, compensation, culture) |
| free_text | TEXT | Open feedback |
| is_anonymous | BOOLEAN | Always true for production surveys |

**Table: absences**

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| employee_id | UUID | FK to employees |
| start_date | DATE | Absence start |
| end_date | DATE | Absence end |
| reason | TEXT | sick_leave, personal, parental, training, unjustified |
| days_count | NUMERIC | Working days absent |
| is_justified | BOOLEAN | Whether documentation provided |

### Data Quality Requirements

- **Completeness:** All employees must have complete records (entry date, contract type, salary, department). Flag any incomplete records weekly.
- **Timeliness:** Departures and new hires must be recorded within 1 business day of the event.
- **Accuracy:** Cross-validate headcount between HR records and payroll data monthly. Investigate any discrepancies.
- **Consistency:** Use standardized department names, job titles, and contract type codes across all systems.

---

## Analysis Techniques

### Turnover Root Cause Analysis

When turnover exceeds threshold:

1. **Segment departures** by: department, tenure band (< 6m, 6-12m, 1-2y, 2-5y, 5y+), seniority, manager, subsidiary.
2. **Exit interview analysis:** Categorize reasons: compensation, growth opportunities, management quality, work-life balance, culture, external opportunity, relocation.
3. **Correlation analysis:** Check if departures cluster under specific managers, departments, or after specific events (reorg, policy change).
4. **Predictive signals:** Identify leading indicators:
   - Individual eNPS score trend (if tracked non-anonymously in 1:1s)
   - No promotion or salary increase in > 18 months
   - Declining performance review scores
   - Reduced engagement signals

### Compensation Analysis

**Pay equity check (annual):**

1. For each role family and seniority level, compute:
   - Median salary
   - Salary range (P25 to P75)
   - Gender pay gap: (median male salary - median female salary) / median male salary
2. Flag any gender pay gap > 5% for investigation.
3. Compare internal ranges to market data (Figures.hr, Glassdoor).
4. Identify employees below P25 for their role — candidates for salary adjustment.

**Note:** French companies with 50+ employees must publish an Index Egalite Professionnelle annually. Scale Group should prepare for this threshold proactively.

### Workforce Planning

**Headcount projection model:**

```
Projected Headcount (T+12) = Current Headcount
  + Planned Hires (from recruitment plan)
  - Expected Departures (Current Headcount x Historical Turnover Rate)
  +/- Business-driven adjustments (new contracts, lost clients)
```

---

## Security and Compliance

- **RGPD compliance.** HR analytics involve personal data processing. Maintain a RGPD register entry describing: data categories processed, legal basis (legitimate interest for business management), retention periods, access controls, and data processor agreements.
- **Data minimization.** Only collect and process data necessary for the stated metrics. Do not profile individual employees beyond what is needed for legitimate HR management.
- **Anonymization.** When presenting analytics to broad audiences (all-hands, investors), anonymize data. Never present metrics that could identify individuals in small teams (minimum reporting group: 5 people).
- **Access control.** Full access for CHRO and CEO. Department-level aggregates for department heads. No individual-level salary or satisfaction data visible to peers.
- **Retention.** Keep detailed HR data for the duration of employment + 5 years (statute of limitations for labor disputes). Keep aggregated anonymous analytics indefinitely for trend analysis.
- **Bias awareness.** When using predictive analytics or scoring, ensure no protected characteristic (age, gender, origin, disability) is used as a direct or proxy variable. Document methodology for CNIL inspection readiness.
- **Survey confidentiality.** eNPS and satisfaction survey responses must be strictly anonymous in production. Never attempt to de-anonymize responses. Minimum reporting unit: 5 respondents per segment to prevent identification.
- **Audit trail.** Log all access to HR analytics dashboards. Track who viewed what data and when, for RGPD accountability.
