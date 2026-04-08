---
name: Daily Cash Position
slug: daily-cash-position
assignee: controller
recurring: true
schedule:
  recurrence: daily
  time: "08:00"
  timezone: Europe/Paris
tags:
  - finance
  - treasury
  - daily
---

# Position de tresorerie quotidienne

## Objectif

Verifier chaque matin les soldes des comptes bancaires du groupe Scale (Qonto et Revolut Business) et alerter le CFO si un solde passe sous le seuil de securite defini.

## Procedure

1. **Recuperer les soldes Qonto** : interroger l'API Qonto v2 pour obtenir le solde de chaque compte du groupe
2. **Recuperer les soldes Revolut** : interroger l'API Revolut Business pour obtenir les soldes multi-devises
3. **Consolider la position** : calculer la tresorerie totale groupe en EUR (conversion des soldes non-EUR au taux du jour)
4. **Verifier les seuils** : comparer chaque solde individuel et le solde consolide aux seuils d'alerte definis
5. **Generer le rapport** : produire un rapport synthetique de position de tresorerie
6. **Alerter si necessaire** : si un solde est inferieur au seuil, envoyer une alerte immediate au CFO

## Seuils d'alerte

- Seuil critique Qonto : a definir par le CFO
- Seuil critique Revolut : a definir par le CFO
- Seuil critique consolide : a definir par le CFO

## Livrable

Rapport de position de tresorerie quotidien transmis au CFO avant 9h.
