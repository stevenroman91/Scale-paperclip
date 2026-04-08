---
name: auto-bug-triage
description: Analyse de stack trace, identification du fichier/fonction concerne, tentative de reproduction automatique, generation de suggestion de fix
slug: auto-bug-triage
---

# Auto Bug Triage

Skill d'analyse et de triage automatise des bugs pour ScaleHQ.

## Capacites

- **Analyse de stack trace** : parsing automatique des stack traces pour identifier le fichier source, la fonction, et la ligne concernes. Support des stack traces Next.js (server et client), Prisma, et Node.js.
- **Identification du contexte** : determination du module affecte (API route, composant React, service Prisma, integration tierce) et de la severite probable (crash, erreur fonctionnelle, erreur visuelle).
- **Reproduction automatique** : tentative de reproduction du bug en analysant les conditions decrites par l'utilisateur — endpoint concerne, parametres d'entree, etat attendu vs etat obtenu. Generation d'un script de reproduction si possible.
- **Suggestion de fix** : analyse du code concerne et generation d'une suggestion de correction avec explication de la cause racine probable. La suggestion est proposee au Bug Fixer pour validation humaine avant application.
- **Correlation** : rapprochement du bug avec les bugs precedents (meme fichier, meme fonction, meme pattern d'erreur) pour identifier les regressions et les zones de fragilite du code.
