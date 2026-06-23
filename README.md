# NovaSaaS Observability Stack

## Overview

NovaSaaS is a production-grade observability project built to monitor a Node.js service using structured logging, metrics collection, dashboards, and automated alerting.

This project implements:

* Winston structured JSON logging
* Prometheus metrics collection
* Alertmanager alert routing
* Grafana dashboards
* Docker Compose orchestration

The goal is to detect service failures before customers are affected and provide clear operational visibility into application health.

---

# Technology Stack

* Node.js (Express)
* Winston
* Prometheus
* Alertmanager
* Grafana
* Docker Compose

---

# Project Structure

```text
observability-stack/
│
├── src/
│   ├── app.js
│   └── logger.js
│
├── prometheus/
│   ├── prometheus.yml
│   └── alert_rules.yml
│
├── alertmanager/
│   └── alertmanager.yml
│
├── grafana/
│   ├── dashboards/
│   │   └── observability-dashboard.json
│   │
│   └── provisioning/
│       ├── datasources/
│       │   └── datasource.yml
│       │
│       └── dashboards/
│           └── dashboard.yml
│
├── Dockerfile
├── docker-compose.yml
├── package.json
├── package-lock.json
├── README.md
├── runbook.md
└── .gitignore
```

---

# Features

## Structured Logging

All application logs are generated using Winston and formatted as JSON.

Example:

```json
{
  "level": "info",
  "method": "GET",
  "path": "/health",
  "statusCode": 200,
  "responseTimeMs": 5
}
```

---

## Prometheus Metrics

The application exposes metrics at:

```text
/metrics
```

Metrics implemented:

### http_requests_total

Counts total HTTP requests.

Labels:

* method
* route
* status_code

---

### http_request_duration_seconds

Tracks request latency using a histogram.

Buckets:

```text
0.005
0.01
0.025
0.05
0.1
0.25
0.5
1
2.5
5
10
```

---

### http_errors_total

Tracks application errors.

Labels:

* error_type

Examples:

* 4xx
* 5xx

---

# Alerting

Prometheus evaluates alert rules and forwards alerts to Alertmanager.

## Alert Rule

### HighErrorRate

The alert fires when:

```promql
(
  sum(rate(http_errors_total[1m]))
  /
  sum(rate(http_requests_total[1m]))
) * 100 > 2
```

Condition:

* Error Rate > 2%
* Duration: 1 minute

Severity:

```text
critical
```

---

# Running the Project

## Prerequisites

Install:

* Docker Desktop
* Node.js 18+
* Git

Verify:

```bash
docker --version
docker compose version
node --version
```

---

# Start the Entire Stack

```bash
docker compose up --build
```

This starts:

* NovaSaaS Application
* Prometheus
* Alertmanager
* Grafana

---

# Service URLs

| Service          | URL                           |
| ---------------- | ----------------------------- |
| NovaSaaS App     | http://localhost:3000         |
| Metrics Endpoint | http://localhost:3000/metrics |
| Prometheus       | http://localhost:9090         |
| Alertmanager     | http://localhost:9093         |
| Grafana          | http://localhost:3001         |

---

# Grafana Login

Default credentials:

```text
Username: admin
Password: admin
```

Grafana will prompt for a password change on first login.

---

# API Endpoints

## Home

```http
GET /
```

Response:

```json
{
  "service": "NovaSaaS",
  "status": "Running",
  "version": "1.0.0"
}
```

---

## Health Check

```http
GET /health
```

Response:

```json
{
  "status": "UP"
}
```

---

## Metrics

```http
GET /metrics
```

Returns Prometheus metrics.

---

## Failure Endpoint

```http
GET /fail
```

Returns:

```json
{
  "success": false,
  "error": "Internal Server Error"
}
```

This endpoint is intentionally designed to generate failures and trigger alerts.

---

# Generate Normal Traffic

Using browser:

```text
http://localhost:3000
```

Using curl:

```bash
curl http://localhost:3000
```

---

# Generate Error Traffic

Linux / macOS:

```bash
for i in {1..100}
do
  curl http://localhost:3000/fail
done
```

Windows PowerShell:

```powershell
1..100 | ForEach-Object {
  try {
    Invoke-WebRequest http://localhost:3000/fail
  } catch {}
}
```

---

# Verify Prometheus

Open:

```text
http://localhost:9090
```

Navigate:

```text
Status → Targets
```

Expected:

```text
novasaas-app = UP
```

---

# Verify Alertmanager

Open:

```text
http://localhost:9093
```

After generating enough failures, the alert should appear.

Expected alert:

```text
HighErrorRate
```

---

# Grafana Dashboard Panels

The dashboard contains four required panels.

## Panel 1

Request Rate

PromQL:

```promql
sum(rate(http_requests_total[5m]))
```

---

## Panel 2

P95 Response Time

PromQL:

```promql
histogram_quantile(
  0.95,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
)
```

---

## Panel 3

Error Rate %

PromQL:

```promql
(
  sum(rate(http_errors_total[5m]))
  /
  sum(rate(http_requests_total[5m]))
) * 100
```

---

## Panel 4

Current Error Rate

PromQL:

```promql
(
  sum(rate(http_errors_total[1m]))
  /
  sum(rate(http_requests_total[1m]))
) * 100
```

Thresholds:

```text
Green   < 1%
Yellow  1% - 2%
Red     > 2%
```

---

# Why sum() Is Used

The error rate calculation uses:

```promql
sum(rate(http_errors_total[1m]))
/
sum(rate(http_requests_total[1m]))
```

instead of:

```promql
rate(http_errors_total[1m])
/
rate(http_requests_total[1m])
```

because the metrics contain different labels.

Using `sum()` aggregates the metrics and avoids Prometheus label matching issues.

---

# Incident Response

Refer to:

```text
runbook.md
```

for:

* Alert meaning
* Database pool exhaustion diagnosis
* External API timeout diagnosis
* Memory leak diagnosis
* Incident response procedures

---

# Future Improvements

* Slack alert integration
* Email notifications
* OpenTelemetry distributed tracing
* Kubernetes deployment
* Service-level objectives (SLOs)
* Distributed logging aggregation

---

# Author

NovaSaaS Observability Stack

Built as part of a production monitoring and incident response assessment.
