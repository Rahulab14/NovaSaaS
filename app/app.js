const express = require("express");
const promClient = require("prom-client");
const logger = require("./logger");

const app = express();
const PORT = process.env.PORT || 3000;

// ================================
// Prometheus Registry
// ================================
const register = new promClient.Registry();

promClient.collectDefaultMetrics({
  register,
});

// ================================
// Metrics
// ================================

const httpRequestsTotal = new promClient.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

const httpRequestDuration = new promClient.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [
    0.005,
    0.01,
    0.025,
    0.05,
    0.1,
    0.25,
    0.5,
    1,
    2.5,
    5,
    10,
  ],
});

const httpErrorsTotal = new promClient.Counter({
  name: "http_errors_total",
  help: "Total number of HTTP errors",
  labelNames: ["error_type"],
});

register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDuration);
register.registerMetric(httpErrorsTotal);

// ================================
// Request Logging Middleware
// ================================

app.use((req, res, next) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startTime;
    const durationSeconds = durationMs / 1000;

    const route = req.route?.path || req.path;

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode,
      },
      durationSeconds
    );

    logger.info({
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      responseTimeMs: durationMs,
      timestamp: new Date().toISOString(),
    });
  });

  next();
});

// ================================
// Routes
// ================================

// Home
app.get("/", (req, res) => {
  res.status(200).json({
    service: "NovaSaaS",
    status: "Running",
    version: "1.0.0",
  });
});

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
  });
});

// Failure Endpoint (Used for Alert Testing)
app.get("/fail", (req, res) => {
  httpErrorsTotal.inc({
    error_type: "5xx",
  });

  logger.error({
    route: "/fail",
    statusCode: 500,
    message: "Intentional failure endpoint triggered",
    timestamp: new Date().toISOString(),
  });

  res.status(500).json({
    success: false,
    error: "Internal Server Error",
    message: "Intentional failure for alert testing",
  });
});

// Metrics Endpoint
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    res.status(500).end();
  }
});

// ================================
// Global Error Handler
// ================================

app.use((err, req, res, next) => {
  httpErrorsTotal.inc({
    error_type: "5xx",
  });

  logger.error({
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
  });

  res.status(500).json({
    error: "Something went wrong",
  });
});

// ================================
// Start Server
// ================================

app.listen(PORT, () => {
  logger.info({
    service: "NovaSaaS",
    message: `NovaSaaS Observability Service running on port ${PORT}`,
    timestamp: new Date().toISOString(),
  });
});