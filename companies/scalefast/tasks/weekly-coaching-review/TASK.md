---
name: Weekly Coaching Review
slug: weekly-coaching-review
assignee: sdr-coach
recurring: true
schedule:
  recurrence: weekly
  day: wednesday
  time: "10:00"
  timezone: Europe/Paris
tags:
  - weekly
  - coaching
  - call-analysis
---

# Weekly Coaching Review

Chaque mercredi a 10h00 (Europe/Paris), analyser les appels de la semaine ecoulee et produire le rapport de coaching individualise par SDR.

## Process

1. Recuperer tous les enregistrements d'appels de la semaine precedente (mercredi a mardi)
2. Transcrire les appels non encore transcrits (Whisper)
3. Analyser chaque appel avec la grille de scoring (Claude)
4. Consolider les scores par SDR
5. Identifier les patterns gagnants de la semaine (appels ayant abouti a un RDV)
6. Rediger le feedback individualise par SDR
7. Publier le rapport dans le channel coaching Discord
8. Alerter le Sales Ops Manager si un SDR a un score moyen < 50/100

## Contenu du rapport par SDR

```
🎯 Coaching Hebdomadaire — [Prenom SDR]
Periode : [mercredi] — [mardi]
Appels analyses : [N]
Score moyen : [XX/100] ([+/-X] vs semaine derniere)

📈 Top 3 points forts :
1. [Point fort avec exemple]
2. [Point fort avec exemple]
3. [Point fort avec exemple]

📉 Top 3 axes d'amelioration :
1. [Axe avec citation de l'appel]
2. [Axe avec citation de l'appel]
3. [Axe avec citation de l'appel]

🏋️ Exercice de la semaine :
[Description de l'exercice pratique a faire cette semaine]
```

## Contenu du rapport global

```
📊 Patterns Gagnants — Semaine du [date]

🏆 Meilleur score de la semaine : [Prenom SDR] — [XX/100]

Top techniques identifiees :
1. [Technique + contexte + resultat]
2. [Technique + contexte + resultat]
3. [Technique + contexte + resultat]

Phrase d'accroche de la semaine :
"[Citation exacte de l'accroche qui a le mieux fonctionne]"
```

## Regles

- Le coaching est factuel et bienveillant. Toujours illustrer avec des exemples concrets tires des appels.
- Chaque axe d'amelioration doit etre actionnable : le SDR doit savoir exactement quoi faire differemment.
- L'exercice hebdomadaire doit etre realiste et mesurable (ex: "Cette semaine, posez au moins 2 questions BANT avant de proposer un RDV").
- La progression est suivie dans le temps. Mentionner l'evolution du score par rapport aux semaines precedentes.
