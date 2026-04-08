---
name: Monthly Capacity Review
assignee: capacity-planner
schedule:
  timezone: Europe/Paris
  recurrence:
    frequency: monthly
    interval: 1
    dayOfMonth: 1
    time:
      hour: 10
      minute: 0
---

# Revue mensuelle de capacite et previsions de staffing

Chaque 1er du mois a 10h00 Europe/Paris, produire une revue complete de la capacite SDR avec les previsions pour le mois a venir.

## Contenu de la revue

### Bilan du mois ecoulé
- **Charge par SDR** : taux d'utilisation moyen de chaque SDR sur le mois (appels realises / capacite theorique)
- **Charge par client** : nombre de SDR affectes, volume realise vs quota contractuel, jours sous-quota
- **Incidents de capacite** : episodes de sous-capacite ou surcharge, actions correctives prises

### Situation actuelle
- **Effectifs SDR** : nombre de SDR actifs, en formation, en conge prevu
- **Allocation courante** : repartition des SDR par client
- **Taux d'utilisation global** : capacite totale vs demande totale

### Previsions M+1
- **Demande projetee** : quotas contractuels a honorer, nouveaux contrats en cours de signature
- **Capacite projetee** : SDR disponibles en tenant compte des conges, formations, turnover anticipe
- **Ecart previsionnel** : surplus ou deficit de capacite, avec quantification en nombre de SDR
- **Recommandations** : recrutement, reallocation, recours freelances, ajustement des quotas

### Scenarios
- **Scenario base** : maintien des contrats actuels
- **Scenario haut** : signature des contrats en pipeline
- **Scenario bas** : perte d'un client majeur

## Destinataire

Sales Ops Manager, avec transmission au CEO pour validation des decisions de staffing.
