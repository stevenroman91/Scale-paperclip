---
name: payroll-fr
description: French payroll management — social charges calculation, DSN declarations, payslip generation
slug: payroll-fr
version: 0.1.0
tags:
  - hr
  - payroll
  - france
  - social-charges
---

# Payroll FR

Gestion de la paie francaise pour le groupe Scale : calcul des charges sociales, declarations DSN et generation des bulletins de paie.

## Capacites

- **Calcul des charges sociales** : calcul automatique des cotisations patronales et salariales (URSSAF, retraite AGIRC-ARRCO, prevoyance, mutuelle, CSG/CRDS, taxe sur les salaires)
- **Declarations DSN** : preparation et generation des Declarations Sociales Nominatives mensuelles et evenementielles (embauche, fin de contrat, arret maladie)
- **Generation des bulletins de paie** : production des fiches de paie conformes a la reglementation francaise (mentions obligatoires, cumuls annuels)
- **Simulation de paie** : simulation du cout employeur et du net a payer pour un salaire brut donne
- **Gestion des conges payes** : calcul des droits a conges, provisions pour conges payes, solde de tout compte

## Configuration requise

- Parametres URSSAF a jour (taux de cotisation en vigueur)
- Convention collective applicable (Syntec pour le groupe Scale)
- Donnees des salaries (salaire brut, statut, anciennete, situation familiale)

## Utilisation typique

Le Payroll Manager utilise ce skill pour l'ensemble du cycle de paie mensuel : calcul des salaires, generation des bulletins, preparation des declarations DSN et simulation des couts pour le CFO.
