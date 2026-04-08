---
name: pennylane-accounting
description: Integration with Pennylane API — invoices sync, accounting entries, financial statements generation
slug: pennylane-accounting
version: 0.1.0
tags:
  - finance
  - accounting
  - pennylane
---

# Pennylane Accounting

Integration avec l'API Pennylane pour la comptabilite et les etats financiers du groupe Scale.

## Capacites

- **Synchronisation des factures** : import et export des factures clients et fournisseurs, rapprochement avec les paiements bancaires
- **Ecritures comptables** : consultation et creation d'ecritures comptables selon le plan comptable francais (PCG)
- **Generation des etats financiers** : bilan, compte de resultat, balance generale, grand livre
- **Rapprochement bancaire** : verification de la concordance entre les ecritures Pennylane et les mouvements bancaires (Qonto, Revolut)
- **Export comptable** : generation des exports au format FEC (Fichier des Ecritures Comptables) pour l'administration fiscale

## Configuration requise

- Cle API Pennylane
- Permissions : lecture/ecriture factures, lecture/ecriture ecritures, generation etats financiers

## Utilisation typique

Le Controller utilise ce skill pour la verification quotidienne des ecritures et la preparation de la cloture mensuelle. Le CFO l'utilise pour la generation des etats financiers consolides.
