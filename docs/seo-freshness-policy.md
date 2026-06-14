# SEO Freshness Policy

This policy controls page freshness signals for `lastzguides.com`.

Freshness fields are editorial claims. Do not update them just because a file was touched, regenerated, formatted, translated, linted, or included in a sitewide consistency pass.

## Controlled Fields

The policy applies to:

- `<meta property="article:modified_time">`
- JSON-LD `dateModified`
- visible `Updated`, `Last updated`, `Last reviewed`, or `Last checked` dates
- `sitemap.xml` `<lastmod>`
- trust or verification blocks when they include a review date
- any equivalent `updated`, `lastUpdated`, `modified`, or `reviewed` field added later

## Meaningful Content Updates

You may update freshness fields only when the page's main factual or strategic value changed.

Meaningful updates include:

- new game data was added
- recommendations changed because of a game patch
- a new table, calculation, formula, or cost dataset was added
- hero, research, building, event, or resource priorities changed because of new information
- original test results were added
- new screenshots were added as evidence
- the walkthrough or strategy changed substantially
- outdated claims were corrected after in-game verification
- a new section with unique factual value was added

Cosmetic updates are not meaningful updates.

Do not update freshness fields for:

- typo fixes
- CSS or JavaScript changes
- navigation, header, footer, or shared chrome changes
- related links
- meta description changes without body content changes
- trust block wording without new facts
- one-sentence rewrites
- automated wording replacement
- mass consistency passes
- template FAQ or Quick Answer normalization
- internal tooling changes
- file regeneration that preserves the same body content

## Required Reason Codes

Any freshness change must include one reason:

- `patch_update`
- `new_game_data`
- `strategy_change`
- `tested_in_game`
- `cost_table_update`
- `major_rewrite`

For HTML pages, use the structured-data sync script with an explicit page and reason:

```bash
python3 scripts/sync_structured_data.py --meaningful-update --update-reason new_game_data --update-date 2026-06-03 --page research.html
```

The script writes a source comment near the freshness fields:

```html
<!-- lastz:freshness-update reason="new_game_data" date="2026-06-03" -->
```

The comment is not a substitute for real content changes. It only records the reason so deterministic checks can verify that the date change was intentional.

## Approved Freshness Corrections

A freshness correction is different from a meaningful content update. Use it only
to undo an artificial or accidental freshness sync after owner approval.

Approved corrections may change freshness fields without body-content changes,
but they must include a source comment:

```html
<!-- lastz:freshness-correction approved="2026-06-03" source="automation/reports/freshness-rollback-proposal-2026-06-03.md" -->
```

Do not use a correction marker for normal edits, rewrites, or new game data. Those
must use the meaningful-update reason codes above.

## Sitemap Lastmod

`sitemap.xml` `<lastmod>` must reflect the page's editorial freshness date, not the file modification time.

`scripts/check_site_indexing.py --fix` should preserve or derive `<lastmod>` from page-level freshness fields:

- first use `article:modified_time`
- then JSON-LD `dateModified`
- then existing sitemap `<lastmod>` as fallback

Do not set sitemap `<lastmod>` to today's date for every page during a build.

## Mass Updates

Do not update 30+ pages to the same date unless there was a real content event affecting all those pages.

Examples of valid mass events:

- a game patch changed a mechanic described across the affected pages
- a verified cost-data source changed several generated cost pages
- a major site correction fixed a factual error repeated across pages

Examples that are not valid mass freshness events:

- adding Organization JSON-LD
- changing nav or footer links
- rewriting trust boilerplate
- adding language switchers
- rebuilding `sitemap.xml`
- running a formatter
- applying an LLM voice or consistency pass

For mass template changes, change the template and leave page-level freshness untouched. If a template change also includes page-specific factual updates, mark only those pages with valid reasons.

## Guardrail

Run the freshness guard before publishing:

```bash
python3 automation/checks/freshness_guard.py
python3 automation/checks/freshness_guard.py --strict
```

The report shows:

| Page | Freshness fields changed | Body content changed | Meaningful update detected | Reason | Status |
|---|---|---|---|---|---|

Strict mode fails when:

- a freshness field changed without a reason
- the reason is not one of the approved reason codes
- the body content did not change
- `sitemap.xml` `<lastmod>` changed without matching page evidence

The guard is heuristic. It is designed to block obvious accidental or synchronized freshness updates, not to replace human editorial review.

## Future Codex / LLM Agent Rules

Before editing any freshness field:

1. Identify the page's primary job.
2. Confirm the change adds meaningful factual or strategic value.
3. Choose one approved reason code.
4. Apply the content change and freshness change together.
5. Run `python3 automation/checks/freshness_guard.py --strict`.
6. Run the normal prepublish and automation checks.

Do not ask a script to "sync dates" after cosmetic or tooling work. Do not accept LLM-generated copy that changes `Updated` dates unless the exact public copy and freshness reason were approved together.
