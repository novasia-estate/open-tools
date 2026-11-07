# Changelog

## 1.1.0

- `cleanCSVAudit` adds an explicit decision ledger mapping each original CSV data record to its retained output, first exact-duplicate source or blank-record decision.
- Records count logical CSV records, so embedded quoted newlines do not shift positions. Formula-protected cells identify the original record and 1-based column; record 0 denotes the header.
- The browser displays source-record numbers and downloads a separate audit without raw cell values. Input edits invalidate both downloads.
- Existing `cleanCSV` calls retain their original result shape and export behavior.
- Synchronize the two existing hosted applications: CSV Quality Lab identity review and Payment Milestone Studio partial payments.
