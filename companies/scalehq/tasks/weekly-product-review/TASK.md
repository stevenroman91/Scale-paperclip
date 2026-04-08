---
name: Weekly Product Review
description: Revue hebdomadaire produit — priorisation des feature requests par volume et impact
slug: weekly-product-review
assignee: pm
schedule:
  timezone: Europe/Paris
  recurrence:
    frequency: weekly
    interval: 1
    weekdays:
      - monday
    time:
      hour: 10
      minute: 0
---

# Weekly Product Review

Chaque lundi a 10h00 (Europe/Paris), le PM conduit la revue hebdomadaire produit pour prioriser les feature requests et planifier le travail de la semaine.

## Procedure

1. **Synthese des retours** : compiler les retours de la semaine ecoulee — nombre total par categorie (bug, feature, question), evolution par rapport a la semaine precedente.
2. **Top feature requests** : identifier les 5 feature requests les plus demandees (par volume d'utilisateurs uniques) et les 5 les plus impactantes (par impact estime sur le MRR ou la retention).
3. **Scoring impact x effort** : pour chaque feature request candidate, evaluer l'impact business (MRR, retention, acquisition) et l'effort technique (estimation avec le CTO). Prioriser les quick wins.
4. **Backlog grooming** : mettre a jour le backlog — fermer les tickets obsoletes, re-prioriser les tickets existants, ajouter les nouveaux tickets.
5. **Planning sprint** : definir les objectifs de la semaine — 1 grosse feature max, 2-3 ameliorations mineures, quota de bug fixes.
6. **Rapport CEO** : rediger et envoyer le rapport hebdomadaire au CEO — volume de retours, top demandes, metriques satisfaction, etat du backlog, objectifs de la semaine.

## Criteres de completion

- Le rapport hebdomadaire est envoye au CEO.
- Le backlog est a jour et ordonne.
- Les objectifs de la semaine sont definis et communiques a l'equipe technique.
- Les feature requests haute demande (3+ utilisateurs) sont identifiees et priorisees.
