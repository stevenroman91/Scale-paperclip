---
name: prospect-list-builder
description: Prospect list creation — LinkedIn Sales Nav scraping, ICP filtering, scoring, deduplication with existing base
slug: prospect-list-builder
schema: agentcompanies/v1
tags:
  - prospecting
  - linkedin
  - icp
  - scoring
---

# Prospect List Builder

Skill de creation de listes de prospects qualifies a partir de LinkedIn Sales Navigator pour les campagnes ScaleFast.

## Process

### 1. Brief client

Recevoir et valider le brief client avec les criteres ICP :

- Postes cibles (ex: "Directeur Commercial", "VP Sales", "CEO")
- Taille d'entreprise (ex: 50-500 salaries)
- Secteurs d'activite (ex: SaaS, FinTech, EdTech)
- Zone geographique (ex: France, Ile-de-France)
- Criteres supplementaires (technologies, CA, levee de fonds recente)

### 2. Extraction LinkedIn Sales Navigator

- Configurer les filtres Sales Navigator selon le brief
- Extraire les profils par batch de 100 a 500
- Donnees extraites par profil :
  - Nom complet
  - Poste actuel
  - Entreprise actuelle
  - URL LinkedIn
  - Localisation
  - Anciennete dans le poste
  - Taille de l'entreprise
  - Secteur d'activite

### 3. Scoring ICP

Chaque prospect recoit un score de 0 a 100 :

| Critere | Ponderation | Scoring |
|---------|-------------|---------|
| Correspondance poste | 30% | Exact = 100, similaire = 60, eloigne = 20 |
| Taille entreprise | 20% | Dans la fourchette = 100, proche = 60, hors cible = 0 |
| Secteur d'activite | 20% | Exact = 100, adjacent = 50, hors cible = 0 |
| Zone geographique | 15% | Exact = 100, region adjacente = 50, hors zone = 0 |
| Signaux d'intention | 15% | Changement de poste < 6 mois = 80, publication recente = 50, levee de fonds = 90, aucun = 0 |

Seuils :
- Score >= 70 : prospect prioritaire (appeler en premier)
- Score 50-69 : prospect standard
- Score < 50 : prospect exclu de la liste

### 4. Deduplication

Verification sur trois axes :

1. **URL LinkedIn** : correspondance exacte
2. **Email** : si deja connu dans la base
3. **Domaine entreprise + poste** : pour eviter de contacter deux personnes au meme poste dans la meme entreprise pour le meme client

Regles de dedup :
- Prospect deja dans le pipeline actif du client → exclusion
- Prospect deja client du client agence → exclusion absolue
- Prospect contacte par un autre client de l'agence → autoriser (pas de conflit, clients differents)

### 5. Livraison

- Liste nettoyee envoyee a l'Enrichment Agent pour obtenir les coordonnees
- Rapport de qualite de la liste : nombre total, score moyen, taux de dedup, repartition par score

## Metriques de qualite

| Metrique | Objectif |
|----------|----------|
| Taux de correspondance ICP | > 80% |
| Score moyen de la liste | > 65 |
| Taux de dedup | < 15% |
| Taux d'enrichissement post-livraison | > 60% |
