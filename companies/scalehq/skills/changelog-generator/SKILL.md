---
name: changelog-generator
description: Generation automatique du changelog a partir des PRs mergees, publication a chaque deploiement
slug: changelog-generator
---

# Changelog Generator

Automated changelog generation from merged PRs using conventional commits, with semantic versioning and multi-channel distribution.

## Source Data

Fetch merged PRs from the GitHub API for the `stevenroman91/ScaleHQ` repository:

```bash
# List merged PRs since the last release tag
LAST_TAG=$(gh release view --json tagName -q '.tagName' 2>/dev/null || echo "v0.0.0")
gh pr list --state merged --search "merged:>=$(git log -1 --format=%aI $LAST_TAG)" --json number,title,body,mergedAt,labels,author
```

Alternatively, parse the git log between two tags:
```bash
git log v1.2.2..HEAD --oneline --no-merges
```

## Conventional Commits Parsing

Map commit type prefixes to changelog sections:

| Commit Prefix | Changelog Section     | Include in Changelog? |
|---------------|-----------------------|-----------------------|
| `feat:`       | New Features          | Yes                   |
| `fix:`        | Bug Fixes             | Yes                   |
| `perf:`       | Performance           | Yes                   |
| `refactor:`   | Improvements          | Yes                   |
| `docs:`       | Documentation         | Yes (minor releases)  |
| `style:`      | (skip)                | No                    |
| `test:`       | (skip)                | No                    |
| `chore:`      | (skip)                | No                    |
| `ci:`         | (skip)                | No                    |

### Parsing Logic

```typescript
interface ChangelogEntry {
  type: string;           // feat, fix, perf, refactor, docs
  scope?: string;         // e.g., "export", "auth", "dashboard"
  description: string;    // human-readable summary
  pr_number: number;
  author: string;
  breaking: boolean;      // true if commit body contains "BREAKING CHANGE:"
  feedback_ticket?: string; // e.g., "FB-142" extracted from PR body
}

function parseCommitMessage(message: string): ChangelogEntry | null {
  const match = message.match(/^(\w+)(?:\(([^)]+)\))?(!)?:\s(.+)/);
  if (!match) return null;
  const [, type, scope, breaking, description] = match;
  if (["style", "test", "chore", "ci"].includes(type)) return null;
  return { type, scope, description, breaking: !!breaking, pr_number: 0, author: "" };
}
```

### Scope to Feature Name Mapping

| Scope         | Display Name        |
|---------------|---------------------|
| `auth`        | Authentication      |
| `dashboard`   | Dashboard           |
| `calls`       | Call Management     |
| `rdv`         | Appointments (RDV)  |
| `enrichment`  | Data Enrichment     |
| `export`      | Export/Import       |
| `billing`     | Billing             |
| `elearning`   | E-Learning          |
| `api`         | API                 |
| `widget`      | Widgets             |

## Output Format

### Markdown Changelog

```markdown
## v1.2.3 — 2026-04-08

### New Features
- **Call Intelligence**: Added real-time call scoring dashboard with per-SDR performance metrics (#123)
- **Data Enrichment**: New bulk enrichment mode for importing company lists via CSV (#131)

### Bug Fixes
- Fixed CSV export encoding for French characters — Excel now correctly displays accented characters (#142)
- Fixed intermittent 401 errors on the RDV booking API for users with expired session tokens (#148)

### Performance
- Optimized dashboard loading time by 40% through query batching and React Server Components (#139)

### Improvements
- Streamlined onboarding flow: reduced from 5 steps to 3 with smart defaults (#136)

### Breaking Changes
- **API**: The `/api/v1/calls` endpoint now requires `agencyId` as a required parameter. Update your integrations accordingly. (#150)
```

### Formatting Rules

- Each entry is a single line: `- **{Scope}**: {Description} (#{PR number})`
- If no scope is provided, omit the bold prefix: `- {Description} (#{PR number})`
- Entries are sorted by PR number (chronological order of merge)
- Breaking changes get their own section with a warning prefix
- Use imperative mood for descriptions ("Add", "Fix", "Optimize", not "Added", "Fixed")
- Rewrite terse commit messages into user-friendly language using Claude (e.g., `fix(export): handle BOM` becomes "Fixed CSV export encoding for French characters")

## Semantic Versioning

Determine the next version number based on the changes included:

| Change Type                    | Version Bump | Example         |
|-------------------------------|-------------|-----------------|
| Only `fix:` commits           | Patch       | 1.2.2 -> 1.2.3 |
| Any `feat:` commit (no breaking) | Minor    | 1.2.3 -> 1.3.0 |
| Any `BREAKING CHANGE` or `!`  | Major       | 1.3.0 -> 2.0.0 |
| Only `perf:` / `refactor:`    | Patch       | 1.2.3 -> 1.2.4 |

```bash
# Create git tag for the new version
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3
```

## Distribution Channels

### In-App Changelog Page
- Route: `/changelog` (publicly accessible)
- Rendered from the `CHANGELOG.md` file or a database table of releases
- Each release entry is a card with version, date, and categorized changes
- "New" badge shown on the navigation item for 7 days after a release

### Email Digest
- Sent to all agency admin users on **major** and **minor** releases (not patch)
- Subject: "ScaleHQ v1.3.0 — New Features Available"
- Body: changelog rendered as HTML email with CTA buttons for new features
- Sent via SendGrid transactional email template
- Unsubscribe link included (respects email preferences in user settings)

### Discord Notification
- Posted in #releases channel on every release
- Format: embed with version, date, and top 3 changes
- Mentions @team for major releases

### GitHub Release
```bash
gh release create v1.2.3 \
  --title "v1.2.3" \
  --notes "$(cat CHANGELOG_LATEST.md)" \
  --target main
```

## Workflow Integration

### Trigger
The changelog generator runs when:
1. A PR is merged to `main` (incremental: add entry to pending changelog)
2. A release is triggered manually or by schedule (compile pending entries into versioned release)

### Automated Release Cadence
- **Patch releases**: weekly on Tuesday at 10:00 UTC (if there are fixes pending)
- **Minor releases**: biweekly or when a significant feature is merged
- **Major releases**: manually triggered by PM/CTO
- If no changes since last release, skip (do not create empty releases)

### CHANGELOG.md Management
- File location: repo root `/CHANGELOG.md`
- New entries prepended to the top (most recent first)
- Keep the last 20 releases in the file; older entries archived to `/docs/changelog-archive.md`

## Edge Cases

- **Non-conventional commit messages**: if a merged PR has no conventional commit prefix, use Claude to classify it based on the PR title and body. If unclassifiable, place it in "Other Changes" section.
- **Reverted PRs**: if a PR is merged and then reverted in the same release window, exclude both the original and the revert from the changelog.
- **Multi-commit PRs**: use the PR title (not individual commits) as the changelog entry if commits are granular implementation steps.
- **Empty release**: if all merged PRs are `chore:` or `ci:`, skip the release. Do not publish an empty changelog.
- **Hotfix releases**: P0 fixes trigger an immediate patch release outside the normal cadence, with a single-entry changelog.
- **Pre-release versions**: for staging/beta features behind feature flags, use pre-release tags like `v1.3.0-beta.1`. These do not generate user-facing changelogs.
