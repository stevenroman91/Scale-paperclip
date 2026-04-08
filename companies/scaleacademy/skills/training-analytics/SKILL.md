---
name: training-analytics
description: Training metrics — completion rates, scores, correlation between training and field performance, module effectiveness
slug: training-analytics
---

# Training Analytics

Skill d'analyse des metriques de formation de ScaleAcademy. Mesure l'efficacite des modules, le progres des apprenants, et la correlation entre la formation et la performance terrain des SDR.

## Module-Level Metrics

### Completion Rate

```
completion_rate = (completions / enrollments) * 100
```

**Exemple:** Module "Qualifier un prospect" — 45 completions / 60 enrollments = 75% completion rate.

### Average Score

```
average_score = mean(all_passing_scores)
```

Ne prend en compte que les scores des apprenants ayant atteint le `passing_score`. Les echecs sont comptabilises separement.

**Exemple:** Scores [85, 72, 90, 78, 95] -> average_score = 84%.

### Average Time to Complete

```
avg_time = mean(time_spent_minutes) for all completions
```

**Exemple:** Module prevu pour 25 min. Temps releves : [22, 35, 28, 19, 42] -> avg_time = 29.2 min. Deviation = +4.2 min (+17%).

### Fail Rate

```
fail_rate = (failures / total_attempts) * 100
```

**Exemple:** 12 echecs sur 72 tentatives = 16.7% fail rate.

### NPS per Module

Sondage post-module (1-10) envoye a chaque apprenant apres completion.

```
Promoteurs (9-10) | Passifs (7-8) | Detracteurs (1-6)
NPS = % Promoteurs - % Detracteurs
```

**Exemple:** 20 reponses — 8 promoteurs (40%), 7 passifs (35%), 5 detracteurs (25%) -> NPS = 40 - 25 = +15.

### Difficulty Index

Score composite pour mesurer la difficulte reelle d'un module.

```
difficulty_index = fail_rate_norm * 0.4 + avg_time_deviation_norm * 0.3 + low_nps_rate_norm * 0.3
```

- `fail_rate_norm`: fail_rate normalise entre 0 et 1 (0% = 0, 100% = 1)
- `avg_time_deviation_norm`: |(avg_time - expected_time) / expected_time| normalise entre 0 et 1 (cap a 1 si deviation > 100%)
- `low_nps_rate_norm`: % de detracteurs / 100

**Interpretation:**
| Difficulty Index | Label | Action |
|------------------|-------|--------|
| 0.0 - 0.2 | Facile | Verifier que le module n'est pas trop simple |
| 0.2 - 0.4 | Adequat | Zone ideale |
| 0.4 - 0.6 | Difficile | Surveiller, ajouter des ressources supplementaires |
| 0.6 - 1.0 | Trop difficile | Revoir le contenu, decouper en sous-modules |

**Exemple concret:**
```
Module "Objection handling avance"
  fail_rate = 35% -> fail_rate_norm = 0.35
  avg_time = 45 min (expected: 30 min) -> deviation = 50% -> norm = 0.50
  detracteurs = 30% -> low_nps_rate_norm = 0.30

  difficulty_index = 0.35 * 0.4 + 0.50 * 0.3 + 0.30 * 0.3
                   = 0.14 + 0.15 + 0.09
                   = 0.38 (Adequat, en limite haute)
```

## Learner-Level Metrics

### Overall Progress

```
overall_progress = (completed_required_modules / total_required_modules) * 100
```

**Exemple:** 8 modules completes / 12 requis = 66.7%.

### Average Score Across All Modules

```
learner_avg_score = mean(all_module_scores)
```

### Learning Velocity

```
learning_velocity = modules_completed / weeks_since_enrollment
```

**Exemple:** 6 modules en 3 semaines = 2.0 modules/semaine.

**Benchmarks:**
| Velocity | Label | Action |
|----------|-------|--------|
| < 0.5 modules/semaine | Lent | Alerter le trainer agent |
| 0.5 - 1.5 | Normal | Aucune action |
| 1.5 - 3.0 | Rapide | Feliciter, proposer des modules avances |
| > 3.0 | Tres rapide | Verifier la qualite (scores corrects?) |

### Strengths / Weaknesses by Category

Calcul du score moyen par categorie de module :

```json
{
  "learner_id": "user_abc123",
  "scores_by_category": {
    "prospecting": 88,
    "objection_handling": 62,
    "closing": 75,
    "tools": 90,
    "product_knowledge": 85,
    "soft_skills": 70
  },
  "strengths": ["tools", "prospecting", "product_knowledge"],
  "weaknesses": ["objection_handling", "soft_skills"]
}
```

Seuils : strength >= 80, weakness < 70.

### Time to Certification

```
time_to_cert = certification_date - enrollment_date (in days)
```

**Benchmarks:** SDR Junior path: target 30 jours, acceptable 45 jours, alerte > 60 jours.

## Correlation Analysis: Training vs Field Performance

### Methodology

Comparer les KPIs terrain des SDR **avant** et **apres** la completion de modules specifiques.

#### KPIs mesures

| KPI | Description | Source |
|-----|-------------|--------|
| connect_rate | % d'appels qui aboutissent a une conversation | Telephonie (Aircall) |
| conversion_rate | % de conversations qui menent a un RDV qualifie | CRM (HubSpot) |
| average_deal_size | Montant moyen des deals generes | CRM |
| no_show_rate | % de RDV ou le prospect ne se presente pas | CRM |

#### Delta Calculation

```
delta_kpi = kpi_after_training - kpi_before_training

Periode "before": 30 jours avant completion du module
Periode "after": 30 jours apres completion du module
```

**Exemple concret:**
```
SDR Marie Dupont — Module "Techniques de relance avancees"
  Completed: 2026-03-01

  Before (01 fev - 01 mars):
    connect_rate: 22%, conversion_rate: 8%, no_show_rate: 18%

  After (01 mars - 01 avril):
    connect_rate: 28%, conversion_rate: 12%, no_show_rate: 12%

  Deltas:
    Δ connect_rate: +6 points
    Δ conversion_rate: +4 points
    Δ no_show_rate: -6 points (amelioration)
```

### Cohort Analysis

Pour isoler l'effet de la formation, comparer deux groupes pendant la meme periode :

- **Groupe A (trained):** SDR ayant complete le module
- **Groupe B (not trained):** SDR n'ayant pas encore complete le module

```
training_effect = mean_delta_group_A - mean_delta_group_B
```

Si `training_effect > 0`, le module a un impact positif mesurable.

### Training ROI

```
roi = ((revenue_increase - training_cost) / training_cost) * 100
```

- `revenue_increase`: Estimation basee sur le delta de conversion_rate * volume d'appels * average_deal_size
- `training_cost`: Temps passe en formation * cout horaire SDR + cout de production du contenu

**Exemple:**
```
Module "Closing avance" — 10 SDR formes
  Δ conversion_rate moyen: +3 points (de 10% a 13%)
  Appels/mois/SDR: 400, conversations = 400 * 25% connect = 100
  RDV supplementaires/mois/SDR: 100 * 3% = 3 RDV
  Deal size moyen: 5 000 EUR
  Revenue increase/mois: 10 SDR * 3 RDV * 5 000 EUR = 150 000 EUR

  Training cost: 10 SDR * 2h * 25 EUR/h + 2 000 EUR production = 2 500 EUR

  ROI = ((150 000 - 2 500) / 2 500) * 100 = 5 900%
```

## Dashboard Templates

### Manager View

```
+------------------------------------------------------------------+
| TEAM TRAINING DASHBOARD                          [Filter: Q1 2026]|
+------------------------------------------------------------------+
| Overall Completion: 72%  |  Avg Score: 78%  |  Certifications: 8 |
+------------------------------------------------------------------+
| TOP LEARNERS                | AT-RISK LEARNERS                   |
| 1. Marie D. — 95% complete | 1. Lucas M. — 30% (stuck 12 days)  |
| 2. Sarah P. — 92% complete | 2. Jules R. — 45% (failing quizzes)|
| 3. Tom L.   — 88% complete | 3. Lea B.   — 20% (not started)    |
+------------------------------------------------------------------+
| MODULE EFFECTIVENESS           | COMPLETION BY CATEGORY           |
| Best:  "Pitch structure" +5%  | Prospecting:    85%              |
| Worst: "CRM avance" -2%       | Objection:      68%              |
| Flag:  "Cold email" 45% fail  | Closing:        72%              |
+------------------------------------------------------------------+
```

### Individual Learner View

```
+------------------------------------------------------------------+
| MY TRAINING PROGRESS — Marie Dupont               [SDR Junior]   |
+------------------------------------------------------------------+
| Progress: 8/12 modules (67%)       Avg Score: 82%                |
| Velocity: 2.1 modules/week         Est. certification: 12 jours  |
+------------------------------------------------------------------+
| STRENGTHS           | WEAKNESSES            | NEXT RECOMMENDED    |
| Prospecting (92%)   | Objection hdl. (65%)  | "Objection prix"   |
| Tools (88%)         | Soft skills (68%)     | "Ecoute active"    |
+------------------------------------------------------------------+
| RECENT ACTIVITY                                                   |
| 04/07 — Completed "Pitch structure"          Score: 88%          |
| 04/05 — Failed "Objection complexe"         Score: 55% (retry)  |
| 04/03 — Completed "Outils CRM"              Score: 90%          |
+------------------------------------------------------------------+
```

### CEO View

```
+------------------------------------------------------------------+
| SCALEACADEMY — EXECUTIVE TRAINING REPORT            Q1 2026      |
+------------------------------------------------------------------+
| Completion Rate: 72%  | Training ROI: 4 200%  | NPS moyen: +32   |
+------------------------------------------------------------------+
| CERTIFICATION PIPELINE                                            |
| SDR Junior:   18 certified / 25 enrolled (72%)                   |
| SDR Confirmed: 6 certified / 12 enrolled (50%)                   |
| Account Mgr:   2 certified /  5 enrolled (40%)                   |
+------------------------------------------------------------------+
| TRAINING IMPACT ON FIELD PERFORMANCE                              |
| Δ connect_rate:     +4.2 points avg after training               |
| Δ conversion_rate:  +2.8 points avg after training               |
| Δ no_show_rate:     -3.1 points avg after training               |
+------------------------------------------------------------------+
| Revenue attributed to training this quarter: 420 000 EUR         |
+------------------------------------------------------------------+
```

## Alert Rules

| Trigger | Condition | Action | Recipient |
|---------|-----------|--------|-----------|
| Learner stuck | No progress for > 7 days | Send notification: "L'apprenant {name} n'a pas progresse depuis {days} jours sur le module '{module}'. Intervention recommandee." | Trainer Agent |
| High fail rate | Module fail_rate > 40% | Flag module: "Le module '{title}' a un taux d'echec de {rate}%. Revue du contenu recommandee." | Content Manager |
| Certification expired | Current date > certification.expires_at | Send notification: "Votre certification '{cert_name}' a expire le {date}. Veuillez repasser les modules pour la renouveler." | Learner + Manager |
| Low NPS | Module NPS < 0 | Flag module: "Le module '{title}' a un NPS negatif ({nps}). Retours apprenants a analyser." | Content Manager |
| Fast completion low score | time_spent < 50% of expected AND score < 70 | Flag learner: "{name} a complete '{module}' tres rapidement ({time} min) avec un score faible ({score}%). Possible survol." | Trainer Agent |

## Evaluation Criteria

| Criteria | Weight | Description |
|----------|--------|-------------|
| Metric accuracy | 30% | All formulas correctly computed, edge cases handled (division by zero, no data) |
| Correlation analysis | 25% | Before/after comparison correctly implemented, cohort analysis meaningful |
| Dashboard clarity | 20% | All three dashboard views (manager, individual, CEO) render correct and useful data |
| Alert reliability | 15% | Alerts fire at correct thresholds, no false positives, correct recipients |
| ROI calculation | 10% | Revenue attribution is reasonable, costs accurately tracked |

### Rubric

- **Excellent (90-100%):** All metrics compute correctly with edge case handling. Correlation analysis uses proper cohort methodology. Dashboards are clear and actionable. Alerts fire reliably. ROI calculation is grounded in real data.
- **Good (70-89%):** Core metrics work. Correlation analysis has minor methodological gaps. Dashboards show correct data but layout needs polish. Most alerts work.
- **Needs Improvement (50-69%):** Basic metrics (completion, score) work but advanced metrics (difficulty index, velocity) are wrong. No correlation analysis. Partial dashboards. Alerts inconsistent.
- **Failing (<50%):** Metrics are miscalculated or missing. No correlation analysis. No dashboards. No alerts.
