---
name: french-holidays
description: French public holidays management — no reminders on holidays, anticipate to previous business day, complete list of jours feries
slug: french-holidays
schema: agentcompanies/v1
tags:
  - holidays
  - france
  - business-days
---

# French Holidays

Skill de gestion des jours feries francais pour le calcul des jours ouvres chez ScaleFast.

## Liste des jours feries francais

| Jour ferie | Date | Type |
|------------|------|------|
| Jour de l'An | 1er janvier | Fixe |
| Lundi de Paques | Variable (mars/avril) | Mobile |
| Fete du Travail | 1er mai | Fixe |
| Victoire 1945 | 8 mai | Fixe |
| Ascension | Variable (mai/juin, jeudi) | Mobile |
| Lundi de Pentecote | Variable (mai/juin) | Mobile |
| Fete nationale | 14 juillet | Fixe |
| Assomption | 15 aout | Fixe |
| Toussaint | 1er novembre | Fixe |
| Armistice | 11 novembre | Fixe |
| Noel | 25 decembre | Fixe |

## Calcul des jours feries mobiles

Les jours feries mobiles dependent de la date de Paques (algorithme de Computus) :

- **Lundi de Paques** : Paques + 1 jour
- **Ascension** : Paques + 39 jours (toujours un jeudi)
- **Lundi de Pentecote** : Paques + 50 jours

## Regles d'application

### Rappels anti no-show

- **Aucun rappel n'est envoye un jour ferie** : si le jour de rappel tombe un jour ferie, le rappel est anticipe au jour ouvre precedent
- **Calcul J+2 ouvres** : les jours feries sont exclus du decompte des jours ouvres, au meme titre que les samedis et dimanches

### Exemples concrets

| Aujourd'hui | RDV prevu le | Rappel envoye le | Explication |
|-------------|-------------|------------------|-------------|
| Lundi | Mercredi | Lundi | J+2 ouvres standard |
| Mercredi | Vendredi | Mercredi | J+2 ouvres standard |
| Vendredi | Mardi | Vendredi | Samedi et dimanche ne comptent pas |
| Jeudi (veille de pont) | Mardi (apres un lundi ferie) | Jeudi | Vendredi = J+1, mardi = J+2 car lundi ferie |
| Mercredi | Vendredi (jour ferie) | N/A | Pas de rappel car le RDV est un jour ferie — alerter le SDR |

### Ponts

Les ponts ne sont pas des jours feries officiels. Les rappels sont envoyes normalement les jours de pont, sauf instruction contraire du CEO.

## Validation annuelle

En debut d'annee, generer la liste complete des jours feries de l'annee en cours et la faire valider. Les jours feries mobiles changent chaque annee.
