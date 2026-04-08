---
name: Release Changelog
description: Generation et publication du changelog a chaque deploiement
slug: release-changelog
assignee: engineer
trigger: deploy
---

# Release Changelog

A chaque deploiement en production (declenche par webhook), l'Engineer genere et publie le changelog de la release.

## Procedure

1. **Identifier les PRs** : collecter toutes les Pull Requests mergees sur `main` depuis le dernier tag de release. Extraire les titres, descriptions, labels, et auteurs.
2. **Categoriser** : classer les changements par type en se basant sur les prefixes de commit et les labels de PR :
   - **Nouvelles fonctionnalites** (`feat:`, label `feature`)
   - **Corrections de bugs** (`fix:`, label `bug`)
   - **Ameliorations** (`refactor:`, label `enhancement`)
   - **Documentation** (`docs:`, label `docs`)
   - **Infrastructure** (`chore:`, `ci:`, label `infra`)
3. **Rediger le changelog** : generer un changelog structure et lisible avec les sections par categorie. Chaque entree contient une description humainement comprehensible et un lien vers la PR.
4. **Determiner la version** : suggerer le numero de version suivant selon semver — patch (bug fixes uniquement), minor (nouvelles fonctionnalites), major (breaking changes).
5. **Publier** : mettre a jour le fichier `CHANGELOG.md` dans le repo, creer un tag Git avec le numero de version, et optionnellement notifier les utilisateurs des nouveautes via notification in-app.

## Criteres de completion

- Le changelog est genere et commit dans le repo.
- Le tag de version est cree.
- Les changements sont correctement categorises.
- Le changelog est comprehensible par un utilisateur non-technique.
