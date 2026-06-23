# NovaSaaS Incident Response Runbook

## Alert Meaning

### Alert Name

HighErrorRate

### Severity

Critical

### Condition

The alert fires when the service error rate exceeds 2% over a one-minute window.

PromQL Expression:

```promql
(
  sum(rate(http_errors_total[1m]))
  /
  sum(rate(http_requests_total[1m]))
) * 100 > 2
```

### Impact

This indicates that customer requests are failing at an abnormal rate and users may be experiencing service degradation or outages.

---

# Failure Mode 1: Database Connection Pool Exhaustion

## Symptoms

* Increased request latency
* Slow API responses
* Database connection timeout errors
* Spike in 5xx responses

## How to Diagnose

1. Open Grafana.
2. Check the P95 Response Time panel.
3. Review application logs for database timeout errors.
4. Check active database connections.
5. Verify connection pool utilization.

## Mitigation

* Restart affected service instances.
* Increase connection pool size if appropriate.
* Reduce long-running database queries.

---

# Failure Mode 2: External API Timeouts

## Symptoms

* Specific routes returning errors
* Timeout exceptions in logs
* Increased error rate
* Intermittent failures

## How to Diagnose

1. Review Winston logs.
2. Identify affected endpoints.
3. Look for timeout messages.
4. Verify third-party service status.
5. Compare request latency before and after the issue.

## Mitigation

* Enable retries.
* Use cached responses where possible.
* Temporarily disable non-critical integrations.

---

# Failure Mode 3: Memory Leak

## Symptoms

* Gradually increasing response times
* Increasing container memory usage
* Frequent garbage collection
* Service restarts or crashes

## How to Diagnose

1. Review Grafana latency trends.
2. Monitor memory consumption.
3. Inspect application logs for memory-related errors.
4. Compare performance over time.

## Mitigation

* Restart the affected service.
* Capture heap snapshots.
* Identify unreleased objects.
* Deploy a fixed version.

---

# Incident Response Process

## 1. Acknowledge

Confirm the alert and notify the team.

## 2. Assess

Determine:

* Number of affected users
* Impacted endpoints
* Severity of outage

## 3. Mitigate

Apply temporary fixes to restore service availability.

## 4. Resolve

Identify and fix the root cause.

## 5. Verify

Ensure:

* Error rate falls below 2%
* Latency returns to normal
* No new alerts are firing

## 6. Postmortem

Document:

* Root cause
* Timeline
* Resolution steps
* Preventive actions

---

# Simulating the Alert

Generate failures using the test endpoint:

```bash
curl http://localhost:3000/fail
```

PowerShell:

```powershell
1..100 | ForEach-Object {
  try {
    Invoke-WebRequest http://localhost:3000/fail
  } catch {}
}
```

After approximately 60 seconds, the HighErrorRate alert should transition to FIRING in Prometheus and Alertmanager.
