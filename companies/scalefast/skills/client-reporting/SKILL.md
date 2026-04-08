---
name: client-reporting
description: Generate weekly and monthly reports per client — appointments set, pipeline progression, ROI estimation
slug: client-reporting
schema: agentcompanies/v1
tags:
  - reporting
  - client
  - pipeline
---

# Client Reporting

Skill de generation de rapports periodiques pour les clients de l'agence ScaleFast.

## Types de rapports

### Rapport hebdomadaire (vendredi 17h)

Structure :

1. **Resume executif** (3 lignes) : points cles de la semaine
2. **Funnel de la semaine** :
   - Leads contactes
   - Leads qualifies
   - RDV poses
   - RDV tenus
   - Taux de conversion par etape
3. **Comparaison S/S-1** : evolution de chaque metrique par rapport a la semaine precedente (fleche haut/bas + pourcentage)
4. **Performance SDR** : tableau par SDR assigne au client (appels, connexions, RDV)
5. **Actions semaine prochaine** : top 3 actions prevues
6. **RDV a venir** : liste des RDV programmes la semaine prochaine

### Rapport mensuel (dernier jour ouvre du mois)

Structure :

1. **Resume executif** du mois
2. **Funnel consolide** du mois avec taux de conversion
3. **Evolution semaine par semaine** (graphique)
4. **ROI estime** : nombre de deals signes (si feedback client disponible), valeur estimee, cout de la campagne
5. **Analyse des tendances** : quels jours/creneaux sont les plus performants, quelle verticale convertit le mieux
6. **Recommandations** : ajustements ICP, changements de strategie, optimisations proposees

## Format de livraison

- Format principal : message Discord dans le channel dedie au client
- Format secondaire : export PDF disponible dans le portail client
- Langage : francais, ton professionnel mais accessible

## Regles

- Le rapport doit etre auto-suffisant : un client doit tout comprendre sans poser de questions supplementaires
- Pas de jargon interne (pas de "waterfall", "ICP scoring" etc.) — utiliser des termes business
- Les pourcentages d'evolution doivent etre accompagnes du chiffre absolu pour le contexte
- Si une metrique est en baisse, proposer une explication et une action corrective
