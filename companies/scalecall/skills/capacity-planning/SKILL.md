---
name: capacity-planning
description: >
  SDR capacity projection and staffing management. Track current load per SDR,
  forecast client demand, generate staffing recommendations, and manage peak
  periods to ensure contractual call quotas are met.
---

# Capacity Planning

Project SDR capacity, plan staffing levels, and ensure ScaleCall can meet all contractual call volume commitments. Missing quotas means financial penalties and client churn -- capacity planning prevents this.

## SDR Capacity Model

```json
{
  "sdr_id": "sdr-marie-dupont",
  "name": "Marie Dupont",
  "level": "confirmed",
  "max_calls_per_day": 80,
  "availability": 0.8,
  "effective_capacity": 64,
  "assigned_clients": [
    { "client_id": "codialis-001", "allocated_calls_per_day": 40 },
    { "client_id": "techcorp-002", "allocated_calls_per_day": 20 }
  ],
  "utilization_rate": 93.75
}
```

### Max Calls Per Day by Level

| Level | Max calls/day | Typical availability | Effective capacity |
|-------|---------------|---------------------|--------------------|
| Junior | 60 | 0.75 (more coaching/admin) | 45 |
| Confirmed | 80 | 0.80 | 64 |
| Senior | 100 | 0.85 (less admin overhead) | 85 |

### Availability Factor

Availability = proportion of workday spent calling (after breaks, admin, meetings, coaching). Formula: `effective_capacity = max_calls_per_day x availability`

### Utilization Rate

```
allocated_total = sum(allocated_calls_per_day for each assigned client)
utilization_rate = (allocated_total / effective_capacity) x 100
```

Utilization zones:
- **Under-utilized**: < 60% -- SDR has significant spare capacity, can take more clients
- **Optimal**: 60-85% -- healthy load with buffer for variability
- **High**: 85-95% -- near maximum, no room for surge or bad days
- **Overloaded**: > 95% -- unsustainable, quota misses likely

## Demand Model

```
total_daily_demand = sum(client.target_calls for each active client)
total_daily_capacity = sum(sdr.effective_capacity for each active SDR)
capacity_ratio = total_daily_capacity / total_daily_demand
```

Capacity ratio interpretation:
- **>= 1.30**: over-staffed, consider pausing hiring or taking new clients
- **1.10 - 1.29**: healthy buffer for absences, ramp-ups, and variability
- **1.00 - 1.09**: at risk, one sick day or departure breaks quotas
- **< 1.00**: under-capacity, quotas WILL be missed, immediate action needed

## Concrete Example: Current State

### Clients

| Client | Daily target | Contract end |
|--------|-------------|--------------|
| Codialis | 200 calls/day | 2026-12-31 |
| TechCorp | 150 calls/day | 2026-09-30 |
| StartupX | 80 calls/day | 2026-06-30 |
| **Total demand** | **430 calls/day** | |

### SDR Roster (6 SDRs)

| SDR | Level | Max | Avail | Effective capacity |
|-----|-------|-----|-------|--------------------|
| Marie Dupont | Confirmed | 80 | 0.80 | 64 |
| Luc Martin | Senior | 100 | 0.85 | 85 |
| Sophie Leroy | Confirmed | 80 | 0.80 | 64 |
| Paul Bernard | Junior | 60 | 0.75 | 45 |
| Emma Petit | Confirmed | 80 | 0.80 | 64 |
| Thomas Roux | Junior | 60 | 0.75 | 45 |
| **Total capacity** | | | | **367** |

### Allocation Matrix (SDR x Client)

| SDR | Codialis | TechCorp | StartupX | Allocated | Utilization |
|-----|----------|----------|----------|-----------|-------------|
| Marie Dupont | 40 | 24 | 0 | 64 | 100% |
| Luc Martin | 40 | 30 | 15 | 85 | 100% |
| Sophie Leroy | 40 | 24 | 0 | 64 | 100% |
| Paul Bernard | 40 | 0 | 0 | 40 | 88.9% |
| Emma Petit | 40 | 24 | 0 | 64 | 100% |
| Thomas Roux | 0 | 0 | 45 | 45 | 100% |
| **Total** | **200** | **102** | **60** | **362** | |

### Gap Analysis

```
total_demand     = 430 calls/day
total_capacity   = 367 calls/day
capacity_ratio   = 367 / 430 = 0.85
gap              = 430 - 367 = 63 calls/day UNMET

Unmet by client:
  TechCorp: target 150, allocated 102, gap = 48 calls/day
  StartupX: target 80, allocated 60, gap = 20 calls/day
  Codialis: target 200, allocated 200, gap = 0 (fully covered)
```

**Status: CRITICAL** -- capacity_ratio 0.85 means we cannot meet all contracts. TechCorp and StartupX quotas are at risk. Need to hire or redistribute.

## Staffing Scenarios

### Scenario 1: +1 Client (NewCo, 100 calls/day)

```
new_total_demand   = 430 + 100 = 530 calls/day
current_capacity   = 367 calls/day
gap                = 530 - 367 = 163 calls/day
additional_SDRs_needed = ceil(163 / avg_effective_capacity)
                       = ceil(163 / 61.2) = 3 SDRs

Recommendation: hire 3 SDRs (ideally 2 confirmed + 1 junior).
Timeline: 2 weeks sourcing + 1 week onboarding + 2 weeks ramp = 5 weeks minimum.
Decision: only accept NewCo if start date is >= 5 weeks out, or if we can
          temporarily redistribute from over-performing clients.
```

### Scenario 2: -1 SDR (Luc Martin leaves)

```
lost_capacity = 85, new_capacity = 282, new_ratio = 0.66
Client impact: Codialis -40, TechCorp -30 (gap->78), StartupX -15 (gap->35)
Mitigation: redistribute Codialis across 3 SDRs short-term, emergency hire 2 confirmed SDRs
```

### Scenario 3: Q4 Peak (+30% volume)

```
peak_demand = 559, peak_gap = 192, additional SDRs = 4
Timeline: hiring must start by Aug 15 (2wk source + 1wk onboard + 2wk ramp + 1wk buffer)
Recommendation: 2 confirmed + 2 junior, juniors at full capacity by early October
```

## Forecasting

### Pipeline Integration

Pull upcoming client contracts from CRM (HubSpot/Pipedrive):

```
pipeline_clients = [
  { name: "NewCo", expected_calls: 100, probability: 80%, expected_start: "2026-06-01" },
  { name: "BigBank", expected_calls: 250, probability: 40%, expected_start: "2026-07-15" }
]

weighted_demand_M1 = sum(client.expected_calls x client.probability for clients starting within 30 days)
weighted_demand_M2 = sum(...for clients starting within 60 days)
weighted_demand_M3 = sum(...for clients starting within 90 days)
```

### SDR Ramp-Up Curve

New hires do not produce at full capacity immediately:

| Week | Junior | Confirmed | Senior |
|------|--------|-----------|--------|
| Week 1 | 20% (training) | 40% | 60% |
| Week 2 | 40% | 60% | 80% |
| Week 3 | 60% | 80% | 100% |
| Week 4 | 80% | 100% | 100% |
| Week 5+ | 100% | 100% | 100% |

When planning capacity for upcoming months, factor in ramp time:

```
effective_new_capacity_week_N = new_sdr.effective_capacity x ramp_percent[level][week_N]
```

### Attrition Buffer

SDR turnover in French call centers averages 20-30% annually. ScaleCall should maintain a buffer:

```
recommended_buffer = total_capacity x 0.12  (12% overcapacity)
minimum_buffer     = total_capacity x 0.10  (10% overcapacity)

buffer_status = (total_capacity - total_demand) / total_demand x 100
if buffer_status < 10% → "buffer_insufficient"
if buffer_status < 15% → "buffer_low"
if buffer_status >= 15% → "buffer_healthy"
```

## Hiring Trigger Rules

Evaluated weekly (Monday morning).

| Rule | Condition | Action |
|------|-----------|--------|
| Sustained high utilization | avg utilization_rate > 85% for 2+ consecutive weeks | Recommend hiring 1-2 SDRs |
| Urgent new client | new contract signed with start date < 3 weeks | Trigger emergency hiring process |
| Low capacity ratio | capacity_ratio < 1.10 | Alert: no buffer, any disruption breaks quotas |
| Critical capacity ratio | capacity_ratio < 1.00 | Escalate to CEO: cannot meet current contracts |
| Pipeline pressure | weighted pipeline demand M+2 > current buffer | Start sourcing candidates now |
| Attrition event | SDR departure confirmed | Immediately assess gap and post job listing |

### Hiring Decision Framework

```
required_new_capacity = total_demand x 1.15 - current_capacity  (target 15% buffer)
if required_new_capacity <= 0:
    → no hiring needed
else:
    SDRs_to_hire = ceil(required_new_capacity / avg_effective_capacity_confirmed)
    prefer_mix = { confirmed: ceil(SDRs_to_hire x 0.6), junior: floor(SDRs_to_hire x 0.4) }
    timeline = max(client_start_date - 5 weeks, today)  # 5 weeks = source + onboard + ramp
```

## Output: Staffing Dashboard

Generated every Monday 08:00. Contains four sections:

1. **Capacity overview**: total demand, total capacity, capacity_ratio, buffer %
2. **Client coverage**: per-client allocated vs target, gap calls/day
3. **SDR utilization**: per-SDR allocated vs effective capacity, utilization zone tag
4. **Hiring recommendations**: prioritized list with timeline and headcount

### Reallocation Priority

When capacity is constrained, allocate SDR time to clients by priority score:

```
priority_score = (penalty_per_missing_call x target_calls x 0.4)
               + (monthly_revenue x 0.3)
               + (renewal_proximity_factor x 0.2)
               + (strategic_tier_bonus x 0.1)
```

Allocate in descending priority_score order until capacity is exhausted. Remaining unallocated demand is the hiring gap.
