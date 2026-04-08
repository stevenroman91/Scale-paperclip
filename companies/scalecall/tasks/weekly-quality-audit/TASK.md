---
name: Weekly Quality Audit
assignee: qa-agent
schedule:
  timezone: Europe/Paris
  recurrence:
    frequency: weekly
    interval: 1
    weekdays:
      - friday
    time:
      hour: 14
      minute: 0
---

# Audit qualite hebdomadaire des appels

Chaque vendredi a 14h00 Europe/Paris, produire un rapport d'audit qualite sur un echantillon elargi des appels de la semaine.

## Methodologie

- **Echantillonnage** : selectionner un minimum de 5% des appels de la semaine, repartis de maniere representative entre les SDR et les clients
- **Scoring** : evaluer chaque appel selon la grille standardisee (note sur 10 par critere)
- **Criteres d'evaluation** :
  - Respect du script (0-10)
  - Ton et professionnalisme (0-10)
  - Gestion des objections (0-10)
  - Conclusion de l'appel (0-10)
  - Conformite reglementaire (0-10)

## Contenu du rapport

- **Score moyen global** de la semaine et evolution vs semaine precedente
- **Score moyen par SDR** : classement et identification des SDR sous le seuil (< 6/10)
- **Score moyen par client** : qualite des appels ventilee par client
- **Appels remarquables** : meilleurs appels (exemples a partager) et pires appels (a utiliser en coaching)
- **Tendances** : evolution de la qualite sur les 4 dernieres semaines
- **Recommandations** : actions correctives proposees (coaching individuel, mise a jour des scripts, formation)

## Destinataire

Sales Ops Manager, avec escalade au CEO si le score moyen global passe sous 6/10.
