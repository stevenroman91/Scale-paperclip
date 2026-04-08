---
name: auto-bug-triage
description: Analyse de stack trace, identification du fichier/fonction concerne, tentative de reproduction automatique, generation de suggestion de fix
slug: auto-bug-triage
---

# Auto Bug Triage

Automated bug analysis, severity assessment, and fix suggestion for ScaleHQ bug reports.

## Input

Receives a `FeedbackTicket` with `category: "bug"` from the `user-feedback-pipeline`. The ticket includes the user's description, optional screenshot, and metadata (page_url, browser, OS, app_version).

## Analysis Workflow

### Step 1: Parse Error Information

Extract structured error data from the description and/or screenshot:

- **Text parsing**: regex extraction of stack traces, error messages, HTTP status codes, Prisma error codes
- **Screenshot analysis**: if screenshot_url is provided, use Claude vision to OCR error messages, console output, or UI anomalies visible in the image
- **Structured output**:
  ```typescript
  interface ParsedError {
    error_message: string;
    error_code?: string;          // e.g., "P2002" (Prisma), "NEXT_NOT_FOUND"
    stack_frames: Array<{
      file: string;
      line: number;
      column?: number;
      function_name?: string;
    }>;
    http_status?: number;
    affected_component?: string;  // React component or API route
  }
  ```

### Step 2: Search Codebase for Affected Files

Using the parsed error, locate the source:

- **Stack trace available**: directly map file paths from frames (e.g., `app/api/calls/route.ts:45`)
- **Error message only**: grep the repo for the error string to find where it is thrown
- **Component name**: search for the React component file (e.g., error on "CallsTable" -> `components/calls/calls-table.tsx`)
- **API route**: map the page_url to the corresponding route handler (e.g., `/api/enrichment` -> `app/api/enrichment/route.ts`)

Produce a list of `affected_files` with confidence scores.

### Step 3: Check Recent Git History

For each affected file, run:
```bash
git log --oneline --since="7 days ago" -- <file_path>
```

Flag files with recent changes as potential regression sources. If a file was changed in the last 48 hours, boost regression confidence to high.

Cross-reference with recently merged PRs to identify the likely introducing commit.

### Step 4: Determine Severity

| Severity | Criteria                                                              | Examples                                                |
|----------|----------------------------------------------------------------------|---------------------------------------------------------|
| P0       | App completely down or unusable for all users                         | Middleware crash, DB connection failure, auth broken     |
| P1       | Core feature broken for a segment of users                            | CSV export fails, call logging not saving, Stripe webhook error |
| P2       | Feature degraded but workaround exists                                | Slow dashboard load, filter not working but data visible |
| P3       | Cosmetic issue, no functional impact                                  | Misaligned button, wrong color, typo in UI              |

Severity is auto-assigned based on:
- Error type: unhandled exception / crash -> P0-P1, caught error with fallback -> P2-P3
- Affected scope: middleware/layout (all pages) -> P0, single route/component -> P1-P2
- User's plan: Scale plan bug report boosts severity by one level

### Step 5: Estimate Fix Complexity

| Complexity | Description                               | Time Estimate | Examples                                           |
|------------|-------------------------------------------|---------------|----------------------------------------------------|
| Trivial    | Typo, config value, single-line fix       | < 30 min      | Wrong env variable, CSS class typo, copy change    |
| Simple     | One file change, clear cause              | 30 min - 2h   | Missing null check, wrong query filter, broken import |
| Moderate   | Multiple files, requires understanding    | 2h - 8h       | State management bug, API contract mismatch, race condition |
| Complex    | Architectural issue, cross-cutting        | 1-3 days      | Auth flow redesign, data migration needed, third-party API change |

### Step 6: Generate Suggested Fix

For **trivial** and **simple** cases, generate a concrete code diff:

```typescript
// Example suggested fix for a null check bug
// File: app/api/calls/route.ts, Line 45
// Before:
const agencyId = session.user.agencyId;
// After:
const agencyId = session?.user?.agencyId;
if (!agencyId) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

For **moderate** and **complex** cases, provide:
- Root cause analysis (what is wrong and why)
- Suggested approach (high-level steps to fix)
- Files that need changes
- Risks and things to watch out for

## Stack Trace Parsing Details

### Next.js Errors
- Server component errors: extract from `Error: ` prefix, file path relative to project root
- Client component errors: parse minified stack, map to source via `.next/static` source maps if available
- Middleware errors: check `middleware.ts` first, then referenced modules
- `NEXT_NOT_FOUND` / `NEXT_REDIRECT`: check route definitions in `app/` directory

### Prisma Errors
- `P2002` (Unique constraint): extract model name + field, check for missing `findFirst` before `create`
- `P2025` (Record not found): extract model + where clause, check for missing existence check
- `P2003` (Foreign key constraint): extract related models, check cascade rules
- Connection errors (`P1001`, `P1002`): flag as P0, check DATABASE_URL env var and Railway DB status

### API Errors
- `401 Unauthorized`: check NextAuth session handling in the route, verify middleware matcher
- `403 Forbidden`: check role-based access control logic
- `500 Internal Server Error`: parse response body for nested error, check server logs
- `504 Gateway Timeout`: check for long-running queries, missing `await`, or infinite loops

## Reproduction Steps Generation

Based on the user's metadata, generate actionable reproduction instructions:

**For API bugs** — generate a curl command:
```bash
curl -X POST https://app.scalehq.io/api/calls \
  -H "Authorization: Bearer <session_token>" \
  -H "Content-Type: application/json" \
  -d '{"agencyId": "xxx", "filters": {"date": "2026-04-08"}}'
```

**For UI bugs** — generate step-by-step browser instructions:
```
1. Log in as a user on the Growth plan
2. Navigate to /dashboard/calls
3. Click "Export CSV" button in the top-right
4. Observe: error toast appears, no file downloads
5. Expected: CSV file downloads with call records
```

**For environment-specific bugs** — note the specific conditions:
```
Browser: Safari 18.2 (reported), test also on Chrome/Firefox
OS: macOS 15.3
Viewport: 1440x900 (desktop)
User plan: Scale (may have features not on Starter)
```

## Output: Triage Report

```typescript
interface TriageReport {
  ticket_id: string;
  severity: "P0" | "P1" | "P2" | "P3";
  affected_files: Array<{
    path: string;
    confidence: number;         // 0-1
    recent_changes: string[];   // commit SHAs from last 7 days
  }>;
  error_parsed: ParsedError;
  regression_likely: boolean;
  introducing_commit?: string;  // SHA if regression detected
  suggested_fix?: string;       // code diff for trivial/simple
  fix_approach?: string;        // description for moderate/complex
  reproduction_steps: string;
  estimated_effort: "trivial" | "simple" | "moderate" | "complex";
  recommended_assignee: string; // "bug-fixer" or specific engineer
}
```

The triage report is attached to the feedback ticket and sent to the Bug Fixer agent (or engineer for P0/complex issues).

## Edge Cases

- **No stack trace available**: use the page_url + description to infer affected component, mark confidence as low, request more info from user
- **Minified/obfuscated stack**: attempt source map resolution; if unavailable, fall back to component-name search
- **External service error**: if the bug is in Stripe/SendGrid/Twilio, flag as `affected_service: "external"`, include service status page link, do not attempt code fix
- **User error vs. bug**: if analysis suggests the user is using the feature incorrectly (not a code bug), reclassify ticket as "question" and route to support
- **Flaky/intermittent bugs**: if reproduction fails, mark as "intermittent", add monitoring hook to capture next occurrence with full logging
