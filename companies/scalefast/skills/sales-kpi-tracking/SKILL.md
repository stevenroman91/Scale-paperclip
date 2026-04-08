---
name: sales-kpi-tracking
description: Calculate and track SDR metrics — calls/day, connect rate, conversion rate, no-show rate per SDR and per client
slug: sales-kpi-tracking
schema: agentcompanies/v1
tags:
  - sales
  - kpi
  - metrics
---

# Sales KPI Tracking

Skill de calcul et de suivi des metriques de performance des SDR chez ScaleFast.

## Metriques suivies

### Par SDR (quotidien)

| Metrique | Calcul | Objectif |
|----------|--------|----------|
| Appels/jour | Nombre total d'appels passes dans la journee | 80-120 |
| Taux de connexion | Appels decroches / appels passes | > 15% |
| Taux de conversion | RDV poses / appels decroches | > 3% |
| RDV poses/semaine | Nombre de RDV confirmes dans la semaine | Variable par contrat client |
| Taux de no-show | RDV non tenus / RDV poses | < 20% |
| Duree moyenne d'appel | Temps moyen des appels decroches | > 2 min (signe de conversation) |

### Par client (hebdomadaire)

| Metrique | Calcul |
|----------|--------|
| Volume de leads contactes | Total des prospects appeles pour ce client |
| RDV poses | Total des RDV confirmes |
| RDV tenus | RDV effectivement realises |
| Taux de conversion global | RDV tenus / leads contactes |
| Cout par RDV | (Cout enrichissement + cout SDR) / RDV tenus |

## Regles de calcul

- Les appels de moins de 10 secondes ne comptent pas comme des appels (faux numeros, messagerie immediate)
- Un RDV est "pose" uniquement quand il est confirme dans l'agenda du client
- Un RDV est "tenu" uniquement si le prospect s'est presente (confirmation du SDR ou du client)
- Le taux de no-show se calcule sur une fenetre glissante de 7 jours pour lisser les variations quotidiennes

## Alertes automatiques

- SDR sous 60 appels/jour pendant 2 jours consecutifs → alerte Sales Ops Manager
- Taux de connexion sous 10% sur 3 jours → verifier la qualite de la liste
- Taux de no-show au-dessus de 30% sur une semaine → alerte CEO + revue du process anti no-show
