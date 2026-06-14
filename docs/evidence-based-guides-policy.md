# Evidence-Based Guides Policy

This policy controls author, evidence, confidence, limitation, and changelog signals for `lastzguides.com`.

The goal is not to add decorative trust copy. The internal goal is to know what was checked, what is inferred, what still needs validation, and where the advice can vary by account stage, server age, season, or live event state.

The public goal is much smaller: give players a quiet, human signal that the page is not random AI text and that the important claims have a real basis.

## Core Rules

Evidence statements are editorial claims. Do not add or update them unless the page has a real basis for the claim.

Internal evidence records may answer:

- what was checked
- how it was checked
- when it was checked
- what account, server, season, branch, event, table, or source type the check applies to
- what is still untested or variable

Do not expose internal evidence structure directly on public pages.

## Public Trust Signals

Public trust signals are not methodology sections. They are small player-facing confidence cues.

They should feel like a quiet stamp from experienced players, not a report from an SEO or LLM system. Most players will skim past the signal; that is fine. Its job is to confirm that the page is grounded in real play without pulling attention away from the guide.

Use the smallest component that fits:

- `guide-verified`: first-screen answer or trust line.
- `verification-note`: optional page-specific note for dynamic, risky, or spend-sensitive advice.
- `disclaimer`: optional practical caveat for live values, costs, events, calculators, or patch-sensitive numbers.

Do not require all three on every page.

Rules:

- Keep public trust copy short.
- Use plain player language.
- Confirm that relevant gameplay was checked in game by real players on server 403 only when that is the actual basis.
- Use varied wording that fits the page; do not repeat one sitewide sentence.
- Mention only the practical thing the player should trust or double-check.
- Do not make the trust copy bigger than the advice it supports.
- Do not use labels such as `Evidence basis`, `Source checks`, `Confidence`, `Limitations`, or `Methodology` in public HTML.
- Do not write like an audit, compliance note, schema note, or LLM output.
- Remove the block when it only repeats the introduction, Quick Answer, or a generic "things may change" warning.

Good public patterns:

- `Checked in game by players on server 403 before this guide was updated. Still confirm the live requirement screen before spending badges.`
- `This flow was checked in game on server 403: copy UID from Avatar -> Settings -> Copy ID, redeem in the Gift Center, then check mailbox.`
- `Server 403 players checked these research values in game. Use this page to plan, then confirm the exact node before spending rare badges.`
- `Hero advice here comes from real roster testing and player checks on server 403. Compare it with your built main five before moving fragments or gear.`
- `Code status changes fast. Players check codes through the Gift Center, but the live Gift Center response is always the final answer for your account.`

Bad public patterns:

- `Evidence basis:`
- `Source checks:`
- `Confidence: Medium`
- `Limits:`
- `Validated against source registry`
- `This page needs manual review`
- `Based on in-game data, tested results, and community validation`

If a claim was not checked in game by server 403 players, do not imply that it was. Either leave the trust signal out, make the uncertainty useful to the player, or keep the note internal until owner validation exists.

## Component Decision Rules

### Use `guide-verified` when:

- the page is indexable and important;
- the user needs the main recommendation immediately;
- the sentence can say something useful without pretending to be proof.

Good shape:

- `For most accounts, start with Hero Training to Cockpit, Military Strategies, and Peace Shield for Urgent Rescue before choosing a late-game path.`
- `Use the official Gift Center in a browser, copy UID from Avatar -> Settings -> Copy ID, then check mailbox after redeeming.`

### Use `verification-note` when:

- the page has live state or fast-changing status;
- the advice can cost rare resources if wrong;
- the page contains totals, tables, calculators, event thresholds, hero/meta priorities, or troubleshooting flows;
- a short note tells the player what to verify before acting.

### Use `disclaimer` when:

- a live in-game screen should be treated as final authority;
- a table or calculator has limits;
- event rewards, costs, timings, or eligibility can change by server/update;
- a player may spend badges, diamonds, speedups, hero resources, or rare event items.

Do not use `disclaimer` for generic site-wide caution.

## Author And Editor Signal

Every key guide should make the responsible editorial role clear without pretending a larger newsroom exists.

Acceptable patterns:

- `By Last Z Guides`
- `Reviewed by Last Z Guides for current route and source consistency`
- `Maintained by Last Z Guides using owner-provided checks, in-game observations, source tables, and public player reports where noted`

When a page uses external reports, distinguish them from original testing:

- Original observation: checked in game, from screenshots, live UI, generated site data, or owner-provided records.
- External validation: cross-checked against public player reports, official pages, or community-visible material.
- Recommendation: the site's strategic interpretation of the evidence.

Do not imply personal testing, account ownership, server access, whale-account data, late-season validation, or patch-note review unless that evidence exists.

## Evidence Blocks

Internal evidence notes should be page-specific. These labels are for reports, proposals, and review artifacts, not public page copy. They must not be copied into public HTML as headings, bullet labels, captions, or trust-block text.

A useful internal note may include:

- `Basis:` what the page is based on.
- `Checked:` the exact mechanic, table, route, UI flow, event screen, or source type.
- `Limits:` where the advice may differ for editorial review.
- `Confidence:` only when it helps editors judge risk before publication.

Good internal examples:

- `Basis: Gift Center flow checked against the official redemption page, UID path Avatar -> Settings -> Copy ID, and mailbox reward delivery guidance.`
- `Limits: Code status changes faster than normal guide mechanics; always use the live Gift Center response as the final source.`
- `Basis: Research route checked against the canonical Hero Training -> Cockpit, Military Strategies, Peace Shield/Urgent Rescue route and linked branch cost pages.`
- `Limits: Badge costs, branch prerequisites, and late-game Siege to Seize / Field Research value can change after research updates.`
- `Basis: Table totals come from the generated research branch data source and cumulative badge calculations.`

Bad public examples:

- `Guide verified against current game mechanics.`
- `Based on in-game data, tested results, and community validation.`
- `Reviewed for the current patch and season context.`
- `We keep this page accurate and up to date.`
- `Trusted by players.`

The bad examples are too broad or too technical. They either do not say what was checked, or they make the public page sound like an internal audit.

## Confidence Labels

Use confidence labels only in internal reports and proposals. Do not publish confidence labels in public guide HTML.

`High confidence` means one of these is true:

- directly tested in game;
- based on stable UI flow or official redemption behavior;
- derived from generated source data and calculation checks;
- protected by a canonical site claim that has clear basis.

`Medium confidence` means:

- confirmed by multiple source types or public player reports;
- strategically reasonable but may vary by server age, season, account spend, roster, or event state;
- supported by current site knowledge but not directly tested across all late-game cases.

`Low confidence` means:

- early observation;
- limited source coverage;
- needs owner validation;
- likely to change after season, event, merge, or balance changes.

Never use `High confidence` without an explicit internal basis. Do not expose confidence labels on public guide pages.

## Limitations

Internal limitations should help editors decide how much to trust the page. Public caveats should be shorter, should avoid the `Limits:` label, and should tell the player what to verify in game.

Good limitations:

- `Not yet directly tested on late-game whale accounts.`
- `May vary on post-merge servers or late Season 3+ accounts.`
- `Use the live event screen as final authority for scoring tasks and reward thresholds.`
- `Confirm final badge costs in game before spending rare badges.`
- `Player reports were used only as public cross-checks, not as private personal data.`

Weak limitations:

- `Things may change.`
- `Use caution.`
- `Results may vary.`

Generic caution is acceptable only as a supporting sentence, not as the whole limitation.

## Methodology Blocks

Use internal methodology blocks or proposal notes on data-heavy or calculation-heavy pages. Do not publish a public section titled `Methodology`, `Evidence`, `Confidence`, `Source checks`, or `Limits`.

- research branch pages;
- research atlas pages;
- HQ / building cost pages;
- reward tables;
- calculators and planners.

A methodology block should explain:

- the source file or table used;
- what calculations were checked;
- which fields are exact and which are estimates;
- when players should verify live values in game;
- what should trigger revalidation.

Do not turn public methodology into an academic section. On public pages, reduce it to a short player note such as `checked in game by server 403 players; confirm the live requirement screen before spending`.

## Changelog

Use changelogs only for meaningful updates.

Each entry should include:

- date;
- what changed;
- why it changed;
- source type: `in-game test`, `official flow`, `owner-provided screenshot`, `generated data table`, `public player report`, `strategy correction`, or `patch/update`.

Do not add changelog entries for:

- typo fixes;
- CSS, nav, footer, or schema-only changes;
- trust wording changes without new evidence;
- mass consistency passes;
- date syncs;
- AI rewrites that do not add factual or strategic value.

Good changelog entry:

- `2026-06-03: Updated Gift Center evidence limits after checking current redemption flow and mailbox delivery assumptions. Source: official flow + site canonical claims.`

Bad changelog entry:

- `2026-06-03: Updated guide.`

## Page-Family Taxonomy

### Hero Guides

Needed evidence:

- visible skill text, faction role, troop alignment, formation logic, current roster limits, and public meta reports where used.

Allowed confidence:

- usually Medium;
- High only for stable skill text or directly checked mechanics;
- Low for new-season or early meta claims.

Claims needing validation:

- best hero overall;
- server-wide meta;
- whale-account priority;
- new-season hero rankings.

Changelog:

- hero balance, new hero release, faction meta correction, skill text correction.

Structured data:

- `Article`;
- `FAQPage` only when visible FAQ answers real questions.

### Research Guides

Needed evidence:

- canonical route, branch prerequisites, linked branch cost pages, generated data where available, owner validation for route corrections.

Allowed confidence:

- High for protected canonical route claims;
- Medium for late-game route tradeoffs;
- Low for newly changed branch economics.

Claims needing validation:

- exact badge costs if not sourced from generated branch data;
- Field Research as required before UST/T10;
- patch-sensitive branch prerequisites.

Changelog:

- branch path correction, cost table update, strategy route correction, new research branch data.

Structured data:

- `Article`;
- `FAQPage` if visible and specific.

### HQ / Building Cost Guides

Needed evidence:

- live requirement screens, generated or maintained tables, level ranges, prerequisite buildings, resource and timer assumptions.

Allowed confidence:

- High for table rows with checked source data;
- Medium for planning recommendations;
- Low for late HQ / new server-stage changes not directly checked.

Claims needing validation:

- exact HQ31-35 requirements;
- T11 timing;
- building prerequisites after updates.

Changelog:

- table update, prerequisite correction, level-range correction.

Structured data:

- `Article`;
- no extra schema unless visible content supports it.

### Event Guides

Needed evidence:

- live event screen, scoring tasks, reward thresholds, rotation, linked economy assumptions.

Allowed confidence:

- Medium by default;
- High only for stable UI flow directly checked;
- Low for new or rotating event variants.

Claims needing validation:

- exact schedule;
- reward thresholds;
- scoring task order;
- server-specific timing.

Changelog:

- scoring change, reward update, rotation correction, live-screen validation.

Structured data:

- `Article`;
- `FAQPage` only for visible operational FAQ.

### Resource Guides

Needed evidence:

- resource sources, gathering behavior, shop stock, diamond reserve rules, event timing, farm-account limits.

Allowed confidence:

- Medium for strategy;
- High for canonical reserve-first claims;
- Low for source amounts or server-specific pressure.

Claims needing validation:

- exact resource output;
- shop stock;
- event value;
- transfer behavior.

Changelog:

- economy rule correction, source change, shop/value update.

Structured data:

- `Article`;
- `FAQPage` when the visible FAQ is useful.

### F2P / Progression Guides

Needed evidence:

- account-stage assumptions, resource constraints, diamond reserve rules, unlock checkpoints, event timing.

Allowed confidence:

- Medium by default;
- High for protected canonical economy claims;
- Low for server-specific or spend-tier claims.

Claims needing validation:

- exact diamond reserve amount as universal advice;
- late-game F2P route;
- event-specific spending thresholds.

Changelog:

- strategy correction, new account-stage evidence, economy update.

Structured data:

- `Article`;
- visible FAQ only if it adds concrete decision support.

### Calculators / Data Pages

Needed evidence:

- source data file, formula, generated output path, validation checks, known exclusions.

Allowed confidence:

- High for calculations from checked source data;
- Medium when formulas depend on player-entered values or changing game data.

Claims needing validation:

- totals without source file;
- formulas not reviewed;
- generated pages hand-edited outside source data.

Changelog:

- formula change, source table update, generated output correction.

Structured data:

- `Article` only if the page has article-like explanatory content;
- avoid schema that implies unsupported guarantees.

### Codes / Gift Center Pages

Needed evidence:

- official Gift Center behavior, UID path, mailbox delivery, live code status check process, source type for code discovery.

Allowed confidence:

- High for stable redemption flow and UID path;
- Medium for active code status because it changes quickly;
- Low for unverified community-reported codes.

Claims needing validation:

- active codes;
- daily check frequency;
- rewards;
- campaign availability;
- region/server eligibility.

Changelog:

- active/expired code status, Gift Center UI flow change, reward delivery correction.

Structured data:

- `Article`;
- `FAQPage` only when the FAQ reflects visible troubleshooting content.

## AI-Assisted Draft Rules

AI-assisted drafts are allowed only as drafts.

Before publication, a human or owner-approved workflow must identify:

- which claims are original observation;
- which claims are based on generated site data;
- which claims are based on public external reports;
- which claims are recommendations;
- which claims need validation;
- whether freshness or changelog fields should change.

Do not let an AI draft invent:

- servers;
- account levels;
- seasons;
- screenshots;
- tests;
- patch notes;
- player reports;
- source names;
- dates.

If evidence is unknown, say so plainly:

- `Not yet directly tested on late-game accounts.`
- `Needs owner validation before this can be treated as High confidence.`
- `Use the live event screen as final authority.`

## Technical Guardrail

Run the evidence quality guard before publishing evidence or trust changes:

```bash
python3 automation/checks/evidence_quality.py
python3 automation/checks/evidence_quality.py --strict
```

The guard is heuristic. It does not approve content. It highlights risk and blocks obvious unsafe changes, especially evidence-only updates that do not change the underlying page body.

Any public evidence copy still needs the normal content approval gate before it is applied.

When the owner explicitly approves evidence-only public copy changes, record that approval with a source comment in the affected HTML:

```html
<!-- lastz:evidence-update approved="2026-06-03" source="automation/reports/evidence-phase2-player-facing-proposals.md" -->
```

Do not use this marker for unreviewed rewrites, cosmetic trust wording, date changes, or AI-generated evidence. The marker only records an approval that already happened; it is not approval by itself.
