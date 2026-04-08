---
name: elearning-management
description: E-learning platform management — CRUD modules, learning paths, evaluations, certifications, progress tracking
slug: elearning-management
---

# E-Learning Management

Skill de gestion de la plateforme e-learning de ScaleAcademy. Couvre le cycle de vie complet des modules de formation, des parcours d'apprentissage, du suivi de progression et des certifications.

## Data Models

### Module

```json
{
  "id": "mod_<uuid>",
  "title": "Qualifier un prospect en 3 questions",
  "slug": "qualifier-prospect-3-questions",
  "description": "Apprendre a qualifier rapidement un prospect B2B en posant 3 questions strategiques.",
  "category": "prospecting | objection_handling | closing | tools | product_knowledge | soft_skills",
  "difficulty": "beginner | intermediate | advanced",
  "format": "video | text | interactive | quiz | simulation",
  "duration_minutes": 25,
  "content": {
    "type": "google_doc_iframe | markdown | video_url",
    "url_or_body": "https://docs.google.com/document/d/1abc.../edit?embedded=true"
  },
  "prerequisites": ["mod_abc123", "mod_def456"],
  "learning_objectives": [
    "Identifier le budget du prospect en moins de 2 minutes",
    "Determiner le pouvoir de decision de l'interlocuteur",
    "Qualifier le besoin reel vs. le besoin exprime"
  ],
  "evaluation": {
    "type": "quiz | simulation | peer_review",
    "passing_score": 70
  },
  "status": "draft | published | archived",
  "version": "1.2.0",
  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-03-20T14:30:00Z",
  "published_at": "2026-02-01T09:00:00Z"
}
```

### Learning Path

```json
{
  "id": "path_<uuid>",
  "title": "SDR Junior — Fondamentaux de la prospection",
  "description": "Parcours complet pour former un SDR debutant aux bases de la prospection B2B.",
  "target_role": "sdr_junior | sdr_confirmed | account_manager",
  "modules": [
    { "module_id": "mod_abc123", "order": 1, "is_required": true },
    { "module_id": "mod_def456", "order": 2, "is_required": true },
    { "module_id": "mod_ghi789", "order": 3, "is_required": false }
  ],
  "estimated_duration_hours": 12,
  "certification": {
    "name": "ScaleAcademy SDR Junior Certified",
    "badge_url": "https://cdn.scaleacademy.fr/badges/sdr-junior-certified.png",
    "validity_months": 12
  }
}
```

### Learner Progress

```json
{
  "learner_id": "user_<uuid>",
  "module_id": "mod_abc123",
  "status": "not_started | in_progress | completed | failed",
  "started_at": "2026-03-01T08:00:00Z",
  "completed_at": "2026-03-01T08:42:00Z",
  "score": 85,
  "attempts": 1,
  "time_spent_minutes": 42
}
```

## CRUD Operations

### Create Module

1. Validate all required fields (title, category, difficulty, format, content).
2. Generate `id` as `mod_<uuid>` and `slug` from title (lowercase, hyphens).
3. Set `status` to `"draft"`, `version` to `"1.0.0"`, `created_at` and `updated_at` to now.
4. Validate prerequisites exist and are published.
5. Store in database and return the created module.

**Example:**
```
POST /api/modules
{
  "title": "Traiter l'objection prix",
  "category": "objection_handling",
  "difficulty": "intermediate",
  "format": "interactive",
  "duration_minutes": 20,
  "content": { "type": "markdown", "url_or_body": "## Introduction\n..." },
  "prerequisites": ["mod_abc123"],
  "learning_objectives": ["Reformuler l'objection prix en valeur", "Utiliser la technique du sandwich"],
  "evaluation": { "type": "quiz", "passing_score": 75 }
}
```

### Update Module

1. Validate module exists and is not archived.
2. Apply changes, increment `version` (patch for content fixes, minor for new sections, major for restructuring).
3. Set `updated_at` to now.
4. **Content versioning trigger:** If the update is a minor or major version bump and the module is published, identify all learners with `status: "completed"` and create a refresh notification for each.

### Delete Module (Soft)

1. Set `status` to `"archived"`.
2. Remove from any learning paths (or mark as `"archived"` within the path).
3. Retain all learner progress data for analytics.

### Manage Learning Paths

- **Create:** Define a new learning path with ordered modules, target role, and optional certification.
- **Reorder:** Change `order` of modules within a path. Validate no circular prerequisite dependencies.
- **Add/Remove modules:** Add new modules or remove existing ones. If a required module is removed, notify all enrolled learners.

### Track Progress

- **Start module:** Set `status` to `"in_progress"`, record `started_at`.
- **Complete module:** Validate evaluation score >= `passing_score`. Set `status` to `"completed"`, record `completed_at` and `score`. Increment `attempts`.
- **Fail module:** Score < `passing_score`. Set `status` to `"failed"`, increment `attempts`. Allow retry.

## Certification Flow

```
Learner completes all required modules in a learning path
         |
         v
System checks: all required modules have status "completed"
AND each score >= module.evaluation.passing_score
         |
         v
    [All passed?]
      /        \
    Yes          No
     |            |
     v            v
Generate       Identify missing/failed
certificate    modules and notify learner
     |
     v
Store certificate record:
{
  learner_id, path_id, certification_name,
  issued_at, expires_at (issued_at + validity_months),
  badge_url
}
     |
     v
Send email notification to learner:
  "Felicitations {name} ! Vous avez obtenu la certification
   {certification_name}. Votre badge est disponible ici: {badge_url}"
     |
     v
Notify manager with summary:
  "{name} a obtenu la certification {certification_name}
   le {date}. Score moyen: {avg_score}%."
```

## Content Versioning

When a published module is updated:

1. Compare old and new version numbers.
2. **Patch (1.0.0 -> 1.0.1):** Typo fixes, formatting. No notification.
3. **Minor (1.0.0 -> 1.1.0):** New content added, examples updated. Send "refresh" notification:
   - "Le module '{title}' a ete mis a jour. De nouveaux contenus sont disponibles. Nous vous recommandons de le reparcourir."
4. **Major (1.0.0 -> 2.0.0):** Significant restructuring. Mark previous completions as `"needs_refresh"` and send notification:
   - "Le module '{title}' a ete profondement remanie. Votre completion precedente reste valide, mais nous vous recommandons de refaire le module pour rester a jour."

## Evaluation Criteria

| Criteria | Weight | Description |
|----------|--------|-------------|
| Data integrity | 30% | All module fields validated, no orphan references, prerequisites consistent |
| CRUD correctness | 25% | Create/read/update/archive operations produce expected state changes |
| Progress accuracy | 20% | Learner progress is tracked accurately, scores computed correctly |
| Certification logic | 15% | Certificates issued only when all conditions met, expiration tracked |
| Versioning & notifications | 10% | Content updates trigger appropriate notifications based on severity |

### Rubric

- **Excellent (90-100%):** All CRUD operations work flawlessly. Progress tracking is real-time and accurate. Certifications are issued correctly with proper email notifications. Content versioning triggers appropriate refresh notifications.
- **Good (70-89%):** Core CRUD works. Minor issues with edge cases (e.g., circular prerequisites not caught). Certifications mostly correct.
- **Needs Improvement (50-69%):** Basic operations work but progress tracking has gaps. Certification logic has edge case failures. No versioning notifications.
- **Failing (<50%):** CRUD operations produce inconsistent state. Progress not tracked. Certifications issued incorrectly.
