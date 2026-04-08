---
name: ScaleFast
description: Agence SDR spécialisée dans la génération de rendez-vous qualifiés B2B
slug: scalefast
schema: agentcompanies/v1
version: 0.1.0
license: MIT
authors:
  - name: Steven Roman
goals:
  - Generate qualified B2B appointments for agency clients
  - Maximize SDR performance across all campaigns
  - Minimize no-show rate on booked appointments
  - Deliver transparent and real-time client reporting
requirements:
  secrets:
    - DISCORD_WEBHOOK_URL
    - KASPR_API_KEY
    - FULLENRICH_API_KEY
    - OPENAI_API_KEY
    - ANTHROPIC_API_KEY
---

# ScaleFast

ScaleFast est une agence SDR francaise specialisee dans la generation de rendez-vous qualifies B2B pour ses clients. L'agence prend en charge l'ensemble du cycle de prospection — de la constitution de listes de prospects jusqu'a la tenue effective du rendez-vous — pour le compte d'entreprises qui externalisent leur developpement commercial.

## Proposition de valeur

ScaleFast ne vend pas des leads, mais des rendez-vous qualifies qui se tiennent. Le modele repose sur trois piliers :

- **Qualification rigoureuse** : chaque rendez-vous est filtre selon les criteres ICP du client (taille d'entreprise, secteur, poste du decideur, budget potentiel)
- **Minimisation du no-show** : systeme anti no-show avec rappels automatises, gestion des jours feries, et suivi des confirmations
- **Transparence totale** : reporting hebdomadaire par client avec visibilite complete sur le funnel (leads contactes, qualifies, RDV poses, RDV tenus, deals signes)

## Existant technique — ScaleFast Copilot

L'application existante (repo: `stevenroman91/scalefast-devis`) est construite sur Express.js avec PostgreSQL. Elle integre :

- **Waterfall d'enrichissement** : cascade d'APIs pour obtenir les coordonnees des prospects — Kaspr (0.36 EUR/credit) en priorite, puis FullEnrich (0.49 EUR/credit) en fallback. Deduplication automatique et cache d'echecs 24h pour eviter les appels redondants.
- **Systeme anti no-show** : rappels Discord automatiques envoyes 2 jours ouvres avant chaque rendez-vous. Gestion intelligente des jours feries francais (report au vendredi precedent). Colonne de suivi des relances avec statuts visuels.
- **Notifications Discord** : webhook Discord pour les alertes de performance, les rappels de rendez-vous, et les confirmations de relance.
- **Heatmaps de performance** : visualisation des creneaux horaires les plus performants pour les appels et les prises de rendez-vous, par SDR et par campagne.
- **Dashboard de couts** : suivi en temps reel des depenses d'enrichissement par provider, avec alertes de depassement de budget.

## Organisation

L'agence est structuree autour de deux poles :

- **Sales Ops** : pilotage des performances SDR, suivi du pipeline client, gestion anti no-show, et portail client self-service
- **Prospecting** : enrichissement des donnees prospects et constitution de listes qualifiees

Chaque SDR est suivi individuellement avec des KPIs quotidiens (appels/jour, taux de connexion, taux de conversion, RDV poses, taux de no-show) et un coaching hebdomadaire base sur l'analyse des appels.
