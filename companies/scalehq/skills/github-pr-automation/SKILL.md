---
name: github-pr-automation
description: Workflow GitHub PR — creation de branche, commit, ouverture de PR, lien vers le ticket de feedback, demande de review
slug: github-pr-automation
---

# GitHub PR Automation

Skill d'automatisation du workflow de Pull Requests GitHub pour le repo ScaleHQ (`stevenroman91/ScaleHQ`).

## Capacites

- **Creation de branche** : creation automatique d'une branche a partir de `main` avec une convention de nommage standard — `feat/<ticket-id>-<description>`, `fix/<ticket-id>-<description>`, ou `refactor/<description>`.
- **Commits structures** : commits avec messages conventionnels (conventional commits) — `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`. Chaque commit reference le ticket associe.
- **Ouverture de PR** : creation automatique de la Pull Request avec titre descriptif, description detaillee (contexte, changements, tests, screenshots si UI), et labels appropries (bug, feature, refactor, etc.).
- **Lien vers le ticket** : association automatique de la PR avec le ticket de feedback source (issue GitHub, ticket interne) pour tracabilite complete du retour utilisateur au code deploye.
- **Demande de review** : assignation automatique du reviewer (CTO par defaut) et notification. Suivi du statut de la review (pending, approved, changes requested).
- **Checks CI** : verification que tous les checks CI passent avant de signaler la PR comme prete a merger — lint, type-check, tests, build.
