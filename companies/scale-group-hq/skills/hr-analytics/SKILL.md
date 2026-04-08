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

Métriques et analytics RH pour le pilotage de la stratégie de gestion des talents du groupe Scale.

## Modèle de données

### Table `employees`

```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  subsidiary TEXT NOT NULL, -- 'scalefast' | 'scalecall' | 'scaleacademy' | 'scalehq'
  team TEXT NOT NULL,
  contract_type TEXT NOT NULL, -- 'cdi' | 'cdd' | 'freelance' | 'alternance'
  job_title TEXT NOT NULL,
  seniority_level TEXT NOT NULL, -- 'junior' | 'confirmed' | 'senior' | 'lead' | 'manager'
  hire_date DATE NOT NULL,
  departure_date DATE,
  departure_reason TEXT, -- 'resignation' | 'termination' | 'end_of_contract' | 'mutual_agreement'
  gross_salary_monthly INTEGER NOT NULL, -- en centimes
  variable_target_monthly INTEGER, -- en centimes
  manager_id UUID REFERENCES employees(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table `satisfaction_surveys`

```sql
CREATE TABLE satisfaction_surveys (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  survey_date DATE NOT NULL,
  enps_score INTEGER NOT NULL CHECK (enps_score BETWEEN 0 AND 10),
  overall_satisfaction INTEGER CHECK (overall_satisfaction BETWEEN 1 AND 5),
  categories JSONB, -- { "management": 4, "work_life_balance": 3, "career_growth": 4, "compensation": 3, "culture": 5 }
  free_text TEXT,
  is_anonymous BOOLEAN DEFAULT true
);
```

### Table `absences`

```sql
CREATE TABLE absences (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL, -- 'sick_leave' | 'personal' | 'parental' | 'training' | 'unjustified'
  days_count NUMERIC(4,1) NOT NULL,
  is_justified BOOLEAN DEFAULT true
);
```

## Métriques clés et formules

### 1. Taux de turnover

```
turnover_rate = (departures_in_period / average_headcount) × 100
```

- **Période** : mensuel, trimestriel, annuel
- **Par filiale** : calculer séparément pour ScaleFast, ScaleCall, ScaleAcademy, ScaleHQ
- **Turnover volontaire** : seulement les démissions (`departure_reason = 'resignation'`)
- **Benchmark startups B2B FR (10-50 employés)** : 15-25% annuel est normal, >30% = alerte

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

### 2. eNPS (Employee Net Promoter Score)

```
eNPS = % promoteurs (9-10) - % détracteurs (0-6)
```

- **Promoteurs** : score 9-10
- **Passifs** : score 7-8 (ignorés dans le calcul)
- **Détracteurs** : score 0-6
- **Benchmark** : eNPS > 30 = bon, > 50 = excellent, < 10 = alerte

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

### 3. Time-to-hire

```
time_to_hire = date_offer_accepted - date_job_opened (en jours)
```

- **Par étape** : sourcing → screening → entretien → offre → acceptation
- **Benchmark FR** :
  - SDR : 20-30 jours
  - Tech (engineer) : 35-50 jours
  - Manager : 40-60 jours
- **Alerte** : time-to-hire > 45 jours

### 4. Coût par recrutement

```
cost_per_hire = (internal_costs + external_costs) / number_of_hires
```

- **Coûts internes** : temps passé par le Talent Acquisition (heures × taux horaire), temps managers en entretien
- **Coûts externes** : job boards (Welcome to the Jungle ~300€/annonce, LinkedIn Recruiter ~600€/mois), cabinets de recrutement (15-20% du salaire annuel)
- **Benchmark startups FR** : 3 000-8 000€ par recrutement CDI

### 5. Taux d'absentéisme

```
absenteeism_rate = (total_absent_days / total_working_days) × 100
```

- **Jours ouvrés/mois** : ~22 jours
- **Benchmark FR** : 5-6% moyen national, <4% pour les startups
- **Alerte** : >8% ou tendance haussière sur 3 mois

### 6. Revenu par employé

```
revenue_per_employee = total_revenue / average_headcount
```

- **Par filiale** : chaque filiale a son propre CA
- **Benchmark agences B2B FR** : 80 000-150 000€/employé/an

### 7. Masse salariale / CA

```
payroll_ratio = (total_payroll_cost / total_revenue) × 100
```

- **Total payroll** : salaires bruts + charges patronales (~45%)
- **Benchmark agences SDR** : 50-65% est sain, >70% = alerte

### 8. Taux de rétention

```
retention_rate = ((employees_end - new_hires) / employees_start) × 100
```

- **Mesure complémentaire du turnover** : focus sur la fidélisation
- **Cible** : >85% annuel

## Alertes automatiques

| Métrique | Seuil d'alerte | Seuil critique | Destinataire |
|----------|---------------|----------------|--------------|
| Turnover annualisé | >20% | >30% | CHRO + CEO |
| eNPS | <30 | <10 | CHRO |
| Time-to-hire | >45 jours | >60 jours | Talent Acquisition |
| Absentéisme | >6% | >10% | CHRO + People Dev |
| Masse salariale/CA | >65% | >75% | CFO + CEO |
| Satisfaction catégorie | <3.0/5 | <2.5/5 | CHRO + People Dev |

## Templates de reporting

### Dashboard mensuel RH

```markdown
## Rapport RH — {mois} {année}

### Effectifs
- Headcount total : {n} (+{new_hires} arrivées, -{departures} départs)
- Par filiale : ScaleFast {n}, ScaleCall {n}, ScaleAcademy {n}, ScaleHQ {n}
- CDI : {n} | CDD : {n} | Freelance : {n}

### Turnover
- Taux mensuel : {x}% (annualisé : {y}%)
- Départs : {names} — motifs : {reasons}

### Satisfaction
- eNPS : {score} (vs {prev_month})
- Points forts : {top_categories}
- Points d'attention : {low_categories}

### Recrutement
- Postes ouverts : {n}
- Time-to-hire moyen : {days} jours
- Pipeline : {sourcing} → {screening} → {interview} → {offer}

### Masse salariale
- Total brut : {amount}€
- Ratio MS/CA : {x}%
- Évolution M-1 : {delta}%
```

### Revue trimestrielle

Inclut en plus :
- Analyse de tendance (3 mois glissants)
- Comparaison inter-filiales
- Impact des actions RH (formations, augmentations, changements d'organisation)
- Projections headcount à 6 mois
- Budget RH vs réalisé

## Sources de données

- **Paie** : données du Payroll Manager (salaires, charges)
- **Recrutement** : données du Talent Acquisition (pipeline, coûts, dates)
- **Formation** : données ScaleAcademy (heures, certifications)
- **Absences** : déclarations managers + SIRH
- **Satisfaction** : enquêtes trimestrielles (anonymisées)
- **Finance** : données CFO (CA par filiale)
