---
name: changelog-generator
description: Generation automatique du changelog a partir des PRs mergees, publication a chaque deploiement
slug: changelog-generator
---

# Changelog Generator

Skill de generation automatique de changelog pour ScaleHQ.

## Capacites

- **Extraction des PRs** : collecte de toutes les Pull Requests mergees depuis le dernier deploiement, avec leurs titres, descriptions, labels, et auteurs.
- **Categorisation** : classement automatique des changements par categorie — nouvelles fonctionnalites (feat), corrections de bugs (fix), ameliorations (refactor), documentation (docs), infrastructure (chore).
- **Generation du changelog** : redaction d'un changelog structure et lisible avec les sections par categorie, les descriptions humainement comprehensibles, et les references aux PRs/tickets.
- **Publication** : publication du changelog dans le fichier CHANGELOG.md du repo, et optionnellement envoi par notification (email, in-app) aux utilisateurs concernes.
- **Versioning** : suggestion du numero de version suivant selon semver (major, minor, patch) base sur la nature des changements inclus.
