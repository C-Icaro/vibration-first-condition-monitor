# Vibration-First Condition Monitor

Open ESP32-S3 edge condition monitoring concept for small motors, fans and low-voltage mechatronic benches.

## Current status

`visual-simulator`

The deployed dashboard is a product and data-flow prototype. Every signal, feature, anomaly score, confidence value and event is synthetic. It does not diagnose equipment and no physical sensor or trained production model is connected.

## Visual simulator

The Next.js dashboard demonstrates:

- nominal, inspect and degraded scenarios;
- triaxial vibration features and temporal trends;
- an edge pipeline from acquisition to recommendation;
- evidence confidence, node health and fleet state;
- event acknowledgement and JSON snapshot export;
- responsive behavior from 360 px;
- persistent synthetic-data provenance.

## Run locally

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Validation

```bash
npm run check
```

The check runs ESLint, TypeScript, Vitest and the production build.

## Project structure

- `app/`: Next.js routes, mock telemetry API and visual system;
- `components/dashboard/`: operational dashboard components;
- `lib/telemetry/`: schema, validation, scenarios and provider boundary;
- `tests/`: minimum synthetic telemetry test bed.

## Physical gates

Hardware claims remain blocked until the sensor, sampling chain, feature extraction, anomaly baseline, enclosure coupling and controlled-fault protocol are implemented and measured on a physical bench.

## License

MIT for the current software. A dedicated open-hardware license must be selected before publishing fabrication sources.
