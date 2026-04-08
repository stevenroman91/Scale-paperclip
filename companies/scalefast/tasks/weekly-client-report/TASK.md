---
name: Weekly Client Report
slug: weekly-client-report
assignee: pipeline-controller
recurring: true
schedule:
  recurrence: weekly
  day: friday
  time: "17:00"
  timezone: Europe/Paris
tags:
  - weekly
  - reporting
  - client
---

# Weekly Client Report

Chaque vendredi a 17h00 (Europe/Paris), generer et envoyer le rapport hebdomadaire de pipeline a chaque client de l'agence.

## Process

1. Pour chaque client actif, recuperer les donnees de la semaine (lundi 00h00 → vendredi 17h00)
2. Calculer le funnel complet : leads contactes → qualifies → RDV poses → RDV tenus
3. Calculer les taux de conversion inter-etapes
4. Comparer avec la semaine precedente
5. Rediger le resume executif
6. Lister les RDV prevus la semaine prochaine
7. Envoyer dans le channel Discord du client
8. Mettre a jour le portail client

## Structure du rapport

1. **Resume executif** (3 lignes max)
2. **Funnel de la semaine** : tableau avec volumes et taux de conversion
3. **Comparaison S/S-1** : evolution par metrique avec indicateur visuel (fleche haut/bas)
4. **Performance par SDR** : tableau par SDR assigne au client
5. **Top 3 actions semaine prochaine** : priorites de la semaine a venir
6. **RDV a venir** : liste des RDV programmes la semaine prochaine avec date, heure, prospect

## Regles

- Le rapport doit etre envoye avant 17h30 sans exception
- Si des donnees sont manquantes, l'indiquer clairement dans le rapport plutot que d'omettre la section
- Le rapport est la vitrine de la qualite de service de ScaleFast — soigner la presentation
