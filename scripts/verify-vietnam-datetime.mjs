/**
 * Verify Vietnam datetime helpers match BE WorkingScheduleDateUtils.
 * Run: node scripts/verify-vietnam-datetime.mjs
 */

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// Inline mirror of FE logic for node test (no TS compile needed)
const VIETNAM_TIMEZONE = "Asia/Ho_Chi_Minh";

function extractVietnamTimeFromIso(iso) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: VIETNAM_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

const cases = [
  {
    label: "08:00 VN from BE startAt",
    iso: "2026-07-01T01:00:00.000Z",
    expectedTime: "08:00",
  },
  {
    label: "17:00 VN from BE endAt",
    iso: "2026-07-01T10:00:00.000Z",
    expectedTime: "17:00",
  },
  {
    label: "22:00 VN overnight shift start",
    iso: "2026-07-01T15:00:00.000Z",
    expectedTime: "22:00",
  },
];

let failed = 0;

for (const testCase of cases) {
  const actual = extractVietnamTimeFromIso(testCase.iso);
  if (actual !== testCase.expectedTime) {
    failed += 1;
    console.error(
      `FAIL ${testCase.label}: expected ${testCase.expectedTime}, got ${actual}`,
    );
  } else {
    console.log(`OK   ${testCase.label}`);
  }
}

if (failed > 0) {
  process.exit(1);
}

console.log("\nVietnam datetime checks passed.");
