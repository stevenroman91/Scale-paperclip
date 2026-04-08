---
name: ScaleHQ
description: Plateforme SaaS B2B de pilotage pour agences SDR — dashboards KPI, call intelligence, e-learning, enrichissement prospects
slug: scalehq
schema: agentcompanies/v1
version: 0.1.0
license: MIT
authors:
  - name: Steven Roman
goals:
  - Build the #1 SaaS platform for SDR agencies
  - Grow MRR
  - Deliver exceptional user experience
  - Automate bug fixing from user feedback
requirements:
  secrets:
    - DATABASE_URL
    - NEXTAUTH_SECRET
    - STRIPE_SECRET_KEY
    - STRIPE_WEBHOOK_SECRET
    - OPENAI_API_KEY
    - ANTHROPIC_API_KEY
    - SMTP_HOST
    - SMTP_USER
    - SMTP_PASS
    - RAILWAY_TOKEN
---

# ScaleHQ

ScaleHQ est une plateforme SaaS B2B concue pour les agences SDR qui souhaitent piloter leur activite de prospection depuis un outil centralise et intelligent. Le repo source est `stevenroman91/ScaleHQ`.

## Proposition de valeur

ScaleHQ offre aux agences SDR un cockpit complet pour gerer leurs equipes, suivre la performance de chaque campagne, analyser les appels en temps reel grace a l'IA, et former leurs SDR via un module e-learning integre. La plateforme remplace la constellation d'outils (spreadsheets, CRM generiques, outils de reporting manuels) par une solution unifiee, pensee pour le metier SDR.

## Fonctionnalites principales

- **Setup wizard** : onboarding guide pour configurer l'agence, inviter les equipes, connecter la telephonie et activer la facturation Stripe en quelques minutes.
- **Integrations telephonie** : connexion aux principaux dialers (Aircall, Ringover, etc.) pour remonter automatiquement les appels, durees, et enregistrements.
- **Team invites** : systeme d'invitation par email avec gestion des roles (admin, manager, SDR) et permissions granulaires.
- **Stripe billing** : facturation SaaS avec plans mensuels, gestion des abonnements, et portail client Stripe pour les agences.
- **Plan gating** : restriction des fonctionnalites selon le plan souscrit (free, pro, enterprise) avec upsell contextuel.
- **Anti no-show emails** : envoi automatique de rappels e-mail avant chaque rendez-vous pour minimiser le taux de no-show.
- **Waterfall enrichment** : cascade d'APIs d'enrichissement (Kaspr, FullEnrich, etc.) pour obtenir les coordonnees des prospects avec deduplication et cache intelligent.
- **Playbook editor** : editeur de scripts d'appel et de sequences de prospection, avec versioning et partage entre equipes.
- **CSV export** : export des donnees (prospects, KPIs, rapports) en CSV pour integration avec les outils tiers.
- **Multi-channel notifications** : notifications par email (nodemailer), in-app, et webhooks pour les evenements critiques.
- **Call intelligence** : transcription des appels via OpenAI Whisper et analyse conversationnelle par Claude pour scoring, coaching et detection de patterns.
- **E-learning** : module de formation integre avec parcours personnalises, quiz, et suivi de progression par SDR.
- **Railway deployment** : deploiement sur Railway avec Docker multi-stage, health checks, et zero-downtime deploys.

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | React 19, Tailwind CSS, Radix UI |
| Langage | TypeScript |
| ORM / DB | Prisma + PostgreSQL |
| Auth | NextAuth v5 |
| Paiement | Stripe (subscriptions, webhooks, customer portal) |
| IA | OpenAI Whisper (transcription), Claude (analyse conversationnelle) |
| Email | nodemailer |
| Deploiement | Railway, Docker multi-stage |

## Organisation

L'equipe est structuree autour de trois poles :

- **Engineering** : developpement backend et frontend, DevOps, design system, correction de bugs automatisee.
- **Product** : gestion produit, support utilisateur, triage des retours.
- **Chatbots** : bots conversationnels (support in-app et qualification marketing).
