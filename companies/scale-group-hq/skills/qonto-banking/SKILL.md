---
name: qonto-banking
description: Integration with Qonto API v2 — account balances, transactions, categorization, wire transfers initiation
slug: qonto-banking
version: 0.1.0
tags:
  - finance
  - banking
  - qonto
---

# Qonto Banking

Integration avec l'API Qonto v2 pour le pilotage bancaire du groupe Scale.

## Capacites

- **Consultation des soldes** : recuperation en temps reel des soldes de tous les comptes Qonto du groupe
- **Historique des transactions** : liste des transactions avec filtres (date, montant, type, statut, categorie)
- **Categorisation** : lecture et mise a jour des categories de depenses pour chaque transaction
- **Initiation de virements** : preparation d'ordres de virement SEPA (salaires, fournisseurs, freelances) avec soumission pour approbation
- **Recherche de transactions** : recherche par libelle, montant, reference ou contrepartie

## Configuration requise

- Cle API Qonto (organisation ID + secret key)
- Permissions : lecture des comptes, lecture des transactions, initiation de virements

## Utilisation typique

Le Controller utilise ce skill quotidiennement pour le rapprochement bancaire. Le CFO l'utilise pour les verifications de tresorerie. Le Payroll Manager l'utilise pour l'execution des virements de paie.
