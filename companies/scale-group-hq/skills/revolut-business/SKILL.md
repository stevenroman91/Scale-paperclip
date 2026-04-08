---
name: revolut-business
description: Integration with Revolut Business API — card expenses, FX tracking, international payments
slug: revolut-business
version: 0.1.0
tags:
  - finance
  - banking
  - revolut
---

# Revolut Business

Integration avec l'API Revolut Business pour la gestion des depenses carte, le suivi des operations de change et les paiements internationaux du groupe Scale.

## Capacites

- **Depenses carte** : consultation des transactions carte de tous les membres de l'equipe, suivi des plafonds et des categories
- **Suivi FX (change)** : suivi des operations de change, taux appliques, impact sur la tresorerie en EUR
- **Paiements internationaux** : initiation de paiements SWIFT et SEPA vers des beneficiaires internationaux (freelances, fournisseurs hors zone euro)
- **Consultation des soldes** : soldes multi-devises en temps reel
- **Historique des transactions** : liste des transactions avec filtres (date, devise, type, statut)

## Configuration requise

- Cle API Revolut Business (client ID + JWT)
- Permissions : lecture des comptes, lecture des transactions, initiation de paiements

## Utilisation typique

Le Controller utilise ce skill pour le rapprochement quotidien des operations Revolut. Le Payroll Manager l'utilise pour les paiements de freelances internationaux. Le CFO l'utilise pour le suivi de la tresorerie multi-devises.
