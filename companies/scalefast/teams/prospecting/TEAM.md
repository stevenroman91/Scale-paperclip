---
name: Prospecting
description: Equipe de prospection — enrichissement des donnees et constitution de listes de prospects qualifies
slug: prospecting
schema: agentcompanies/v1
manager: ../../agents/ceo/AGENTS.md
includes:
  - ../../agents/enrichment-agent/AGENTS.md
  - ../../agents/list-builder/AGENTS.md
tags:
  - prospecting
  - enrichment
---

# Prospecting

L'equipe Prospecting est responsable de l'amont du funnel de ScaleFast : la constitution de listes de prospects qualifies et l'enrichissement de leurs coordonnees pour permettre aux SDR de les contacter.

## Composition

- **CEO** (manager) : supervise directement l'equipe prospecting car la qualite des listes impacte directement la performance de toute l'agence
- **Enrichment Agent** : waterfall d'enrichissement Kaspr → FullEnrich, gestion du cache, suivi des couts
- **List Builder** : scraping LinkedIn Sales Nav, filtrage ICP, scoring, deduplication

## Objectifs

- Taux d'enrichissement reussi > 60%
- Cout moyen par lead enrichi < 0.45 EUR
- Taux de correspondance ICP > 80%
- Taux de deduplication < 15%
- Zero depassement de budget enrichissement sans validation CEO
