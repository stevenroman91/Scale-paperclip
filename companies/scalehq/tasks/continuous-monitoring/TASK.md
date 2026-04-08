---
name: Continuous Monitoring
description: Health check des endpoints critiques toutes les 5 minutes, alerte en cas de downtime
slug: continuous-monitoring
assignee: devops
schedule:
  cron: "*/5 * * * *"
  timezone: Europe/Paris
---

# Continuous Monitoring

Toutes les 5 minutes, le DevOps execute un health check sur les endpoints critiques de la plateforme ScaleHQ.

## Procedure

1. **Health check** : appeler l'endpoint `/api/health` et verifier le code HTTP (200 attendu), le temps de reponse (< 2 secondes), et le contenu de la reponse (status de la base de donnees, status des services tiers).
2. **Verification des services** : confirmer la connectivite base de donnees PostgreSQL, la disponibilite de l'API Stripe, et la resolution DNS du domaine.
3. **Si OK** : logger le check (timestamp, temps de reponse) et passer au cycle suivant.
4. **Si KO** : declencher la procedure d'incident :
   a. Tenter un diagnostic automatique (analyse des logs recents, verification des metriques).
   b. Si panne transitoire, tenter un auto-restart du service Railway.
   c. Verifier le retour a la normale apres restart.
   d. Si le probleme persiste apres 2 tentatives, alerter le CTO immediatement.
5. **Logger l'incident** : documenter l'incident — timestamp debut, timestamp fin, duree, cause probable, actions entreprises, resolution.

## Criteres d'alerte

- Endpoint non accessible (timeout ou erreur reseau).
- Code HTTP != 200.
- Temps de reponse > 5 secondes.
- Base de donnees non connectee.
- Taux d'erreur > 5% sur les 15 dernieres minutes.

## Objectif de disponibilite

Uptime cible : 99.9% (moins de 8h45 de downtime par an).
