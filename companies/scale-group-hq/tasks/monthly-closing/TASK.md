---
name: Monthly Closing
slug: monthly-closing
assignee: controller
recurring: true
schedule:
  recurrence: monthly
  dayOfMonth: 1
  time: "08:00"
  timezone: Europe/Paris
tags:
  - finance
  - accounting
  - monthly
---

# Cloture mensuelle

## Objectif

Realiser la cloture comptable mensuelle du groupe Scale : rapprochement bancaire complet, export Pennylane et preparation des etats financiers.

## Procedure

### 1. Rapprochement bancaire complet
- Verifier la concordance de toutes les transactions Qonto du mois avec les ecritures Pennylane
- Verifier la concordance de toutes les transactions Revolut du mois avec les ecritures Pennylane
- Identifier et traiter les ecarts (transactions non rapprochees, ecritures manquantes, doublons)

### 2. Verification des ecritures
- S'assurer que toutes les factures du mois sont saisies dans Pennylane
- Verifier la categorisation de chaque ecriture selon le plan comptable (PCG)
- Controler les ecritures de paie (concordance avec les bulletins du Payroll Manager)

### 3. Export Pennylane
- Generer l'export comptable du mois (balance, grand livre)
- Verifier la coherence des totaux (actif = passif, debit = credit)
- Preparer le fichier FEC si demande par l'expert-comptable

### 4. Etats financiers
- Generer le compte de resultat du mois
- Generer le bilan a la date de cloture
- Preparer les annexes (detail des charges, provisions, immobilisations)

### 5. Dossier de cloture
- Assembler le dossier complet (rapprochements, etats, anomalies traitees)
- Transmettre au CFO pour validation

## Livrable

Dossier de cloture mensuelle complet transmis au CFO avant le 5 du mois suivant.
