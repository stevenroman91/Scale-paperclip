---
name: client-reporting
description: Generate weekly, monthly, and quarterly reports per client — appointments set, pipeline progression, ROI estimation, funnel analysis
slug: client-reporting
schema: agentcompanies/v1
tags:
  - reporting
  - client
  - pipeline
  - roi
  - pdf
---

# Client Reporting

Skill de generation de rapports periodiques pour les clients de l'agence ScaleFast. Les rapports sont produits automatiquement a partir des donnees PostgreSQL et distribues par email, PDF, et Discord.

## Data Sources

### PostgreSQL Tables (stevenroman91/scalefast-devis)

```sql
-- Primary data tables used for reporting
SELECT * FROM calls       WHERE client_id = $1 AND call_date BETWEEN $2 AND $3;
SELECT * FROM rdv         WHERE client_id = $1 AND rdv_date BETWEEN $2 AND $3;
SELECT * FROM deals       WHERE client_id = $1 AND created_at BETWEEN $2 AND $3;
SELECT * FROM prospects   WHERE client_id = $1;
SELECT * FROM sdr_profiles WHERE id IN (SELECT sdr_id FROM client_sdr_assignments WHERE client_id = $1);
```

### External Data

- **Telephony API** (Ringover or Aircall): call recordings, call duration, call outcome
- **sales-kpi-tracking skill**: pre-computed weekly/monthly aggregations
- **linkedin-enrichment skill**: enrichment cost data for ROI calculation

## Report Types

### 1. Weekly Report (Rapport Hebdomadaire)

**Schedule**: every Friday at 17h00 CET
**Period**: Monday 00:00 to Friday 23:59 of the current week

#### Template Structure

```
===========================================
RAPPORT HEBDOMADAIRE — [Nom Client]
Semaine du [DD/MM] au [DD/MM/YYYY]
===========================================

1. RESUME EXECUTIF
-------------------------------------------
[3 lignes maximum — points cles de la semaine]

2. INDICATEURS CLES
-------------------------------------------
                    Cette semaine  | Sem. precedente | Evolution
Appels passes       [XXX]         | [XXX]           | [+/-X%] [arrow]
Appels decroches    [XXX]         | [XXX]           | [+/-X%] [arrow]
Taux de connexion   [XX.X%]       | [XX.X%]         | [+/-X pts]
RDV poses           [XX]          | [XX]            | [+/-X%] [arrow]
RDV tenus           [XX]          | [XX]            | [+/-X%] [arrow]
No-shows            [XX]          | [XX]            | [+/-X%] [arrow]
Taux de no-show     [XX.X%]       | [XX.X%]         | [+/-X pts]

3. PIPELINE
-------------------------------------------
Nouveaux leads entres     : [XX]
Leads qualifies           : [XX]
RDV programmes (a venir)  : [XX]
Deals en cours            : [XX]
Valeur pipeline estimee   : [XX XXX] EUR

4. PERFORMANCE PAR SDR
-------------------------------------------
| SDR       | Appels | Connexions | RDV | Score activite |
|-----------|--------|------------|-----|----------------|
| [Prenom]  | [XXX]  | [XX]       | [X] | [XX.X]         |
| [Prenom]  | [XXX]  | [XX]       | [X] | [XX.X]         |

Meilleur performeur : [Prenom SDR] — [raison courte]

5. FAITS MARQUANTS
-------------------------------------------
- [Win notable ou progres]
- [Defi rencontre et action prise]

6. PLAN SEMAINE PROCHAINE
-------------------------------------------
- Objectif appels : [XXX]
- Focus campagne : [description]
- RDV programmes : [XX] (liste en annexe)
```

#### Data Queries

```sql
-- Weekly KPIs
SELECT
  COUNT(*) AS total_calls,
  COUNT(*) FILTER (WHERE connected = true) AS connected_calls,
  ROUND(COUNT(*) FILTER (WHERE connected = true)::decimal / NULLIF(COUNT(*), 0) * 100, 1) AS connect_rate
FROM calls
WHERE client_id = $1
  AND call_date >= date_trunc('week', CURRENT_DATE)
  AND call_date < date_trunc('week', CURRENT_DATE) + INTERVAL '5 days';

-- RDV stats
SELECT
  COUNT(*) FILTER (WHERE status = 'set') AS rdv_set,
  COUNT(*) FILTER (WHERE status = 'held') AS rdv_held,
  COUNT(*) FILTER (WHERE status = 'noshow') AS rdv_noshow
FROM rdv
WHERE client_id = $1
  AND rdv_date >= date_trunc('week', CURRENT_DATE)
  AND rdv_date < date_trunc('week', CURRENT_DATE) + INTERVAL '5 days';
```

### 2. Monthly Report (Rapport Mensuel)

**Schedule**: last business day of the month at 17h00 CET
**Period**: 1st to last day of the month

#### Template Structure

```
===========================================
RAPPORT MENSUEL — [Nom Client]
[Mois YYYY]
===========================================

1. RESUME EXECUTIF
-------------------------------------------
[5 lignes maximum — performance globale du mois, tendances, recommandations cles]

2. INDICATEURS MENSUELS CONSOLIDES
-------------------------------------------
                    Ce mois   | Mois precedent | Evolution | Objectif contractuel
Appels passes       [XXXX]    | [XXXX]         | [+/-X%]   | [XXXX]
Appels decroches    [XXX]     | [XXX]          | [+/-X%]   | —
Taux de connexion   [XX.X%]   | [XX.X%]        | [+/-X pts]| > [XX%]
RDV poses           [XX]      | [XX]           | [+/-X%]   | [XX]
RDV tenus           [XX]      | [XX]           | [+/-X%]   | [XX]
No-shows            [XX]      | [XX]           | [+/-X%]   | < [XX%]
Deals signes        [X]       | [X]            | —         | —

3. ROI ESTIMATION
-------------------------------------------
Retainer mensuel              : [XX XXX] EUR
Cout enrichissement           : [X XXX] EUR
Cout total campagne           : [XX XXX] EUR
Revenu genere (deals signes)  : [XX XXX] EUR
ROI                           : [XXX%]
Cout par RDV tenu             : [XXX] EUR
Cout par deal signe           : [X XXX] EUR

Formule ROI : (revenu_deals_signes / cout_total_campagne) * 100

4. ANALYSE DU FUNNEL
-------------------------------------------
Etape                  | Volume | Taux conversion vers etape suivante
-----------------------|--------|-------------------------------------
Leads contactes        | [XXXX] | —
Leads decroches        | [XXX]  | [XX.X%]
Leads qualifies        | [XXX]  | [XX.X%]
RDV poses              | [XX]   | [XX.X%]
RDV tenus              | [XX]   | [XX.X%]
Proposition envoyee    | [X]    | [XX.X%]
Deal signe             | [X]    | [XX.X%]

5. EVOLUTION SEMAINE PAR SEMAINE
-------------------------------------------
| Semaine    | Appels | Connexions | RDV poses | RDV tenus |
|------------|--------|------------|-----------|-----------|
| S1 (DD/MM) | [XXX]  | [XX]       | [X]       | [X]       |
| S2 (DD/MM) | [XXX]  | [XX]       | [X]       | [X]       |
| S3 (DD/MM) | [XXX]  | [XX]       | [X]       | [X]       |
| S4 (DD/MM) | [XXX]  | [XX]       | [X]       | [X]       |

6. PERFORMANCE SDR COMPAREE
-------------------------------------------
| SDR       | Appels | Connect % | Conv % | RDV | Score | Classement |
|-----------|--------|-----------|--------|-----|-------|------------|
| [Prenom]  | [XXXX] | [XX.X%]   | [XX%]  | [X] | [XX]  | 1          |
| [Prenom]  | [XXXX] | [XX.X%]   | [XX%]  | [X] | [XX]  | 2          |

7. ANALYSE DES TENDANCES
-------------------------------------------
- Meilleurs jours : [ex: mardi et jeudi, +15% de connexion]
- Meilleurs creneaux : [ex: 9h-11h, taux de connexion 25%]
- Meilleure verticale : [ex: SaaS 50-200 salaries, taux conversion 18%]

8. RECOMMANDATIONS
-------------------------------------------
- [Recommandation 1 avec justification data]
- [Recommandation 2 avec justification data]
- [Recommandation 3 avec justification data]
```

#### ROI Calculation Logic

```javascript
function calculateROI(clientId, month) {
  const retainer = getMonthlyRetainer(clientId);
  const enrichmentCost = getEnrichmentCost(clientId, month); // from linkedin-enrichment logs
  const totalCost = retainer + enrichmentCost;

  const deals = getSignedDeals(clientId, month);
  const revenue = deals.reduce((sum, d) => sum + d.value, 0);

  return {
    roi_pct: totalCost > 0 ? (revenue / totalCost) * 100 : 0,
    cost_per_rdv: totalRDVHeld > 0 ? totalCost / totalRDVHeld : null,
    cost_per_deal: deals.length > 0 ? totalCost / deals.length : null,
    payback_months: revenue > 0 ? totalCost / (revenue / 12) : null
  };
}
```

### 3. Quarterly Business Review (QBR)

**Schedule**: first week after quarter end
**Period**: full quarter (3 months)

Content includes everything from monthly reports plus:
- Quarter-over-quarter trends
- Strategic recommendations for next quarter
- ICP refinement suggestions based on conversion data
- SDR allocation optimization
- Budget reallocation proposals

## Delivery Channels

### Email (HTML Template)

```javascript
const sendReportEmail = async (clientId, reportType, reportData) => {
  const html = renderTemplate(`templates/${reportType}.html`, reportData);
  await transporter.sendMail({
    from: '"ScaleFast Reports" <reports@scalefast.fr>',
    to: getClientContacts(clientId),
    subject: `${reportType === 'weekly' ? 'Rapport Hebdomadaire' : 'Rapport Mensuel'} — Semaine du ${reportData.period}`,
    html: html
  });
};
```

### PDF Export

```javascript
const puppeteer = require('puppeteer');

async function generatePDF(htmlContent, outputPath) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: outputPath,
    format: 'A4',
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    printBackground: true
  });
  await browser.close();
  return outputPath;
}
```

### Discord Channel

Weekly reports are posted in the client's dedicated Discord channel using the `discord-notifications` skill. Format is a condensed version of the full report using Discord embeds.

## Report Generation Workflow

```
1. TRIGGER     : cron fires at scheduled time (Friday 17h or last business day)
2. VALIDATE    : check that the period has complete data (no missing days)
3. QUERY       : pull all raw data from PostgreSQL for the period
4. COMPUTE     : calculate all KPIs, rates, deltas, trends
5. COMPARE     : fetch previous period data for WoW/MoM comparison
6. FORMAT      : populate report template with computed values
7. REVIEW      : flag any anomalies (e.g., metric dropped >50%) for human review
8. DELIVER     : send via email (HTML), generate PDF, post to Discord
9. LOG         : store report metadata in reports_log table
10. CONFIRM    : send delivery confirmation to Sales Ops Manager
```

## Rules

- Reports must be self-contained: a client should understand everything without follow-up questions
- No internal jargon (no "waterfall", "ICP scoring"): use business terms
- Every percentage change must include the absolute number for context
- If a metric is declining, include an explanation and a corrective action
- All dates in DD/MM/YYYY format (French convention)
- All currency in EUR with French formatting (1 234,56 EUR)
- Language: French, professional but accessible tone

## Error Handling

| Error | Action |
|-------|--------|
| Missing data for 1+ days in period | Include note in report: "Donnees partielles — [X] jours sur [Y]" |
| No calls logged for entire period | Generate report with zeros + alert Sales Ops Manager |
| Client has no active SDR assigned | Skip report generation, notify Sales Ops Manager |
| Email delivery failure | Retry 3x with exponential backoff, then notify ops |
| PDF generation timeout | Retry once, if fail deliver HTML-only report |

## Integration Points

- **sales-kpi-tracking**: primary data source for all KPIs and aggregations
- **discord-notifications**: delivery channel for weekly reports in client channels
- **linkedin-enrichment**: enrichment cost data for ROI calculation
- **french-holidays**: determines last business day of month for scheduling
