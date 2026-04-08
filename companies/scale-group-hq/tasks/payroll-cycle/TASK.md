---
name: Payroll Cycle
slug: payroll-cycle
assignee: payroll-manager
recurring: true
schedule:
  recurrence: monthly
  dayOfMonth: 25
  time: "09:00"
  timezone: Europe/Paris
tags:
  - hr
  - payroll
  - monthly
---

# Cycle de paie mensuel

## Objectif

Preparer et executer le cycle de paie mensuel du groupe Scale : calcul des salaires, generation des bulletins de paie, preparation des virements et soumission pour approbation du CFO.

## Procedure

### 1. Collecte des donnees variables
- Recuperer les absences, conges, heures supplementaires du mois
- Recuperer les primes et commissions variables validees par les managers
- Verifier les entrees/sorties du mois (prorata, solde de tout compte)

### 2. Calcul de la paie
- Calculer les salaires bruts (fixe + variable + primes)
- Calculer les cotisations salariales et patronales (URSSAF, retraite, prevoyance, mutuelle, CSG/CRDS)
- Calculer les nets a payer
- Verifier la coherence avec les mois precedents (ecarts > 5% signales)

### 3. Generation des bulletins
- Generer les bulletins de paie conformes a la reglementation francaise
- Verifier les mentions obligatoires (convention collective Syntec, cumuls annuels)

### 4. Preparation des virements
- Preparer les ordres de virement Qonto pour les salaries FR
- Preparer les ordres de virement Revolut pour les freelances internationaux
- Generer le recapitulatif des virements (montant total, nombre de beneficiaires)

### 5. Soumission pour approbation
- Transmettre au CFO : bulletins de paie, recapitulatif des virements, montant total
- Attendre la validation du CFO avant execution des virements

### 6. Declarations
- Preparer la DSN mensuelle
- Soumettre la DSN aux organismes sociaux

## Livrable

Virements de paie prepares et soumis au CFO pour approbation avant le 27 du mois. DSN soumise avant le 5 du mois suivant.
