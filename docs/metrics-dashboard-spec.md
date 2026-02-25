# Metrics Dashboard Spec

## Purpose

Track whether the CLI starter kit is delivering business value, not just technical activity.

## Success Targets (90 Days)

- Time to first feature: less than 3 days
- CI pass rate before merge: at least 95%
- First production CLI command shipped: yes/no milestone

## KPI Definitions

### 1. Time to First Feature

- Definition: elapsed time from repository initialization to merge of first production command PR
- Formula: `first_feature_merged_at - project_initialized_at`
- Unit: hours and days
- Goal: under 72 hours

### 2. CI Pass Rate Before Merge

- Definition: percentage of PR validation runs that pass on the final pre-merge commit
- Formula: `passing_pre_merge_runs / total_pre_merge_runs * 100`
- Unit: percentage
- Goal: at least 95%

### 3. Setup Hours Saved

- Definition: estimated setup hours avoided relative to historical baseline
- Formula: `baseline_setup_hours - actual_setup_hours`
- Unit: hours
- Goal: reduce setup time by over 80%
- v0 command status: deferred in `snapshot-report` output until baseline onboarding is implemented

### 4. Defect Rate (Early Quality)

- Definition: post-merge defects per merged command within first 14 days
- Formula: `defects_reported / merged_commands`
- Unit: defects per command
- Goal: trend downward month-over-month

### 5. Merge Friction

- Definition: median time from PR open to PR merge
- Formula: `median(merged_at - opened_at)`
- Unit: hours
- Goal: reduce over time without increasing defect rate

## Data Sources

- GitHub API
  - Pull requests (open/merge timestamps, approvals, merge status)
  - Workflow runs (`validate` status)
  - Commits associated with PRs
- Local project telemetry (optional phase)
  - Timestamp file from `agent-alpha init`
  - Command generation events (count and timestamps)

## Dashboard Layout

### Executive View

- Time to first feature (current and trend)
- CI pass rate (current rolling 30-day)
- Merge friction (median)
- Milestone widget: first production command shipped

### Delivery View

- PR cycle time distribution
- CI failure categories (lint/typecheck/test/build)
- Re-run rate per PR

### Quality View

- Defects by command and release window
- Defect trend against merge velocity

## Reporting Cadence

- Weekly operating review: delivery + quality trends
- Monthly business review: target attainment and improvement actions

## Alert Thresholds

- CI pass rate under 90% (rolling 2 weeks)
- Median merge friction over 48 hours
- Time to first feature forecast exceeds 72 hours

## Implementation Notes

- Start with GitHub-native extraction scripts and markdown reports in `docs/reports/`.
- Canonical command is `agent-alpha snapshot-report`; `metrics snapshot` is a compatibility alias.
- v0 emitted KPI fields include: time-to-first-feature, CI pass rate before merge, and merge friction.
- `setup-hours-saved` is intentionally omitted in v0 report artifacts.
- Add automated metric snapshots after each merge into `main`.
- Keep formulas stable for at least one quarter before changing definitions.
