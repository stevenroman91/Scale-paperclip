---
name: widget-builder
description: Creation de widgets embarquables — widget chatbot, widget feedback, widget KPI pour les clients des agences
slug: widget-builder
---

# Widget Builder

Embeddable widget creation for ScaleHQ — chatbot, feedback, and KPI widgets that clients can embed on their websites.

## Widget Types

### Chatbot Widget
- **Purpose**: floating chat button that opens a conversational interface, powered by the `conversational-ai` skill
- **Target**: client websites of SDR agencies using ScaleHQ
- **Appearance**: circular button (56px) in bottom-right corner with chat icon, opens a 400x600px chat window
- **Features**: greeting message, real-time messaging, typing indicators, file attachment, conversation history within session

### Feedback Widget
- **Purpose**: "Give Feedback" button that opens a feedback form
- **Target**: embedded within the ScaleHQ dashboard for internal user feedback
- **Appearance**: pill-shaped button on the right edge, opens a slide-out panel
- **Features**: category selector (Bug / Feature / Question), free text input, screenshot capture via html2canvas, automatic metadata capture (page URL, browser, OS)

### KPI Widget
- **Purpose**: real-time dashboard embed showing agency performance metrics
- **Target**: agency client portals or executive dashboards
- **Appearance**: configurable card or table layout, responsive
- **Features**: calls count, RDV count, conversion rate, date range selector, auto-refresh every 60 seconds

## Embed Method

### JavaScript Snippet

Clients embed a single script tag on their website:

```html
<!-- Chatbot Widget -->
<script
  src="https://app.scalehq.io/widgets/v1/loader.js"
  data-widget="chatbot"
  data-api-key="wk_live_abc123def456"
  data-color="#2563EB"
  data-position="bottom-right"
  data-language="fr"
  data-welcome="Bonjour! Comment puis-je vous aider?"
></script>

<!-- Feedback Widget -->
<script
  src="https://app.scalehq.io/widgets/v1/loader.js"
  data-widget="feedback"
  data-api-key="wk_live_abc123def456"
></script>

<!-- KPI Widget -->
<script
  src="https://app.scalehq.io/widgets/v1/loader.js"
  data-widget="kpi"
  data-api-key="wk_live_abc123def456"
  data-metrics="calls,rdv,conversion"
  data-period="last_30_days"
></script>
```

### Alternative: iframe Embed (for KPI widget)

For simpler integration without JavaScript:
```html
<iframe
  src="https://app.scalehq.io/widgets/embed/kpi?key=wk_live_abc123def456&metrics=calls,rdv&period=last_30_days"
  width="100%"
  height="400"
  frameborder="0"
  style="border: 1px solid #e2e8f0; border-radius: 8px;"
></iframe>
```

## Widget SDK Architecture

### Loader Script (`loader.js`)

The loader is a minimal script (<5KB gzipped) that:

1. Reads `data-*` attributes from the script tag
2. Creates an iframe pointing to the widget app URL
3. Injects the iframe into the host page DOM
4. Sets up a `postMessage` communication channel between the host page and the iframe
5. Handles widget open/close state, position, and z-index

```typescript
// Simplified loader logic
(function() {
  const script = document.currentScript;
  const config = {
    widget: script.getAttribute("data-widget"),
    apiKey: script.getAttribute("data-api-key"),
    color: script.getAttribute("data-color") || "#2563EB",
    position: script.getAttribute("data-position") || "bottom-right",
    language: script.getAttribute("data-language") || "fr",
    welcome: script.getAttribute("data-welcome") || "",
  };

  // Create iframe
  const iframe = document.createElement("iframe");
  iframe.src = `https://app.scalehq.io/widgets/v1/${config.widget}?key=${config.apiKey}`;
  iframe.style.cssText = `
    position: fixed; ${config.position === "bottom-right" ? "right: 16px; bottom: 16px;" : "left: 16px; bottom: 16px;"}
    width: 60px; height: 60px; border: none; z-index: 999999;
    border-radius: 50%; overflow: hidden; transition: all 0.3s;
  `;
  iframe.allow = "clipboard-write";
  document.body.appendChild(iframe);

  // Listen for messages from widget iframe
  window.addEventListener("message", (event) => {
    if (event.origin !== "https://app.scalehq.io") return;
    if (event.data.type === "widget:open") {
      iframe.style.width = "400px";
      iframe.style.height = "600px";
      iframe.style.borderRadius = "12px";
    }
    if (event.data.type === "widget:close") {
      iframe.style.width = "60px";
      iframe.style.height = "60px";
      iframe.style.borderRadius = "50%";
    }
    if (event.data.type === "widget:resize") {
      iframe.style.height = event.data.height + "px";
    }
  });
})();
```

### Widget App (Inside iframe)

Each widget type is a standalone React mini-app served from ScaleHQ:

- **Route**: `app/widgets/v1/[type]/page.tsx` (Next.js page)
- **Styling**: Tailwind CSS scoped to the iframe (no style leaking to host page)
- **State**: React state within the iframe, persisted to localStorage with widget key prefix
- **API calls**: authenticated via the widget API key, fetched from ScaleHQ API endpoints

```
app/
  widgets/
    v1/
      chatbot/
        page.tsx         # Chat widget React app
        components/
          ChatWindow.tsx
          MessageBubble.tsx
          InputBar.tsx
      feedback/
        page.tsx         # Feedback form React app
        components/
          FeedbackForm.tsx
          ScreenshotCapture.tsx
      kpi/
        page.tsx         # KPI dashboard React app
        components/
          MetricCard.tsx
          DateRangePicker.tsx
      loader.js          # Served as static file
```

### Communication Protocol (postMessage)

Messages between the host page and the widget iframe:

| Direction        | Message Type       | Payload                                  |
|------------------|--------------------|------------------------------------------|
| Widget -> Host   | `widget:open`      | `{}`                                     |
| Widget -> Host   | `widget:close`     | `{}`                                     |
| Widget -> Host   | `widget:resize`    | `{ height: number }`                     |
| Widget -> Host   | `widget:feedback`  | `{ category, description, metadata }`    |
| Widget -> Host   | `widget:event`     | `{ name, data }` (analytics events)      |
| Host -> Widget   | `widget:config`    | `{ color, language, welcome, ... }`      |
| Host -> Widget   | `widget:show`      | `{}` (programmatically open)             |
| Host -> Widget   | `widget:hide`      | `{}` (programmatically close)            |

## Security

### Widget API Keys

```typescript
interface WidgetApiKey {
  id: string;
  key: string;                     // "wk_live_" prefix for production, "wk_test_" for sandbox
  agency_id: string;
  widget_type: "chatbot" | "feedback" | "kpi";
  permissions: "read_only";        // widgets can only read data, never write (except feedback submissions)
  allowed_domains: string[];       // CORS whitelist, e.g., ["*.client-agency.fr", "localhost:*"]
  rate_limit: number;              // requests per minute per key (default: 60)
  active: boolean;
  created_at: Date;
  last_used_at: Date;
}
```

Key generation: `wk_live_` + 32 random alphanumeric characters, stored hashed in database (bcrypt), displayed once on creation.

### CORS Configuration

```typescript
// middleware.ts or app/api/widgets/[...route]/route.ts
const allowedOrigins = await getWidgetAllowedDomains(apiKey);

if (!allowedOrigins.some(origin => matchDomain(requestOrigin, origin))) {
  return new Response("Forbidden", { status: 403 });
}

headers.set("Access-Control-Allow-Origin", requestOrigin);
headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
headers.set("Access-Control-Allow-Headers", "Content-Type, X-Widget-Key");
```

### Content Security Policy

The widget iframe sets CSP headers to prevent injection:
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  connect-src https://app.scalehq.io/api/;
  img-src 'self' data: https:;
  frame-ancestors *;
```

### Data Scoping

Widget API keys are scoped:
- **Chatbot key**: can access conversation API, knowledge base search API
- **Feedback key**: can submit feedback (POST only), can attach screenshots
- **KPI key**: can read aggregate metrics for the specific agency (no PII, no individual call data)

Keys cannot access: user accounts, billing data, admin endpoints, other agencies' data.

## Customization Options

| Option          | Data Attribute       | Values                                 | Default          |
|-----------------|---------------------|----------------------------------------|------------------|
| Primary Color   | `data-color`         | Any hex color                          | `#2563EB`        |
| Logo            | `data-logo`          | URL to logo image                      | ScaleHQ logo     |
| Position        | `data-position`      | `bottom-right`, `bottom-left`          | `bottom-right`   |
| Language        | `data-language`      | `fr`, `en`                             | `fr`             |
| Welcome Message | `data-welcome`       | Free text string                       | (default per lang)|
| Theme           | `data-theme`         | `light`, `dark`, `auto`               | `auto`           |
| Auto-open       | `data-auto-open`     | `true`, `false`                        | `false`          |
| Open Delay      | `data-open-delay`    | Milliseconds                           | `5000`           |
| Metrics (KPI)   | `data-metrics`       | Comma-separated: `calls,rdv,conversion`| `calls,rdv`      |
| Period (KPI)    | `data-period`        | `today`, `last_7_days`, `last_30_days` | `last_30_days`   |

### JavaScript API for Programmatic Control

```javascript
// The loader exposes a global API
window.ScaleHQWidget.open();      // Open the widget
window.ScaleHQWidget.close();     // Close the widget
window.ScaleHQWidget.toggle();    // Toggle open/close
window.ScaleHQWidget.setUser({    // Identify the user (for chat context)
  email: "user@example.com",
  name: "Marie Dupont",
  plan: "growth",
});
window.ScaleHQWidget.on("message", (data) => {
  // Listen to widget events
  console.log("New message:", data);
});
```

## Analytics

Track widget engagement to measure ROI and optimize placement:

```typescript
interface WidgetEvent {
  id: string;
  widget_key: string;
  agency_id: string;
  widget_type: "chatbot" | "feedback" | "kpi";
  event: "impression" | "open" | "interaction" | "conversion" | "close";
  page_url: string;
  visitor_id: string;            // anonymous, cookie-based
  timestamp: Date;
  metadata?: Record<string, string>;
}
```

### Event Definitions

| Event        | Triggered When                                              |
|--------------|-------------------------------------------------------------|
| `impression` | Widget button is visible in viewport (fires once per page)  |
| `open`       | User clicks the widget button to open it                    |
| `interaction`| User sends a message (chatbot), fills a field (feedback), changes filter (KPI) |
| `conversion` | Feedback submitted, chat resolved, KPI exported             |
| `close`      | User closes the widget or navigates away                    |

### Metrics Dashboard (for agency admins)

Available at `/dashboard/widgets/analytics`:
- Widget impressions per day (line chart)
- Open rate: opens / impressions x 100
- Interaction rate: interactions / opens x 100
- Conversion rate: conversions / opens x 100
- Top pages by widget engagement
- Visitor breakdown by device type

## Edge Cases

- **Multiple widgets on same page**: each script tag creates an independent widget instance. Ensure z-index ordering (chatbot on top of feedback widget).
- **Single Page Apps (SPA)**: the loader detects route changes via `popstate` / `pushstate` events and updates the widget's page context without reloading.
- **Ad blockers**: some ad blockers may block third-party scripts. Provide a fallback: agencies can self-host the loader.js on their domain and point it to ScaleHQ API.
- **Mobile browsers**: on screens < 640px, the chat widget opens full-screen (100vw x 100vh) instead of the 400x600 overlay. The close button is more prominent.
- **Slow connections**: the loader shows the widget button immediately (with a spinner) while the iframe content loads. Interaction is disabled until the iframe is ready.
- **CSP-strict host pages**: if the host page has a strict Content Security Policy that blocks iframes, the widget cannot load. Provide documentation for the required CSP directives: `frame-src https://app.scalehq.io`.
- **Cookie consent**: widget does not set cookies until the user interacts with it. The anonymous `visitor_id` is stored in memory only until first interaction, then in localStorage (which is not covered by cookie consent in most jurisdictions, but agencies should verify).
- **Widget API key rotation**: when rotating keys, support a grace period where both old and new keys work (24 hours). After grace period, old key returns 401.
