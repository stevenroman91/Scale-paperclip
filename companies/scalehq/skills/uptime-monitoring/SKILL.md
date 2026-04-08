---
name: uptime-monitoring
description: Health check endpoints, alertes de downtime, auto-restart si necessaire, logging des incidents
slug: uptime-monitoring
---

# Uptime Monitoring

Skill de surveillance de la disponibilite de la plateforme ScaleHQ.

## Capacites

- **Health check endpoints** : appel regulier des endpoints de sante (`/api/health`) qui verifient la connectivite base de donnees, la disponibilite des services tiers (Stripe, APIs telephonie), et la sante globale de l'application.
- **Alertes de downtime** : detection immediate des pannes (endpoint non accessible, temps de reponse > seuil, code HTTP d'erreur) et envoi d'alertes au DevOps et au CTO.
- **Auto-restart** : tentative de redemarrage automatique du service Railway en cas de panne detectee, avec verification post-restart que le service est de nouveau operationnel.
- **Logging des incidents** : documentation automatique de chaque incident — timestamp de debut, timestamp de fin, duree, cause probable, actions automatiques entreprises, resolution.
- **Metriques de disponibilite** : calcul et suivi du taux de disponibilite (uptime %) sur des periodes glissantes (24h, 7j, 30j). Alerte si le taux passe sous le seuil objectif (99.9%).
- **Escalade** : si l'auto-restart echoue apres 2 tentatives, escalade automatique au DevOps avec tous les logs et metriques pertinents.
