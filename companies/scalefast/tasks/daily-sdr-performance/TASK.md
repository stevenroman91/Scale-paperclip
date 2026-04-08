---
name: Daily SDR Performance Recap
slug: daily-sdr-performance
assignee: sales-ops-manager
recurring: true
schedule:
  recurrence: daily
  time: "18:00"
  timezone: Europe/Paris
tags:
  - daily
  - performance
  - kpi
---

# Daily SDR Performance Recap

Chaque jour a 18h00 (Europe/Paris), consolider et publier le recap de performance de chaque SDR de l'agence.

## Contenu du recap

Pour chaque SDR actif :

1. **Nombre d'appels passes** (vs objectif 80-120)
2. **Taux de connexion** du jour (vs objectif >15%)
3. **RDV poses** dans la journee
4. **Taux de conversion** appels decroches → RDV
5. **Statut** : vert (dans les objectifs), orange (sous les objectifs mais acceptable), rouge (sous-performance)

## Format

```
📊 Recap Quotidien SDR — [JJ/MM/AAAA]

[Prenom SDR 1] 🟢
  Appels : 95 | Connexions : 16 (16.8%) | RDV : 3
  
[Prenom SDR 2] 🟡
  Appels : 72 | Connexions : 9 (12.5%) | RDV : 1
  ⚠️ Sous objectif appels (72 < 80) — jour 1/2

[Prenom SDR 3] 🔴
  Appels : 45 | Connexions : 4 (8.9%) | RDV : 0
  🚨 Sous objectif appels (45 < 80) — jour 2/2 → Alerte coaching
```

## Actions declenchees

- Si un SDR est en rouge 2 jours consecutifs → notification automatique au CEO et au SDR Coach
- Le recap est envoye via Discord dans le channel interne de l'equipe
- Le recap est egalement accessible dans le portail client (filtre par SDR assigne au client)
