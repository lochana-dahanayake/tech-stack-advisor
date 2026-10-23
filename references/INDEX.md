# References index

Source material for knowledge-base rules. Each entry gets a short id; KB entries cite it as `ref:<id>` (or `book:<id> <chapter>` for books).

## How to add a reference (owner)
- Drop files into `books/`, `articles/` or `notes/` (PDF, markdown, text, links file, screenshots all fine).
- Add a row below. A link alone is fine: put it in the "Location" column.
- Large PDFs: GitHub refuses files over 100 MB; prefer a link or extracted chapters.
- **Never** add university lecture material here.

## How to use them (Claude)
- Read the relevant files before drafting scores or rules.
- Summarise in your own words; never paste long passages into docs, code or the app.
- If a reference is old, check the current state online and note both.

| id | Title / author | Type | Location | Covers | Added |
|---|---|---|---|---|---|
| ddia | Kleppmann, *Designing Data-Intensive Applications*, 1st ed. (O'Reilly, 2017) | book | `books/ddia-1st-ed-2017.pdf` | SQL vs NoSQL, data models, replication, partitioning, consistency. A 2nd ed. (Kleppmann & Riccomini, 2026) exists; check online for anything that changed. | 2026-10-24 |
| fosa | Richards & Ford, *Fundamentals of Software Architecture*, 2nd ed. (O'Reilly, 2025) | book | `books/fosa-2nd-ed-2025.pdf` | Definitions of quality attributes (scalability, performance, ...) and trade-off thinking. Background only. | 2026-10-24 |
| mpg17 | Schönig, *Mastering PostgreSQL 17*, 6th ed. (Packt, 2024) | book | `books/mastering-postgresql-17.pdf` | PostgreSQL features: JSON, indexing, extensions, replication, performance. | 2026-10-24 |
| sixstep | *Six-Step Relational Database Design*, 2nd ed. | book | `books/six-step-relational-db-design-2nd-ed.pdf` | How to design a relational (SQL) database step by step; when relational modelling fits. | 2026-10-24 |
| so-survey | Stack Overflow Developer Survey (latest year) | link | https://survey.stackoverflow.co/ | Usage and how much developers like each language, framework and database; hiring signal. | 2026-10-24 |
| jb-eco | JetBrains State of Developer Ecosystem | link | https://www.jetbrains.com/lp/devecosystem-2025/ (check for newer year) | Second survey to cross-check usage. | 2026-10-24 |
| state-js | State of JS | link | https://stateofjs.com/ | Frontend and Node framework satisfaction. | 2026-10-24 |
| db-engines | DB-Engines ranking | link | https://db-engines.com/en/ranking | Database popularity and per-database facts. | 2026-10-24 |
| tw-radar | Thoughtworks Technology Radar | link | https://www.thoughtworks.com/radar | Expert adopt / trial / hold verdicts on tools. | 2026-10-24 |
| web-rendering | web.dev, "Rendering on the Web" | link | https://web.dev/articles/rendering-on-the-web | SPA vs server rendering vs static sites. | 2026-10-24 |
| eol | endoflife.date | link | https://endoflife.date/ | Support and end-of-life dates for each version. | 2026-10-24 |
| techempower | TechEmpower Framework Benchmarks | link | https://www.techempower.com/benchmarks/ | Backend framework speed. Rough signal only. | 2026-10-24 |
