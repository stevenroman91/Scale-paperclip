---
name: uptime-monitoring
description: Health check endpoints, alertes de downtime, auto-restart si necessaire, logging des incidents
slug: uptime-monitoring
---

# Uptime Monitoring

Health check, incident detection, alerting, and auto-recovery for ScaleHQ deployed on Railway.

## Health Check Endpoint

The application exposes a health check at `GET /api/health`:

```typescript
// app/api/health/route.ts
export async function GET() {
  const start = Date.now();
  try {
    // Test database connectivity
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - start;

    // Test Stripe API reachability
    let stripeStatus = "ok";
    try {
      await stripe.balance.retrieve();
    } catch {
      stripeStatus = "degraded";
    }

    return NextResponse.json({
      status: "ok",
      db: "connected",
      db_latency_ms: dbLatency,
      stripe: stripeStatus,
      version: process.env.APP_VERSION || "unknown",
      uptime_seconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", db: "disconnected", error: error.message },
      { status: 503 }
    );
  }
}
```

Expected healthy response: HTTP 200 with `status: "ok"` within 5 seconds.

## Monitoring Schedule

Executed as a Paperclip routine every 5 minutes (cron: `*/5 * * * *`).

### Check Types

| Check                  | Method                                           | Healthy Condition              | Timeout |
|------------------------|--------------------------------------------------|-------------------------------|---------|
| HTTP Health            | `GET /api/health`                                | 200 + `status: "ok"` in body  | 5s      |
| Database Connectivity  | Implicit in health check (`SELECT 1`)            | `db: "connected"`             | 3s      |
| Stripe API             | Implicit in health check (`balance.retrieve()`)  | `stripe: "ok"`                | 5s      |
| Email Service          | `GET /api/health/email` (SendGrid ping)          | 200 response                  | 5s      |
| SSL Certificate        | Check cert expiry via TLS handshake              | Expiry > 14 days              | 10s     |
| Response Time          | Measure health endpoint latency                  | < 2000ms                      | -       |

### SSL Certificate Monitoring

Check the SSL certificate for `app.scalehq.io`:
- Alert at 14 days before expiry (informational, Discord only)
- Alert at 7 days before expiry (warning, Discord + email to DevOps)
- Alert at 1 day before expiry (critical, all channels + CEO)

Railway handles SSL auto-renewal via Let's Encrypt, but monitoring catches renewal failures.

## Incident Data Model

```typescript
interface Incident {
  id: string;                    // cuid2
  type: "downtime" | "degraded" | "ssl" | "external_service";
  started_at: Date;
  resolved_at?: Date;
  duration_minutes?: number;
  affected_service: "app" | "db" | "stripe" | "email";
  consecutive_failures: number;
  alert_sent_at?: Date;
  alert_channels: Array<"discord" | "email" | "sms">;
  auto_recovery_attempted: boolean;
  auto_recovery_succeeded?: boolean;
  resolution: string;
  root_cause: string;
  health_check_log: Array<{
    timestamp: Date;
    status_code: number;
    response_time_ms: number;
    response_body?: string;
  }>;
}
```

Store in PostgreSQL via Prisma. Retain incident records indefinitely for audit trail.

## Alert Escalation Protocol

```
Check fails (1st failure)
  |-> Retry in 30 seconds
  |
Check fails (2nd consecutive failure = ~1 minute)
  |-> Create Incident record (type: "downtime" or "degraded")
  |-> Alert DevOps via Discord webhook
  |-> Post in #incidents channel: "ScaleHQ health check failing. Service: {service}. Error: {message}"
  |
Check fails (5th consecutive = ~25 minutes)
  |-> Alert CEO via Discord DM + email
  |-> Attempt auto-recovery: Railway redeploy
  |-> Run: `railway up --service scalehq-app`
  |-> Wait 2 minutes, re-check health
  |-> If recovered: update Incident with auto_recovery_succeeded: true
  |
Check fails (10th consecutive = ~50 minutes)
  |-> Page Steven (CEO): email + SMS via Twilio
  |-> Subject: "CRITICAL: ScaleHQ has been down for 50+ minutes"
  |-> Include: incident timeline, last health check response, Railway logs excerpt
  |
Check succeeds (after failures)
  |-> Update Incident: resolved_at = now, duration_minutes = diff
  |-> Post recovery message in Discord: "ScaleHQ recovered. Downtime: {duration}. Root cause: {TBD}"
  |-> Send recovery email to all previously alerted parties
```

### Degraded Service Handling

If the health check returns 200 but with `stripe: "degraded"` or `db_latency_ms > 1000`:
- Log as `type: "degraded"` incident
- Alert DevOps via Discord (lower urgency)
- Do NOT attempt redeploy (app is running, external service is the issue)
- Check external service status pages (status.stripe.com) and include in alert

## Railway Integration

### Auto-Redeploy
```bash
# Trigger redeploy via Railway CLI
railway up --service scalehq-app --environment production

# Alternative: trigger via Railway API
curl -X POST "https://backboard.railway.app/graphql/v2" \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { deploymentRedeploy(id: \"$DEPLOYMENT_ID\") { id status } }"}'
```

### Log Inspection
When investigating an incident, pull recent Railway logs:
```bash
railway logs --service scalehq-app --lines 200
```

Look for:
- `SIGTERM` / `SIGKILL` signals (OOM or Railway restart)
- Prisma connection pool exhaustion (`Too many connections`)
- Unhandled promise rejections
- Memory usage spikes (`process.memoryUsage()`)

## Monthly Uptime Report

Generated on the 1st of each month, covering the previous month:

```markdown
## ScaleHQ Uptime Report — March 2026

### Summary
- **Uptime**: 99.94% (target: 99.9%)
- **Total downtime**: 26 minutes
- **Incidents**: 3 (1 downtime, 2 degraded)
- **MTTR**: 8.7 minutes (mean time to resolve)

### Incidents
| Date       | Type     | Duration | Service | Root Cause                    |
|------------|----------|----------|---------|-------------------------------|
| 2026-03-05 | downtime | 18 min   | app     | Railway deployment stuck      |
| 2026-03-12 | degraded | 5 min    | stripe  | Stripe API intermittent 503   |
| 2026-03-22 | degraded | 3 min    | db      | Connection pool spike (30+ concurrent) |

### Recommendations
- Increase Prisma connection pool from 10 to 20
- Add Stripe webhook retry logic for transient failures
- Set up Railway deployment health check with rollback
```

Distribution: posted in Discord #ops channel, emailed to CEO and CTO.

## Health Check Response Time Tracking

Beyond pass/fail, track response time trends:
- Store each check's `response_time_ms` in a time-series table
- Alert if p95 response time exceeds 2000ms over a 1-hour window (indicates performance degradation before full outage)
- Weekly performance trend chart in Discord

## Edge Cases

- **False positive**: a single failed check due to network blip should not trigger full incident. The 30-second retry prevents this.
- **Railway platform outage**: if Railway itself is down, the redeploy command will also fail. Detect this (Railway API returns 503) and include in the alert: "Railway platform may be experiencing issues — check status.railway.app"
- **Database migration in progress**: during Prisma migrations, the DB may be briefly unavailable. Suppress alerts during a known deployment window (configurable via `MAINTENANCE_WINDOW` env var).
- **Health endpoint itself is broken**: if a code change breaks `/api/health`, the monitoring will report downtime even though the app may be functional. Mitigate by keeping the health route minimal and never importing business logic.
- **Clock drift**: use UTC timestamps for all incident records. Paperclip routine execution may drift slightly; use server-side timestamps, not scheduled time.
