---
name: knowledge-base-rag
description: RAG sur la base de connaissances — indexation des documents, recherche semantique, generation de reponses sourcees
slug: knowledge-base-rag
---

# Knowledge Base RAG

Skill de Retrieval-Augmented Generation sur la base de connaissances ScaleHQ.

## Capacites

- **Indexation des documents** : ingestion et indexation de la base de connaissances — articles d'aide, FAQ, guides de demarrage, documentation technique, release notes. Chaque document est decoupe en chunks et vectorise pour la recherche semantique.
- **Recherche semantique** : recherche par similarite semantique dans la base vectorielle — une question en langage naturel retourne les chunks les plus pertinents, meme si les mots-cles exacts ne correspondent pas.
- **Generation de reponses sourcees** : generation d'une reponse synthetique a partir des chunks recuperes, avec citation des sources (titre et lien vers l'article original). La reponse est fidele aux sources et ne contient pas d'information inventee.
- **Score de confiance** : chaque reponse est accompagnee d'un score de confiance base sur la similarite des chunks recuperes. Si le score est sous le seuil, le bot indique qu'il n'est pas sur de sa reponse et propose l'escalade.
- **Mise a jour incrementale** : re-indexation incrementale de la base a chaque modification d'article, sans necessiter une re-indexation complete.
- **Detection de lacunes** : identification des questions frequentes pour lesquelles aucun article pertinent n'existe dans la base, pour alimenter la creation de nouveaux contenus.
