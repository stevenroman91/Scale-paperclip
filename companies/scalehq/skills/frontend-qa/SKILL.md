---
name: frontend-qa
description: Tests visuels automatises — comparaison de screenshots, audit d'accessibilite, scoring de performance Lighthouse
slug: frontend-qa
---

# Frontend QA

Automated frontend quality assurance covering visual regression, accessibility, performance, and cross-browser testing for ScaleHQ.

## Visual Regression Testing

### Tool: Playwright Screenshot Comparison

```typescript
// tests/visual/dashboard.spec.ts
import { test, expect } from "@playwright/test";

test("dashboard page visual regression", async ({ page }) => {
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");
  // Wait for skeleton loaders to resolve
  await page.waitForSelector("[data-testid='dashboard-content']");
  await expect(page).toHaveScreenshot("dashboard.png", {
    maxDiffPixelRatio: 0.005, // 0.5% threshold
    fullPage: true,
  });
});
```

### Pages to Capture

| Page          | Route                    | Auth Required | Special Setup                              |
|---------------|--------------------------|---------------|--------------------------------------------|
| Dashboard     | `/dashboard`             | Yes           | Wait for chart rendering (2s)              |
| Calls List    | `/dashboard/calls`       | Yes           | Seed with 10+ test calls                   |
| Call Detail   | `/dashboard/calls/[id]`  | Yes           | Use a fixed test call ID                   |
| RDV List      | `/dashboard/rdv`         | Yes           | Seed with test appointments                |
| Enrichment    | `/dashboard/enrichment`  | Yes           | Show both empty and populated states       |
| E-Learning    | `/dashboard/elearning`   | Yes           | At least 1 module visible                  |
| Settings      | `/dashboard/settings`    | Yes           | Capture each settings tab                  |
| Login         | `/auth/signin`           | No            | Default state                              |
| Signup        | `/auth/signup`           | No            | Default state                              |
| Landing       | `/`                      | No            | Full-page screenshot                       |

### Baseline Management

- Baseline screenshots stored in `tests/visual/__screenshots__/` directory
- Updated via: `npx playwright test --update-snapshots`
- Review process: when a screenshot diff is detected, the CI job uploads the diff image as an artifact for human review
- Baselines committed to the repo (tracked in git)

### Threshold Configuration

- **Pixel difference threshold**: 0.5% (`maxDiffPixelRatio: 0.005`)
- **Acceptable differences**: anti-aliasing variations, subpixel rendering
- **Auto-ignore**: dynamic content areas masked with `mask` option:
  ```typescript
  await expect(page).toHaveScreenshot("dashboard.png", {
    maxDiffPixelRatio: 0.005,
    mask: [
      page.locator("[data-testid='current-time']"),
      page.locator("[data-testid='live-counter']"),
    ],
  });
  ```

## Accessibility Audit

### Tool: axe-core via @axe-core/playwright

```typescript
// tests/a11y/dashboard.spec.ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("dashboard page accessibility", async ({ page }) => {
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .exclude("[data-testid='third-party-widget']") // exclude embedded third-party content
    .analyze();

  expect(results.violations).toEqual([]);
});
```

### Rules Checked (WCAG 2.1 AA)

| Category          | Common Violations                                        | Severity |
|-------------------|---------------------------------------------------------|----------|
| Color Contrast    | Text too light on background, insufficient link contrast | Serious  |
| Form Labels       | Input without associated label or aria-label             | Critical |
| Alt Text          | Images without alt, decorative images not hidden         | Serious  |
| Heading Hierarchy | Skipped heading levels (h1 -> h3), multiple h1s         | Moderate |
| Focus Order       | Focus not following visual order, focus trapped           | Serious  |
| ARIA              | Invalid aria-* attributes, missing required ARIA props   | Critical |
| Keyboard          | Interactive elements not keyboard accessible             | Critical |
| Link Text         | Links with vague text ("click here", "read more")       | Moderate |

### Reporting Format

```typescript
interface A11yReport {
  page: string;
  total_violations: number;
  by_severity: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  violations: Array<{
    id: string;           // axe rule ID, e.g., "color-contrast"
    impact: string;       // critical, serious, moderate, minor
    description: string;
    help_url: string;     // link to axe rule documentation
    nodes: Array<{
      html: string;       // the offending element HTML
      target: string;     // CSS selector
      failure_summary: string;
    }>;
  }>;
}
```

CI pipeline: zero critical or serious violations required to pass. Moderate and minor are reported as warnings.

## Performance Audit

### Tool: Lighthouse CI

```bash
# Install
npm install -D @lhci/cli

# Run Lighthouse CI
npx lhci autorun --config=lighthouserc.json
```

### Configuration (`lighthouserc.json`)

```json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/dashboard",
        "http://localhost:3000/dashboard/calls",
        "http://localhost:3000/dashboard/settings"
      ],
      "numberOfRuns": 3,
      "settings": {
        "preset": "desktop"
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.85 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["warn", { "minScore": 0.90 }],
        "categories:seo": ["warn", { "minScore": 0.90 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

### Core Web Vitals Targets

| Metric                        | Target     | Warning    | Failure    |
|-------------------------------|------------|------------|------------|
| LCP (Largest Contentful Paint)| < 2.5s     | 2.5s-4.0s  | > 4.0s     |
| FID (First Input Delay)       | < 100ms    | 100-300ms   | > 300ms    |
| CLS (Cumulative Layout Shift) | < 0.1      | 0.1-0.25    | > 0.25     |
| TTI (Time to Interactive)     | < 3.5s     | 3.5s-7.3s  | > 7.3s     |
| FCP (First Contentful Paint)  | < 1.8s     | 1.8s-3.0s  | > 3.0s     |

### Bundle Size Budgets

| Asset                 | Budget  | Check Command                                           |
|-----------------------|---------|---------------------------------------------------------|
| Total JS (compressed) | < 250KB | `npx next build && du -sh .next/static/chunks/`        |
| Total CSS             | < 50KB  | Check Tailwind output size                               |
| Individual chunk      | < 100KB | Webpack Bundle Analyzer                                  |
| Images                | WebP    | All images served as WebP with `next/image`              |
| Font files            | < 100KB | Inter variable font subset                               |

### Run Schedule

- **On each PR**: Lighthouse CI runs on the preview deployment (3 runs, median score)
- **Weekly full audit**: Saturday 06:00 UTC, all pages, desktop + mobile presets, results posted to Discord #qa

## Cross-Browser Testing

### Browser Matrix

| Browser        | Engine   | Playwright Alias | Priority |
|----------------|----------|------------------|----------|
| Chrome latest  | Chromium | `chromium`       | Primary  |
| Firefox latest | Gecko    | `firefox`        | Primary  |
| Safari latest  | WebKit   | `webkit`         | Primary  |
| Edge latest    | Chromium | (use chromium)   | Secondary (same engine) |

### Viewport Sizes

| Name     | Width  | Height | Represents                     |
|----------|--------|--------|--------------------------------|
| Mobile   | 375px  | 812px  | iPhone 13/14 (portrait)        |
| Tablet   | 768px  | 1024px | iPad (portrait)                |
| Desktop  | 1440px | 900px  | Standard desktop monitor       |

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: 2,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["html", { open: "never" }], ["json", { outputFile: "test-results.json" }]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox-desktop", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit-desktop", use: { ...devices["Desktop Safari"] } },
    { name: "chromium-mobile", use: { ...devices["iPhone 14"] } },
    { name: "chromium-tablet", use: { ...devices["iPad (gen 7)"] } },
    { name: "webkit-mobile", use: { ...devices["iPhone 14"], browserName: "webkit" } },
  ],
  webServer: {
    command: "npm run dev",
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

## Test Script Templates

### Authentication Helper

```typescript
// tests/helpers/auth.ts
import { Page } from "@playwright/test";

export async function loginAsTestUser(page: Page) {
  await page.goto("/auth/signin");
  await page.fill("[data-testid='email-input']", "test@scalehq.io");
  await page.fill("[data-testid='password-input']", process.env.TEST_USER_PASSWORD!);
  await page.click("[data-testid='signin-button']");
  await page.waitForURL("/dashboard");
}

// Or use stored auth state for faster tests:
// playwright.config.ts -> globalSetup that saves auth state to storageState
```

### Functional Test Template

```typescript
// tests/functional/calls-export.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "../helpers/auth";

test.describe("Calls Export", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto("/dashboard/calls");
  });

  test("exports CSV file with correct encoding", async ({ page }) => {
    const downloadPromise = page.waitForEvent("download");
    await page.click("[data-testid='export-csv-button']");
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/calls.*\.csv$/);
    const content = await download.path();
    // Verify UTF-8 BOM and content
  });

  test("shows empty state when no calls match filters", async ({ page }) => {
    await page.selectOption("[data-testid='status-filter']", "cancelled");
    await expect(page.locator("[data-testid='empty-state']")).toBeVisible();
    await expect(page.locator("[data-testid='empty-state']")).toContainText("No calls found");
  });
});
```

## CI Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/frontend-qa.yml
name: Frontend QA
on:
  pull_request:
    branches: [main]
  schedule:
    - cron: "0 6 * * 6" # Weekly Saturday 06:00 UTC

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20" }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Edge Cases

- **Flaky tests**: Playwright `retries: 2` handles transient failures. If a test is flaky 3+ times in a week, investigate root cause (animation timing, network race conditions).
- **Dynamic content**: mask timestamps, live counters, and user-specific data in visual comparisons. Use `data-testid` attributes to identify dynamic regions.
- **Third-party scripts**: Intercom/Crisp widgets may inject DOM elements that cause visual diffs. Exclude via CSS selector mask or block the script in test environment.
- **Font loading**: ensure fonts are loaded before screenshot capture (`await page.waitForFunction(() => document.fonts.ready)`).
- **Dark mode**: run visual regression tests in both light and dark mode. Duplicate screenshot baselines with `-dark` suffix.
- **Slow CI**: if tests exceed 10 minutes, shard across parallel workers (`npx playwright test --shard=1/4`).
