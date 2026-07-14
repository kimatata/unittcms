// Ships console.log/info/warn/error to any OTLP-compatible log backend
// (Grafana Cloud, Splunk Observability Cloud, a self-hosted OpenTelemetry
// Collector, etc.) via the standard OTEL_EXPORTER_OTLP_* environment
// variables. Fully opt-in: disabled entirely (console behaves exactly as
// before, zero overhead) unless OTEL_EXPORTER_OTLP_ENDPOINT is set.
//
// Must be imported before any other application module — it patches the
// global console methods, so anything logged after this module loads gets
// shipped too. See index.ts, where this is the first import.
import { logs, SeverityNumber } from '@opentelemetry/api-logs';
import { LoggerProvider, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-proto';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_NAMESPACE,
  ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
} from '@opentelemetry/semantic-conventions/incubating';

function parseHeaders(raw) {
  if (!raw) return {};
  return Object.fromEntries(
    raw
      .split(',')
      .filter(Boolean)
      .map((pair) => {
        const idx = pair.indexOf('=');
        return [pair.slice(0, idx).trim(), pair.slice(idx + 1).trim()];
      })
  );
}

function formatArg(arg) {
  if (arg instanceof Error) return arg.stack || arg.message;
  if (typeof arg === 'string') return arg;
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

if (endpoint) {
  const exporterUrl = endpoint.endsWith('/v1/logs') ? endpoint : `${endpoint.replace(/\/$/, '')}/v1/logs`;

  const loggerProvider = new LoggerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'unittcms',
      [ATTR_SERVICE_NAMESPACE]: process.env.OTEL_SERVICE_NAMESPACE || 'unittcms',
      [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: process.env.NODE_ENV || 'development',
    }),
    processors: [
      new BatchLogRecordProcessor({
        exporter: new OTLPLogExporter({
          url: exporterUrl,
          headers: parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
        }),
      }),
    ],
  });
  logs.setGlobalLoggerProvider(loggerProvider);

  const otelLogger = logs.getLogger('unittcms-console-bridge');
  const severityByMethod = {
    log: SeverityNumber.INFO,
    info: SeverityNumber.INFO,
    warn: SeverityNumber.WARN,
    error: SeverityNumber.ERROR,
  };

  for (const method of Object.keys(severityByMethod)) {
    const original = console[method].bind(console);
    console[method] = (...args) => {
      original(...args);
      try {
        otelLogger.emit({
          severityNumber: severityByMethod[method],
          severityText: method.toUpperCase(),
          body: args.map(formatArg).join(' '),
        });
      } catch {
        // Shipping a log must never break the app.
      }
    };
  }

  process.on('SIGTERM', () => loggerProvider.shutdown().catch(() => {}));

  console.log(`[otel] Log shipping enabled -> ${exporterUrl}`);
}
