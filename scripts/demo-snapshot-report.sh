#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEMO_DIR="${1:-$ROOT_DIR/.demo/snapshot-report}"
REPORT_DIR="$DEMO_DIR/reports"

mkdir -p "$REPORT_DIR"

echo "Running snapshot-report (pass 1)..."
corepack pnpm --dir "$ROOT_DIR" start -- snapshot-report --format both --path "$REPORT_DIR"

echo "Running snapshot-report (pass 2)..."
corepack pnpm --dir "$ROOT_DIR" start -- snapshot-report --format both --path "$REPORT_DIR"

LATEST_JSON="$(ls -1t "$REPORT_DIR"/snapshot-report-*.json | head -n 1)"
LATEST_MD="${LATEST_JSON%.json}.md"

node -e '
const fs = require("node:fs");
const reportPath = process.argv[1];
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
console.log("");
console.log("Latest report:", reportPath);
console.log("Trend baseline:", report.trend?.previousSnapshot?.generatedAt ?? "none");
console.log("Delta summary:");
for (const [name, delta] of Object.entries(report.trend?.deltas ?? {})) {
  const value = delta?.delta === null || delta?.delta === undefined ? "n/a" : delta.delta;
  const direction = delta?.direction ?? "na";
  console.log(`- ${name}: ${value} (${direction})`);
}
' "$LATEST_JSON"

echo ""
echo "Open these files:"
echo "- $LATEST_JSON"
if [ -f "$LATEST_MD" ]; then
  echo "- $LATEST_MD"
fi
