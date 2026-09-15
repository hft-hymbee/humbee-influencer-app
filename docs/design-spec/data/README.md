# Fixtures

Each file matches a response shape in \`../docs/07-api-contract.md\`, with the exact values used in the design prototype.

| File | Shape |
| --- | --- |
| \`manufacturers.json\` | \`GET /manufacturers\` — array, tab-bar order |
| \`industries.json\` | \`GET /catalog/industries\` — drives the demand picker; empty \`manufacturers\` = no-manufacturer path |
| \`leaderboard.json\` | \`GET /leaderboard\` keyed by manufacturer id |
| \`allocations.json\` | \`GET /allocations\` keyed by manufacturer id, then period (\`3m\`/\`6m\`/\`1y\`) |
| \`rewards.json\` | \`GET /rewards\` keyed by manufacturer id, then period |
| \`demands.json\` | \`GET /demands\` — all manufacturers, with summary and counts |
| \`home.json\` | \`GET /home\` |
| \`profile.json\` | influencer identity + the two profile rows |

Reference date for every period calculation: **18 Aug 2026**. Leaderboard points are generated, deterministic, and match the prototype exactly.
