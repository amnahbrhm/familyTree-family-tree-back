// ============================================================================
// NOTE: The old test seed (a small fictional family) has been REMOVED.
//
// The database is now loaded from the REAL family CSVs via the importer:
//
//     node scripts/import-real-data.mjs
//
// which reads ../../data/people.csv and ../../data/relationships.csv,
// WIPES the database, and loads the real graph (FAMILYMEMPER nodes +
// father/mother/child/husband/wife edges).
//
// The real data is intentionally NOT committed here — it contains personal
// names and phone numbers and lives in the project-root `data/` folder
// (outside the git repos).
//
// Do NOT put real PII in this file. If you need a throwaway local seed for
// development, add it below and run it manually against an empty database.
// ============================================================================