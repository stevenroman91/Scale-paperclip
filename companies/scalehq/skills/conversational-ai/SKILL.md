---
name: conversational-ai
description: Framework chatbot — gestion du contexte conversationnel, detection d'intention, slot filling, handoff humain
slug: conversational-ai
---

# Conversational AI

Skill de framework conversationnel pour les chatbots ScaleHQ (CS Bot et Sales Bot).

## Capacites

- **Gestion du contexte conversationnel** : maintien de l'historique et du contexte de chaque conversation — questions posees, reponses fournies, intentions detectees, informations collectees. Le contexte persiste pendant toute la session.
- **Detection d'intention** : identification de l'intention de l'utilisateur a partir de son message — demande d'aide, question sur les tarifs, signalement de bug, demande de demo, etc. Support du multi-intent (plusieurs intentions dans un meme message).
- **Slot filling** : collecte progressive des informations necessaires pour traiter une demande — par exemple pour une reservation de demo : nom, email, taille d'agence, creneaux de disponibilite. Les slots manquants sont demandes un par un.
- **Handoff humain** : transfert de la conversation a un agent humain quand le bot ne peut pas resoudre le probleme, avec transmission du contexte complet (historique, intention detectee, informations collectees, raison de l'escalade).
- **Gestion des erreurs** : detection des situations d'incomprehension (intention non reconnue, reponse hors sujet) et strategies de recuperation — reformulation de la question, proposition de choix, ou escalade.
- **Multi-langue** : support du francais et de l'anglais avec detection automatique de la langue de l'utilisateur.
