---
name: github-pr-automation
description: Workflow GitHub PR — creation de branche, commit, ouverture de PR, lien vers le ticket de feedback, demande de review
slug: github-pr-automation
---

# GitHub PR Automation

End-to-end Pull Request workflow automation for the `stevenroman91/ScaleHQ` repository.

## Branch Naming Convention

| Type       | Pattern                                    | Example                                  |
|------------|--------------------------------------------|------------------------------------------|
| Bug fix    | `fix/{issue-id}-{short-description}`       | `fix/FB-142-csv-export-encoding`         |
| Feature    | `feat/{issue-id}-{short-description}`      | `feat/FB-98-call-scoring-dashboard`      |
| Refactor   | `refactor/{short-description}`             | `refactor/optimize-dashboard-queries`    |
| Docs       | `docs/{short-description}`                 | `docs/update-api-reference`              |
| Hotfix     | `hotfix/{issue-id}-{short-description}`    | `hotfix/FB-200-stripe-webhook-crash`     |

Rules:
- `short-description` is kebab-case, max 50 chars
- Always branch from `main` (pull latest first)
- For hotfixes (P0 bugs), branch from the latest release tag if `main` has unreleased changes

## PR Creation Workflow

### Step 1: Create Branch
```bash
git checkout main && git pull origin main
git checkout -b fix/FB-142-csv-export-encoding
```

### Step 2: Make Changes
Commit with conventional commit messages:
```bash
git commit -m "fix(export): handle UTF-8 BOM for French character CSV export

Resolves FB-142. The CSV export was missing the UTF-8 BOM marker,
causing Excel to misinterpret accented characters (e, a, u, etc.).

Added BOM prefix to the response stream and set correct Content-Type
charset header."
```

Commit message format:
```
type(scope): short description (imperative mood, <72 chars)

Optional body: what changed and why, reference ticket ID.
Wrap at 72 chars per line.
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `style`, `ci`
Scopes: feature area like `export`, `auth`, `dashboard`, `calls`, `billing`, `enrichment`, `rdv`, `elearning`

### Step 3: Push Branch
```bash
git push -u origin fix/FB-142-csv-export-encoding
```

### Step 4: Create PR

PR template:
```markdown
## What
Brief description of the change.

## Why
Link to feedback ticket: FB-142
User impact: French-speaking agencies could not open exported CSV files correctly in Excel.

## How
- Added UTF-8 BOM (`\xEF\xBB\xBF`) prefix to CSV response in `app/api/export/csv/route.ts`
- Set `Content-Type: text/csv; charset=utf-8` header
- Added unit test for BOM presence in exported content

## Testing
- [ ] Exported CSV with French characters opens correctly in Excel (Windows)
- [ ] Exported CSV opens correctly in Google Sheets
- [ ] Existing exports without special characters still work
- [ ] Unit test passes: `npm test -- export.test.ts`

## Screenshots
(If UI changes, attach before/after screenshots)
```

### Step 5: Request Review
- Default reviewer: CTO (Steven)
- For UI changes: also request review from Frontend lead (if applicable)
- Add labels: `bug`, `feature`, `refactor`, `priority:P0-P3`, `plan:affected`

### Step 6: Link to Feedback Ticket
- Update the feedback ticket status from `triaged` to `in_progress`
- Add PR URL to the ticket metadata
- If GitHub Issue exists, reference it in PR body with `Closes #123`

## Automated PR Review Checklist

The following checks run automatically (via GitHub Actions or pre-merge verification):

### TypeScript Type Check
```bash
npx tsc --noEmit
```
Must pass with zero errors. No `@ts-ignore` or `any` type additions without justification comment.

### ESLint
```bash
npx eslint . --ext .ts,.tsx
```
Zero errors required. Warnings are acceptable but should be addressed.

### Tests
```bash
npm test
```
All existing tests must pass. New code should include tests:
- Bug fixes: add a regression test that would have caught the bug
- Features: add unit tests for business logic, integration test for API routes

### Build
```bash
npm run build
```
Must complete successfully. This catches:
- Import errors
- Missing environment variables referenced at build time
- Next.js page/layout structure issues

### Code Quality Checks
- [ ] No `console.log` or `debugger` statements left in code (except in designated logger utility)
- [ ] No hardcoded secrets, API keys, or credentials (check for strings starting with `sk_`, `pk_`, `secret_`)
- [ ] No hardcoded URLs (use environment variables for external service URLs)
- [ ] Prisma migrations included if `schema.prisma` was modified (`npx prisma migrate dev --name <description>`)
- [ ] New API routes have authentication check (`auth()` from NextAuth)
- [ ] New pages have appropriate metadata (`generateMetadata` function)

### Bundle Size Check
- If JS bundle grows by >10KB, add justification in PR description
- Check with `npx next build` and compare `.next/analyze` output if configured

## Post-Merge Actions

After PR is merged to `main`:

1. **Update feedback ticket**: set status to `resolved`, add `resolution_notes` with PR link and summary
2. **Trigger changelog**: the `changelog-generator` skill picks up the merged PR for the next release notes
3. **Notify reporter**: if the original feedback submitter opted into notifications, send email: "Your reported issue (FB-142) has been fixed and will be available in the next release."
4. **Deploy**: Railway auto-deploys from `main` branch. Verify deployment via `uptime-monitoring` health check.
5. **Close GitHub Issue**: if linked, auto-close with "Fixed in PR #XX"

## Hotfix Workflow (P0 Bugs)

For critical production issues:

1. Branch from `main` (or latest release tag)
2. Minimal fix only — no refactoring, no feature additions
3. PR title prefixed with `HOTFIX:` for visibility
4. CTO review can be async — if CTO is unavailable for >30 minutes, a second engineer can approve
5. Merge immediately after checks pass
6. Monitor deployment closely via `uptime-monitoring` for 30 minutes post-deploy
7. Follow up with a proper fix PR if the hotfix was a band-aid

## PR Metrics Tracked

- Time from PR creation to first review
- Time from PR creation to merge
- Number of review rounds (changes requested)
- CI pass rate on first push
- Average PR size (lines changed)

These metrics feed into the weekly engineering report for the CTO.

## Edge Cases

- **Conflicting PRs**: if two PRs modify the same files, the second to merge must resolve conflicts. The automation flags this and notifies both authors.
- **Failed CI after merge**: if the `main` branch build breaks after merge, immediately alert CTO and the PR author, revert if not fixable within 1 hour.
- **Large PRs (>500 lines)**: flag for split recommendation. Large PRs get slower reviews and higher defect rates.
- **Draft PRs**: support creating draft PRs for work-in-progress, converted to ready-for-review when all checks pass.
- **Dependent PRs**: if PR B depends on PR A, note the dependency in the description and stack them (B targets A's branch, rebased after A merges).
