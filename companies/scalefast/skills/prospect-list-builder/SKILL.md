---
name: prospect-list-builder
description: Prospect list creation — ICP definition, LinkedIn Sales Nav extraction, scoring (0-100), deduplication, enrichment pipeline, SDR assignment
slug: prospect-list-builder
schema: agentcompanies/v1
tags:
  - prospecting
  - linkedin
  - icp
  - scoring
  - deduplication
  - assignment
---

# Prospect List Builder

Skill de creation de listes de prospects qualifies a partir de LinkedIn Sales Navigator pour les campagnes ScaleFast. De la definition de l'ICP a l'assignation aux SDRs, ce skill couvre le workflow complet de construction de liste.

## ICP (Ideal Customer Profile) Definition Framework

### Company Criteria

| Criteria | Description | Example |
|----------|-------------|---------|
| Industry | Target vertical(s) | SaaS, FinTech, EdTech, HealthTech |
| Company size (employees) | Headcount range | 50-500 |
| Revenue range | Annual revenue | 2M-50M EUR |
| Location | HQ or office location | France, Ile-de-France, specific cities |
| Tech stack | Technologies used (from job postings, BuiltWith) | Salesforce, HubSpot, Notion |
| Company age | Years since founding | > 2 years |
| Funding stage | Investment stage | Series A to Series C |

### Contact Criteria

| Criteria | Description | Example |
|----------|-------------|---------|
| Job title patterns | Regex-like patterns for matching | /Directeur.*Commercial/, /VP.*Sales/, /CEO/ |
| Seniority level | LinkedIn seniority filter | Director, VP, C-Suite, Owner |
| Department | Functional area | Sales, Marketing, Operations |
| Tenure in role | Time in current position | > 3 months (settled in), < 2 years (still building) |

### Exclusion Criteria

| Criteria | Rule |
|----------|------|
| Competitors | Exclude companies on the client's competitor list |
| Existing clients | Exclude companies already in client's customer base |
| Recently contacted | Exclude prospects contacted < 90 days ago (by any SDR for this client) |
| Do-not-contact | Exclude prospects/companies explicitly flagged |
| Same company double | Max 1 contact per company per client campaign |

### ICP Definition Template

```json
{
  "client_id": 42,
  "campaign_name": "Q2 2026 — SaaS France",
  "company": {
    "industries": ["SaaS", "FinTech"],
    "size_min": 50,
    "size_max": 500,
    "revenue_min_eur": 2000000,
    "revenue_max_eur": 50000000,
    "locations": ["France"],
    "tech_stack_includes": ["Salesforce"],
    "funding_stages": ["Series A", "Series B", "Series C"],
    "exclude_companies": ["CompetitorA", "CompetitorB"]
  },
  "contact": {
    "title_patterns": ["Directeur Commercial", "VP Sales", "Head of Sales", "CEO", "COO"],
    "seniority_levels": ["Director", "VP", "CXO", "Owner"],
    "departments": ["Sales", "Executive"],
    "tenure_min_months": 3,
    "tenure_max_months": 24
  },
  "exclusions": {
    "recently_contacted_days": 90,
    "max_contacts_per_company": 1
  }
}
```

## Scoring Model (0-100)

### Category Breakdown

Total score = Company Fit (40 pts) + Contact Fit (35 pts) + Signal Bonus (25 pts)

#### Company Fit: 40 points

| Sub-criteria | Max Points | Scoring Logic |
|-------------|------------|---------------|
| Industry match | 15 | Exact match = 15, Adjacent industry = 8, No match = 0 |
| Company size match | 15 | Within range = 15, Within 2x range = 8, Outside = 0 |
| Location match | 10 | Exact city/region = 10, Same country = 5, Outside = 0 |

#### Contact Fit: 35 points

| Sub-criteria | Max Points | Scoring Logic |
|-------------|------------|---------------|
| Title match | 20 | Exact ICP title = 20, Similar title = 12, Related = 5, No match = 0 |
| Seniority match | 15 | Exact level = 15, One level off = 8, Two+ levels off = 0 |

#### Signal Bonus: 25 points

| Signal | Max Points | Detection |
|--------|------------|-----------|
| Recent funding | 10 | Company raised funding in last 12 months (from Crunchbase, LinkedIn news) |
| Job postings | 8 | Company is hiring for roles related to client's product (from LinkedIn Jobs) |
| Tech adoption | 7 | Company recently adopted complementary technology (from job descriptions, press) |

### Scoring Implementation

```javascript
function scoreProspect(prospect, icp) {
  let score = 0;

  // ─── Company Fit (40 pts) ───
  // Industry: 15 pts
  if (icp.company.industries.includes(prospect.industry)) {
    score += 15;
  } else if (isAdjacentIndustry(prospect.industry, icp.company.industries)) {
    score += 8;
  }

  // Company size: 15 pts
  const size = prospect.company_size;
  if (size >= icp.company.size_min && size <= icp.company.size_max) {
    score += 15;
  } else if (size >= icp.company.size_min * 0.5 && size <= icp.company.size_max * 2) {
    score += 8;
  }

  // Location: 10 pts
  if (icp.company.locations.some(loc => prospect.location.includes(loc))) {
    score += 10;
  } else if (prospect.location.includes('France')) {
    score += 5;
  }

  // ─── Contact Fit (35 pts) ───
  // Title: 20 pts
  const titleScore = matchTitle(prospect.title, icp.contact.title_patterns);
  score += Math.round(titleScore * 20);  // titleScore is 0-1

  // Seniority: 15 pts
  if (icp.contact.seniority_levels.includes(prospect.seniority)) {
    score += 15;
  } else if (isOneLevelOff(prospect.seniority, icp.contact.seniority_levels)) {
    score += 8;
  }

  // ─── Signal Bonus (25 pts) ───
  if (prospect.signals?.recent_funding) score += 10;
  if (prospect.signals?.job_postings) score += 8;
  if (prospect.signals?.tech_adoption) score += 7;

  return Math.min(score, 100);
}

function matchTitle(title, patterns) {
  const normalized = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const pattern of patterns) {
    const normalizedPattern = pattern.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.includes(normalizedPattern)) return 1.0;
  }
  // Fuzzy match with Levenshtein or token overlap
  const titleTokens = normalized.split(/\s+/);
  for (const pattern of patterns) {
    const patternTokens = pattern.toLowerCase().split(/\s+/);
    const overlap = patternTokens.filter(t => titleTokens.includes(t)).length;
    if (overlap / patternTokens.length >= 0.5) return 0.6;
  }
  return 0;
}
```

### Score Thresholds

| Score Range | Classification | Action |
|-------------|---------------|--------|
| 70-100 | Prospect prioritaire | Enrich immediately, assign to SDR, call first |
| 50-69 | Prospect standard | Enrich in batch, assign to SDR, lower priority |
| 0-49 | Prospect exclu | Do not include in list |

## List Building Workflow

### Step 1: Define ICP with Client

- Conduct intake call with client to fill ICP template
- Validate against client's existing customer profile
- Get sign-off from client before proceeding
- Store ICP definition in `campaigns` table

### Step 2: Search LinkedIn Sales Navigator

- Apply all ICP filters in Sales Navigator search
- Manual search or via PhantomBuster / Captain Data automation
- Extract profiles in batches of 100-500
- Export raw data to CSV

### Step 3: Export to CSV

Raw export columns:
```
first_name, last_name, title, company, company_size, industry, location,
linkedin_url, seniority, tenure_months
```

### Step 4: Deduplication

Check each prospect against three data sources:

```javascript
async function deduplicateProspect(prospect, clientId) {
  // Check 1: LinkedIn URL exact match
  const urlMatch = await db.query(
    'SELECT id, client_id, status FROM prospects WHERE linkedin_url = $1',
    [prospect.linkedin_url]
  );
  if (urlMatch.rows.length > 0) {
    const existing = urlMatch.rows[0];
    if (existing.client_id === clientId) {
      return { isDuplicate: true, reason: 'already_in_client_pipeline', existing_id: existing.id };
    }
    // Different client — allowed, not a duplicate
  }

  // Check 2: Email match (if known)
  if (prospect.email) {
    const emailMatch = await db.query(
      'SELECT id, client_id FROM prospects WHERE email = $1 AND client_id = $2',
      [prospect.email, clientId]
    );
    if (emailMatch.rows.length > 0) {
      return { isDuplicate: true, reason: 'email_match_same_client', existing_id: emailMatch.rows[0].id };
    }
  }

  // Check 3: Company + similar name (prevent same-company double contact)
  const companyMatch = await db.query(
    `SELECT id FROM prospects
     WHERE client_id = $1
       AND company_domain = $2
       AND status NOT IN ('rejected', 'unqualified')`,
    [clientId, extractDomain(prospect.company)]
  );
  if (companyMatch.rows.length > 0) {
    return { isDuplicate: true, reason: 'same_company_already_targeted', existing_id: companyMatch.rows[0].id };
  }

  // Check 4: Recently contacted (< 90 days)
  const recentContact = await db.query(
    `SELECT id FROM calls
     WHERE prospect_linkedin_url = $1
       AND client_id = $2
       AND call_date > NOW() - INTERVAL '90 days'`,
    [prospect.linkedin_url, clientId]
  );
  if (recentContact.rows.length > 0) {
    return { isDuplicate: true, reason: 'recently_contacted' };
  }

  return { isDuplicate: false };
}
```

### Step 5: Score Each Prospect

Apply `scoreProspect()` function to every prospect. Filter out scores < 50.

### Step 6: Enrich Top Prospects

Send prospects with score >= 50 to the `linkedin-enrichment` skill:

```javascript
async function enrichBatch(prospects, sdrId, clientId) {
  // Sort by score descending — enrich best prospects first
  const sorted = prospects.sort((a, b) => b.score - a.score);
  const results = [];

  for (const prospect of sorted) {
    const enrichResult = await enrichProspect(prospect.linkedin_url, sdrId, clientId);
    results.push({
      ...prospect,
      phone: enrichResult.phone || null,
      email: enrichResult.email || prospect.email || null,
      enrichment_provider: enrichResult.provider,
      enrichment_cost: enrichResult.cost
    });
  }

  return results;
}
```

### Step 7: Assign to SDRs

Assignment based on territory, vertical expertise, or round-robin:

```javascript
function assignToSDRs(prospects, sdrAssignments) {
  // sdrAssignments = [{ sdr_id, verticals: [], regions: [], capacity: N }]

  return prospects.map(prospect => {
    // Try vertical match first
    let assignedSDR = sdrAssignments.find(sdr =>
      sdr.verticals.includes(prospect.industry) && sdr.assigned < sdr.capacity
    );

    // Fall back to region match
    if (!assignedSDR) {
      assignedSDR = sdrAssignments.find(sdr =>
        sdr.regions.includes(prospect.location) && sdr.assigned < sdr.capacity
      );
    }

    // Fall back to round-robin (least loaded)
    if (!assignedSDR) {
      assignedSDR = sdrAssignments
        .filter(sdr => sdr.assigned < sdr.capacity)
        .sort((a, b) => a.assigned - b.assigned)[0];
    }

    if (assignedSDR) {
      assignedSDR.assigned++;
      prospect.assigned_sdr_id = assignedSDR.sdr_id;
    }

    return prospect;
  });
}
```

## Output Format

### CSV Export

Columns:
```
company, first_name, last_name, title, linkedin_url, phone, email, score,
industry, company_size, location, signals, assigned_sdr, enrichment_provider
```

### Database Insert

```sql
INSERT INTO prospects (
  client_id, campaign_id, first_name, last_name, title, company,
  company_size, industry, location, linkedin_url, phone, email,
  score, assigned_sdr_id, enrichment_provider, status
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'new');
```

## List Quality Report

Generated after every list build. Sent to Sales Ops Manager via Discord.

```
📋 Rapport de Qualite — Liste [Campaign Name]
Client : [Client Name]
Date : [DD/MM/YYYY]

Total prospects extraits    : [XXXX]
Duplicatas supprimes        : [XXX] ([XX%])
Score < 50 exclus           : [XXX] ([XX%])
Prospects retenus           : [XXX]
Score moyen                 : [XX.X]

Repartition par score :
  70-100 (prioritaires)     : [XXX] ([XX%])
  50-69  (standard)         : [XXX] ([XX%])

Enrichissement :
  Enrichis avec telephone   : [XXX] ([XX%])
  Enrichis email seulement  : [XXX] ([XX%])
  Non enrichissables        : [XXX] ([XX%])

Assignation SDR :
  [Prenom SDR A] : [XX] prospects
  [Prenom SDR B] : [XX] prospects
```

## Quality Metrics Targets

| Metric | Target |
|--------|--------|
| ICP match rate | > 80% of retained prospects |
| Average list score | > 65 |
| Deduplication rate | < 15% |
| Enrichment success rate (post-delivery) | > 60% |
| Phone number found rate | > 50% |

## Integration Points

- **linkedin-enrichment**: receives prospect LinkedIn URLs for phone/email enrichment
- **sales-kpi-tracking**: prospect volume feeds into campaign metrics
- **client-reporting**: list quality metrics included in monthly reports
- **call-analysis**: tracks which prospect segments yield the best call outcomes
