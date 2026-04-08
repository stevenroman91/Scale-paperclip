---
name: linkedin-enrichment
description: Waterfall enrichment APIs — Kaspr then FullEnrich, deduplication, failure cache 24h, cost tracking per provider
slug: linkedin-enrichment
schema: agentcompanies/v1
tags:
  - enrichment
  - linkedin
  - kaspr
  - fullenrich
---

# LinkedIn Enrichment

Skill d'enrichissement de donnees prospects par waterfall d'APIs a partir de profils LinkedIn.

## Providers

| Provider | Cout/credit | Priorite | Specialite |
|----------|-------------|----------|------------|
| Kaspr | 0.36 EUR | 1 (premier choix) | Numeros de telephone directs, fort taux de succes en France |
| FullEnrich | 0.49 EUR | 2 (fallback) | Couverture plus large, inclut email + telephone |

## Logique du waterfall

```
Entree : URL LinkedIn du prospect

1. DEDUP CHECK
   → Rechercher dans la base existante (URL LinkedIn, email, domaine entreprise)
   → Si deja enrichi avec succes → retourner les donnees existantes (cout = 0)

2. FAILURE CACHE CHECK
   → Rechercher dans le cache d'echecs (cle = URL LinkedIn + provider)
   → Si echec < 24h pour ce provider → passer au provider suivant

3. KASPR (priorite 1)
   → Appel API Kaspr avec l'URL LinkedIn
   → Si succes (telephone valide retourne) :
     - Stocker le resultat
     - Incrementer compteur cout Kaspr (+0.36 EUR)
     - Retourner le resultat
   → Si echec (pas de resultat ou numero invalide) :
     - Cacher l'echec (TTL = 24h)
     - Passer a FullEnrich

4. FULLENRICH (priorite 2)
   → Appel API FullEnrich avec l'URL LinkedIn
   → Si succes :
     - Stocker le resultat
     - Incrementer compteur cout FullEnrich (+0.49 EUR)
     - Retourner le resultat
   → Si echec :
     - Cacher l'echec (TTL = 24h)
     - Marquer le prospect comme "non enrichissable"
     - Retourner echec

Sortie : { telephone, email, provider, cout, statut }
```

## Cache d'echecs

- **Cle** : `{linkedin_url}:{provider}`
- **TTL** : 24 heures
- **Objectif** : eviter de depenser un credit pour un prospect qu'on sait non enrichissable par un provider donne
- **Invalidation** : automatique apres 24h (les bases des providers sont mises a jour regulierement)

## Suivi des couts

Dashboard en temps reel :

| Metrique | Description |
|----------|-------------|
| Cout total Kaspr | Somme des credits consommes x 0.36 EUR |
| Cout total FullEnrich | Somme des credits consommes x 0.49 EUR |
| Cout total enrichissement | Kaspr + FullEnrich |
| Cout moyen par lead enrichi | Cout total / nombre de leads enrichis avec succes |
| Taux de succes Kaspr | Leads enrichis / tentatives Kaspr |
| Taux de succes FullEnrich | Leads enrichis / tentatives FullEnrich |
| Taux de succes global | Leads enrichis / total des prospects soumis |
| Budget consomme (%) | Cout total / budget mensuel alloue |

## Alertes budget

- 50% du budget → notification informative
- 80% du budget → alerte jaune, reduire les enrichissements non prioritaires
- 95% du budget → alerte rouge, stopper et demander validation CEO
