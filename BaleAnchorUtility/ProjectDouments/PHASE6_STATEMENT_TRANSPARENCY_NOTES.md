# Phase 6 Statement Transparency Notes

## Scope delivered

This phase extends calculation snapshots and statement outputs so resident-visible values are traceable to stored inputs and reproducible under the same engine version.

## Snapshot trace payload

Calculation snapshots now persist structured trace data used by API responses and PDF statements:

- tariff segment timeline with boundary convention [start, end)
- per-segment allocated usage for cold, hot, apartment electricity, and boiler electricity
- estimated-allocation label when tariff changes occur without boundary readings
- boiler assumptions used for the calculation (DeltaT, heat capacity, density, and kJ-to-kWh conversion factor)
- component line breakdown (usage subtotal, standing subtotal, VAT, total)
- rounding policy version and integrity check digest

## Statement and PDF transparency

Statement summary and export workflows now include:

- estimated period labeling and explanatory text
- tariff segment detail surfaced to the resident
- component equations/line breakdown visibility
- export reference continuity and SHA-256 metadata
- engine and rounding policy disclosure

## Integrity posture

The calculation engine now validates key invariants before snapshot persistence:

- total usage equals sum of segment allocations by component
- water total equals cold + hot totals
- electricity total equals apartment + boiler totals
- period total equals water total + electricity total

If an invariant fails, the snapshot is rejected.

## Known follow-up

- Legacy snapshots created before this phase can have empty trace arrays and default assumption values; a later migration task can backfill where possible.
