---
name: linkedin-publishing
description: LinkedIn API integration — post publishing, scheduling, engagement analytics
slug: linkedin-publishing
version: 0.1.0
tags:
  - marketing
  - linkedin
  - social-media
---

# LinkedIn Publishing

Integration avec l'API LinkedIn pour la publication de contenu, la programmation de posts et l'analyse de l'engagement.

## Capacites

- **Publication de posts** : publication de posts texte, images, carousels (documents PDF) et articles sur LinkedIn (profils personnels et pages entreprise)
- **Programmation** : planification de publications a une date et heure specifiques
- **Analyse d'engagement** : recuperation des metriques de performance par publication (impressions, likes, commentaires, partages, taux d'engagement)
- **Gestion des pages** : publication sur les pages entreprise de Scale Group HQ et des filiales
- **Analytics de profil** : suivi de l'evolution des abonnes, des vues de profil et de la portee organique

## Configuration requise

- Token OAuth 2.0 LinkedIn (scopes : w_member_social, r_organization_social, w_organization_social, r_organization_followers)
- ID des pages entreprise (Scale Group HQ + filiales)

## Utilisation typique

Le Content Manager utilise ce skill pour publier et programmer les posts LinkedIn du groupe. Le CMO l'utilise pour suivre les metriques d'engagement globales. Le Talent Acquisition l'utilise pour diffuser les offres d'emploi.
