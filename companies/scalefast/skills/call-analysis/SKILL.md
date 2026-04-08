---
name: call-analysis
description: Call transcription (Whisper) and quality analysis (Claude) — scoring, objection handling, talk ratio, winning patterns identification
slug: call-analysis
schema: agentcompanies/v1
tags:
  - coaching
  - transcription
  - whisper
  - quality
---

# Call Analysis

Skill de transcription et d'analyse qualite des appels SDR chez ScaleFast.

## Pipeline d'analyse

### 1. Transcription (Whisper)

- Modele : Whisper large-v3
- Langues : francais (principal), anglais (occasionnel)
- Sortie : transcription horodatee avec identification du locuteur (SDR vs prospect)
- Metadonnees : duree totale, duree par locuteur, nombre de tours de parole

### 2. Analyse qualite (Claude)

Chaque transcription est analysee selon la grille suivante :

| Critere | Ponderation | Description | Score |
|---------|-------------|-------------|-------|
| Ouverture | 15% | Accroche pertinente, raison d'appel claire, permission de continuer | 0-100 |
| Qualification | 25% | Questions BANT posees (Budget, Autorite, Need, Timing), ecoute active | 0-100 |
| Gestion des objections | 25% | Identification de l'objection, reformulation, reponse adaptee | 0-100 |
| Talk ratio | 15% | Equilibre du temps de parole — objectif SDR < 60% | 0-100 |
| Closing | 20% | Proposition claire de next step, engagement obtenu, recap | 0-100 |

**Score global** = somme ponderee des 5 criteres (0-100)

### 3. Analyse du talk ratio

| Talk ratio SDR | Interpretation | Score |
|----------------|---------------|-------|
| < 40% | Excellent — le prospect parle beaucoup, forte qualification | 100 |
| 40-50% | Tres bien — bon equilibre | 90 |
| 50-60% | Correct — a surveiller | 70 |
| 60-70% | Trop haut — le SDR domine la conversation | 40 |
| > 70% | Problematique — monologue du SDR | 10 |

### 4. Detection des objections

Objections frequentes a identifier :

- "Je n'ai pas le temps" → technique de micro-engagement
- "Envoyez-moi un email" → requalifier l'interet avant d'accepter
- "On a deja un prestataire" → question de comparaison et de resultats
- "C'est trop cher" → recentrer sur la valeur et le ROI
- "Je ne suis pas le bon interlocuteur" → demander le bon contact
- "Rappelez-moi plus tard" → fixer une date precise

### 5. Identification des patterns gagnants

Analyser les appels ayant abouti a un RDV pour identifier :

- Phrases d'accroche qui fonctionnent
- Sequences de questions qui menent a la qualification
- Techniques de closing efficaces
- Moments cles dans la conversation (le "turning point")

## Sortie par appel

```
Appel #[ID]
SDR : [Prenom]
Prospect : [Prenom Nom] @ [Entreprise]
Duree : [X min Y sec]
Resultat : [RDV pose / Rappel planifie / Refus / Messagerie]

Score global : [XX/100]
- Ouverture : [XX/100]
- Qualification : [XX/100]
- Objections : [XX/100]
- Talk ratio : [XX/100] (SDR: XX% / Prospect: XX%)
- Closing : [XX/100]

Points forts :
- [Point 1]
- [Point 2]

Axes d'amelioration :
- [Axe 1 avec exemple tire de l'appel]
- [Axe 2 avec exemple tire de l'appel]
```

## Sortie hebdomadaire par SDR

```
Coaching hebdomadaire — [Prenom SDR]
Periode : [date debut] — [date fin]
Appels analyses : [N]
Score moyen : [XX/100]
Evolution vs semaine precedente : [+/-X points]

Top 3 points forts :
1. [...]
2. [...]
3. [...]

Top 3 axes d'amelioration :
1. [...] — Exemple : "[citation de l'appel]"
2. [...] — Exemple : "[citation de l'appel]"
3. [...] — Exemple : "[citation de l'appel]"

Exercice de la semaine :
[Description de l'exercice pratique]
```
