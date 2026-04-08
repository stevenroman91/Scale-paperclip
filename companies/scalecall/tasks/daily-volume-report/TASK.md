---
name: Daily Volume Report
assignee: sales-ops-manager
schedule:
  timezone: Europe/Paris
  recurrence:
    frequency: daily
    interval: 1
    time:
      hour: 18
      minute: 0
---

# Rapport quotidien de volume d'appels

Chaque jour a 18h00 Europe/Paris, produire le rapport quotidien de volume d'appels pour le CEO.

## Contenu du rapport

- **Volume par client** : nombre d'appels realises aujourd'hui pour chaque client, compare au quota contractuel
- **Volume par SDR** : nombre d'appels realises aujourd'hui par chaque SDR, avec le client affecte
- **Taux d'atteinte des quotas** : pourcentage d'atteinte du quota contractuel par client
- **Alertes du jour** : liste des alertes declenchees (sous-quota, qualite, capacite)
- **Duree moyenne des appels** : par client et par SDR
- **Taux de decroche** : pourcentage d'appels ou le prospect a decroche, par client

## Format

Tableau synthetique avec code couleur :
- Vert : quota atteint (>= 100%)
- Orange : quota proche (80-99%)
- Rouge : quota non atteint (< 80%)

## Destinataire

CEO de ScaleCall, avec copie au Client Portal Bot pour mise a disposition des clients.
