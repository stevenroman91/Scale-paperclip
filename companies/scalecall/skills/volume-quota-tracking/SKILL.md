---
name: volume-quota-tracking
description: >
  Track contractual call quotas per client. Monitor daily, weekly, and monthly
  call volumes against contractual minimums (e.g. 200 calls/day for Codialis).
  Generate alerts when volumes fall below target thresholds.
---

# Volume Quota Tracking

Track and enforce contractual call volume commitments per client, per SDR, per day. ScaleCall bills on delivered call volume -- missing quotas triggers financial penalties and client churn risk.

## Contract Data Model

```json
{
  "client_id": "codialis-001",
  "client_name": "Codialis",
  "contract_type": "daily",
  "target_calls": 200,
  "target_connected": 120,
  "min_duration_seconds": 30,
  "start_date": "2026-01-15",
  "end_date": "2026-12-31",
  "billing_model": "per_call",
  "price_per_call": 4.50,
  "flat_fee": null,
  "penalties": {
    "threshold_percent": 90,
    "penalty_per_missing_call": 2.00
  }
}
```

Field rules:
- `min_duration_seconds`: calls shorter than this value are excluded from counts. Default 30s.
- `target_connected`: optional. If set, tracks calls where the prospect actually picked up (not voicemail/no-answer).
- `contract_type`: determines the aggregation window for quota evaluation. Daily contracts are checked every day; weekly on Friday EOD; monthly on last business day.
- `billing_model`: "per_call" invoices `actual_calls x price_per_call`; "flat_fee" invoices a fixed amount regardless of volume; "hybrid" invoices `flat_fee + max(0, actual_calls - target_calls) x price_per_call`.

## Tracking Granularity

Every call is recorded with three dimensions:
- **SDR**: who made the call
- **Client**: which client campaign the call belongs to
- **Day**: calendar date (Europe/Paris timezone)

A qualifying call must meet ALL of these conditions:
1. Duration >= `min_duration_seconds`
2. Call type is outbound
3. Call is tagged with the correct client campaign ID
4. Call occurred within business hours (08:00-19:00 Paris time) unless contract specifies otherwise

## Real-Time Metrics

Computed continuously during business hours (08:00-19:00, 11 working hours):

| Metric | Formula | Example |
|--------|---------|---------|
| Calls today | count of qualifying calls since 08:00 | 142 |
| Target today | contract.target_calls | 200 |
| Connected today | count of calls with status=connected | 88 |
| Target connected | contract.target_connected | 120 |
| Avg call duration | sum(duration) / count(calls) | 2m 15s |
| Progress % | (calls_today / target_today) x 100 | 71% |
| Hourly pace target | target_today / 11 hours | 18.2 calls/hr |
| Current hourly pace | calls_today / hours_elapsed | 20.3 calls/hr |
| Projected end-of-day | current_pace x 11 | 223 calls |
| Pace indicator | see rules below | on_track |

### Pace Indicator Rules

```
hours_elapsed = (now - 08:00) in hours  (min 0.5 to avoid divide-by-zero)
current_pace = calls_today / hours_elapsed
target_pace = target_today / 11
pace_ratio = current_pace / target_pace

if pace_ratio >= 1.00  → "ahead"      (green)
if pace_ratio >= 0.80  → "on_track"   (green/yellow)
if pace_ratio >= 0.60  → "behind"     (orange)
if pace_ratio <  0.60  → "at_risk"    (red)
```

## Alert Thresholds and Escalation

| Level | Condition | Action | Recipient |
|-------|-----------|--------|-----------|
| Green | pace_ratio >= 1.00 | No action | Dashboard only |
| Yellow | 0.80 <= pace_ratio < 1.00 | Slack notification | SDR assigned to client |
| Orange | 0.60 <= pace_ratio < 0.80 | Slack + email alert | Sales Ops manager |
| Red | pace_ratio < 0.60 | Immediate escalation | CEO + Sales Ops |

Additional escalation triggers:
- 2 consecutive days below 90% quota completion for any client -> CEO notification
- 3 consecutive days below 100% quota -> automatic reallocation recommendation (add SDR from bench or redistribute)
- Connected rate below 40% of total calls for 2+ hours -> possible data quality issue, alert Sales Ops

## Daily Report

Generated at 19:00 Paris time. Contains:

### Per-Client Quota Completion Table

```
| Client    | Target | Realized | Connected | %Completion | Status  |
|-----------|--------|----------|-----------|-------------|---------|
| Codialis  | 200    | 207      | 125       | 103.5%      | OK      |
| TechCorp  | 150    | 138      | 82        | 92.0%       | WARNING |
| StartupX  | 80     | 81       | 49        | 101.3%      | OK      |
```

### SDR Breakdown (for each client)

```
| SDR           | Client   | Target | Realized | %Completion |
|---------------|----------|--------|----------|-------------|
| Marie Dupont  | Codialis | 40     | 43       | 107.5%      |
| Luc Martin    | Codialis | 40     | 38       | 95.0%       |
| Sophie Leroy  | Codialis | 40     | 42       | 105.0%      |
| Paul Bernard  | Codialis | 40     | 41       | 102.5%      |
| Emma Petit    | Codialis | 40     | 43       | 107.5%      |
| TOTAL         | Codialis | 200    | 207      | 103.5%      |
```

### 7-Day Trend

```
| Client   | D-6 | D-5 | D-4 | D-3 | D-2 | D-1 | Today | 7d Avg |
|----------|-----|-----|-----|-----|-----|-----|-------|--------|
| Codialis | 98% | 102%| 95% | 101%| 104%| 99% | 103%  | 100.3% |
```

## Weekly and Monthly Aggregation

### Weekly (computed every Friday 19:00)

```
weekly_target = daily_target x business_days_this_week (usually 5)
weekly_actual = sum(daily_actual for each business day)
weekly_completion = weekly_actual / weekly_target x 100
```

### Monthly (computed last business day of month)

```
monthly_target = daily_target x business_days_this_month
monthly_actual = sum(daily_actual for each business day)
monthly_completion = monthly_actual / monthly_target x 100
```

For weekly contracts: quota is evaluated on the weekly total, not daily. A bad Monday can be compensated by a strong Friday.

## Penalty Calculation

Penalties apply at the end of each billing period (usually monthly).

```
if monthly_actual < monthly_target x (threshold_percent / 100):
    missing_calls = monthly_target - monthly_actual
    penalty = missing_calls x penalty_per_missing_call
else:
    penalty = 0
```

### Concrete Example: Codialis

- Monthly target: 200 calls/day x 22 business days = 4,400 calls
- Threshold: 90% = 3,960 calls
- Actual this month: 3,800 calls
- 3,800 < 3,960 -> penalty applies
- Missing calls: 4,400 - 3,800 = 600
- Penalty: 600 x 2.00 EUR = 1,200 EUR deducted from invoice
- Revenue impact: expected 4,400 x 4.50 = 19,800 EUR, actual = 3,800 x 4.50 - 1,200 = 15,900 EUR (loss of 3,900 EUR)

### Penalty Risk Projection

Computed daily from day 10 of the month onward:

```
business_days_elapsed = count of business days from month start to today
business_days_remaining = total_business_days - business_days_elapsed
projected_monthly = monthly_actual_so_far + (avg_daily_last_5_days x business_days_remaining)

if projected_monthly < monthly_target x (threshold_percent / 100):
    projected_penalty = (monthly_target - projected_monthly) x penalty_per_missing_call
    → alert: "Penalty risk for {client}: projected {projected_monthly} calls vs {monthly_target} target. Estimated penalty: {projected_penalty} EUR"
```

## Telephony API Integration

### Ringover

```
GET https://public-api.ringover.com/v2/calls
Params: date_from, date_to, team_id, direction=outbound, limit=1000
Headers: Authorization: Bearer {RINGOVER_API_KEY}
```

### Aircall

```
GET https://api.aircall.io/v1/calls
Params: from (unix ts), to (unix ts), tags=["codialis"], direction=outbound
Headers: Authorization: Bearer {AIRCALL_API_KEY}
```

Polling interval: every 5 minutes during business hours for both providers.

### Call Record Mapping

```json
{ "call_id": "ext-abc123", "sdr_id": "sdr-marie-dupont", "client_id": "codialis-001",
  "timestamp": "2026-04-08T10:23:15+02:00", "duration_seconds": 145,
  "status": "connected", "direction": "outbound", "qualifies": true }
```

A call qualifies only if `duration_seconds >= min_duration_seconds` AND `direction == "outbound"`.

## Concrete Example: Codialis Daily Operations

**Setup**: Client Codialis, 200 calls/day target, 5 SDRs assigned, 40 calls/SDR/day target.

**At 12:00 (4 hours elapsed, 7 remaining)**:
- Total calls made: 78
- Target pace at 12:00: (200 / 11) x 4 = 72.7 calls
- pace_ratio = (78/4) / (200/11) = 19.5 / 18.2 = 1.07
- Status: **ahead** (green)

**At 14:00 (6 hours elapsed, 5 remaining)**:
- Total calls made: 95
- Target pace at 14:00: (200 / 11) x 6 = 109.1 calls
- pace_ratio = (95/6) / (200/11) = 15.8 / 18.2 = 0.87
- Status: **on_track** (yellow) -> Slack notification to SDRs: "Codialis pace at 87% -- pick up the rhythm to hit 200 by 19:00. 105 calls remaining across 5 SDRs = 21 calls each in 5 hours."

**At 17:00 (9 hours elapsed, 2 remaining)**:
- Total calls made: 155
- Target pace at 17:00: (200 / 11) x 9 = 163.6 calls
- pace_ratio = (155/9) / (200/11) = 17.2 / 18.2 = 0.95
- Status: **on_track** (yellow)
- Projected: 155 + (17.2 x 2) = 189.4 calls -> might miss target
- Action: alert Sales Ops to consider extending hours or pulling a bench SDR

**At 19:00 (end of day)**:
- Total calls made: 192
- Completion: 192 / 200 = 96% -> above penalty threshold (90%), no penalty today
- But below 100% -> logged as under-quota day for trend tracking
