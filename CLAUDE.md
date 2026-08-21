# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Foundry VTT v14 game system (`id: ryf3`) implementing the Spanish tabletop RPG **Rápido y Fácil 3.0**. Plain ES modules — no build step, no package.json, no bundler, no test suite, no linter.

## UI architecture (ApplicationV2, since 0.5.0)

The whole UI was migrated to ApplicationV2 in v0.5.0 — no AppV1, `FormApplication`, V1 `Dialog` or jQuery remains:

- Sheets extend `foundry.applications.sheets.ActorSheetV2`/`ItemSheetV2` through `RyfSheetMixin` (`module/sheets/sheet-mixin.mjs`), which provides manual tab handling (`data-action="changeTab"`, persists across re-renders), `editImage`, and routes every template `data-action` to `_handleSheetAction`. The old dynamic `get template()` per type became one subclass per document type: `RyfCharacterSheet`/`RyfNpcSheet`/`RyfShipSheet` and, for items, subclasses generated in `registerItemSheets()` — each with its own `static PARTS`.
- Dialogs go through the `DialogV2` wrappers in `module/helpers/dialogs.mjs` (`formDialog`, `confirmDialog`, `choiceDialog`): cancel/close always resolves `null`; `read(fields)` receives the dialog form's named elements. Use these for any new dialog.
- Settings menus (`custom-pyramid-config`, `rules-config`, `economy-config`) are `HandlebarsApplicationMixin(ApplicationV2)` with `tag: 'form'` and a static form handler.
- Sheet templates root on a `<div class="{{cssClass}} flexcol sheet-content">` (AppV2 supplies the `<form>`), use `data-action` attributes, and `<prose-mirror>` elements instead of the `{{editor}}` helper (context provides `enrichedBiography`/`enrichedDescription`).
- Chat interactivity uses the `renderChatMessageHTML` hook (native `HTMLElement`); all namespaced APIs (`foundry.applications.handlebars.renderTemplate`/`loadTemplates`, `foundry.applications.ux.TextEditor.implementation`, `foundry.documents.collections.Actors`/`Items`) — never the bare V1 globals.
- Active Effects were migrated to the v14 V2 schema (`effect.system.changes`, string `type` instead of numeric `mode`). Any new code reading or creating effect changes must use that shape.

## Development workflow

There is no build or dev server. To develop:

1. Clone/symlink this repo into `[Foundry Data]/systems/ryf3/`
2. Restart Foundry VTT (or press F5 in the Foundry client) after changes
3. Test manually in a world using the "Rápido y Fácil (RyF) 3.0" system

Foundry v14 caveats: v14 requires a clean install (no in-place upgrade from v13), and worlds opened in v14 cannot be reopened in v13 — use a throwaway test world.

## Compendium packs

Source of truth is **JSON documents in `packs/_source/<pack-name>/`** (tracked in git, one file per document, stable `_id`/`_key`; embedded documents — e.g. NPC attacks — live inline in the parent JSON and also carry their own `_key` like `!actors.items!<actorId>.<itemId>`). The LevelDB binaries under `packs/es/...` are build artifacts (gitignored) compiled with the official Foundry CLI:

- `npm run pack` — compile all sources to LevelDB (`npm run pack -- advantages-es` for one pack)
- `npm run unpack` — extract pack databases back to JSON sources (after editing compendium content inside Foundry with the pack unlocked)
- **Foundry must be closed** when packing/unpacking — LevelDB holds a lock while the server runs.
- Compiled binaries are gitignored; only `packs/_source` is tracked. After `git pull` on another machine, run `npm run pack` to rebuild local compendiums.

## Releases

Automated via GitHub Actions (`.github/workflows/release.yml`): pushing a `v*` tag compiles the packs, patches `system.json` (version from tag, per-version `download` URL, `manifest` stays on `releases/latest`), builds `ryf3.zip` (runtime files only — no `_source`, `utils/`, `node_modules`) and publishes the GitHub Release. Don't build release zips by hand. `ci.yml` validates JS syntax, all JSON files and a pack compile on every push/PR to `main`. Play installs should use the manifest URL, not a git clone.

Orchestrated by `utils/packs.mjs`, which enumerates packs from `system.json`. New pack = declare it in `system.json` + create `packs/_source/<name>/`.

Other utility scripts:
- `utils/lang-json/*.js` — Node scripts run from a terminal (`node utils/lang-json/sort-json.js`): sort `lang/es.json`, compare translation files, detect unlocalized keys. Note their relative paths assume the old `utils/` location, so verify the resolved path before running.
- `utils/import-packs/*.js` — **legacy** Foundry-console scripts (they use `game`, `ui`, `Item.create`), superseded by `packs/_source` + `npm run pack`. Kept for reference; do not treat them as data sources anymore.

## Core mechanic (informs most roll code)

The system's signature roll is **1-of-3d10**: roll 3d10, take the *middle* die (highest with advantage, lowest with disadvantage); a chosen 10 explodes (roll 1d10 and add, repeating on 10s). Implemented in `module/helpers/dice.mjs` (`roll1o3d10`). Result + attribute + skill + modifiers vs. a difficulty; every 10 points over the difficulty adds a critical die to damage.

## Architecture

Entry point is `module/ryf.mjs`, declared in `system.json` (`esmodules`). It registers document classes, sheets, settings, ~20 Handlebars helpers, and all Hooks (initiative chat-card rewriting, chat button handlers for damage rolls/application, per-turn active-effect reminders, and the compendium translation-key system described below).

- `template.json` — Foundry data schema for Actors (`character`, `npc`) and Items (`skill`, `weapon`, `armor`, `shield`, `equipment`, `spell`, `npc-attack`, `advantage`). Change this file to add/modify system data fields. Attribute keys are Spanish (`fisico`, `destreza`, `inteligencia`, `percepcion`, `carisma`).
- `module/documents/actor.mjs` — `RyfActor`, by far the largest file. Derived data (defense, willpower, health/mana from settings multipliers), skill-pyramid validation, XP spend, damage/heal/mana, rest, attack rolls, and the entire spell-casting pipeline (`castSpell` dispatches per effect type to `_applyImmediateDamage`, `_applyTemporalEffect`, `_applyCondition`, etc.).
- `module/rolls/ryf-roll.mjs` — `RyfRoll` static methods (`rollSkill`, `rollAttack`, `rollDamage`, `rollSpellCasting`, `rollOpposed`, `rollDualDamage`, …) that perform 1o3d10 rolls and render the chat cards in `templates/chat/`. The kept-die rank is a clamped ladder (`resolveMode` in `dice.mjs`): downs (wounded, untrained, token debt) and ups (specialization, death token) collected per roll by `RyfRoll._collectFactors`, which also spends the token / clears the debt. A natural 1 on the kept die always fails. Death tokens (`enableTokens` setting, PDF pp. 91-92) live in `character.system.tokens`; the GM returns one via `RyfActor.returnDeathToken`, which sets the `ryf3.tokenDebt` flag consumed by the actor's next roll.
- `module/documents/combat.mjs` — `RyfCombat` overrides `rollInitiative` with a true 1o3d10 roll (explosion, wounded disadvantage, hindrance) and computes multiple actions (initiative 20+ → 2 actions, 30+ → 3…), stored in `flags.ryf3.actions` and shown in the combat tracker.
- Advantages (Ventajas, PDF p.98) are `advantage` Items built on the generic effects system: `system.effects[]` (edited in the sheet's effects tab, same partials as equipment) apply as ActiveEffects while the item is on the actor (`_onCreate`/`_onDelete`/`_onUpdate` resync in `item.mjs`; equipables apply only while `equipped`). Effect targets cover additive bonuses plus `spell-casting`, `healing-received`, `health-multiplier`/`mana-multiplier` (consumed in `rollSpellCasting`, `heal()`, `_prepareCharacterData`) and a non-mechanical `note` type for manual rules. Advantage limit is the `maxAdvantages` world setting (advisory warning); the 14 manual advantages live in the `advantages-es` compendium as editable examples.
- Races (Razas, PDF p.98) are `race` Items behind the `enableRaces` toggle, reusing the advantage effects machinery (always active while owned) plus advisory-only fields: `attributeCap`, `xpSessionModifier` (note in the XP chat card), `pyramidRestriction` (pyramid banner), `armorForbidden` (warn on equip). `system.grantedAdvantages` holds `{uuid, name}` links (drop advantage items on the race sheet); adding the race to an actor auto-creates those advantages (choice dialog when >1, flagged `ryf3.grantedByRace` and removed with the race — `RyfItem._grantRaceAdvantages`). One race per character (advisory); the 6 manual races live in `races-es`.
- Optional modules, each behind its own world toggle: `enableTokens` (death tokens, pp. 91-92), `enableAmmo` (pp. 96-98), `enableRaces` (p. 98), `enableSanity` (Cordura = INT × `sanityMultiplier` rule, p. 43, `RyfActor.loseSanity`), `enableHitLocation` (p. 95; the 1d10 table is a table-agreed reconstruction — the book's table was never printed (erratum); the only canonical datum is the p. 95 example, 4 = right leg. The whole table lives in `hitLoc*` rule keys, editable from the RulesConfig menu, and `module/config/hit-locations.mjs` builds it via `getHitLocations()`), `enableShips` (pp. 103-104: `ship` Actor type — creation gated by a `preCreateActor` hook — with V/M/BD, hull = BD × `shipHullMultiplier` rule. Each ship rolls its own side of the contest via `RyfRoll.rollShipRoll` (Attack/Defense buttons use maneuverability, Chase uses speed); totals are compared in chat. Crew: drop a character on the ship sheet to link pilot/gunner (`system.pilot`/`system.gunner` UUIDs) — `RyfActor.getCrewBonus` computes DES + the `shipPilotSkill`/`shipGunnerSkill` rule-named skill from the linked sheet, falling back to the ship's manual `pilotBase`/`gunnerBase`. Missiles are consumed on firing; the attack card carries a deferred damage button. 8 example ships in `ships-es`). Minions (p. 87) need no toggle: per-NPC `isMinion` checkbox — any effective damage drops them to 0 HP and attack cards show the +5-margin extra-minion note. Hacking (pp. 105-107) is deliberately data-only: a `Hacking` skill in `skills-es` whose description documents the FS/RdE/intrusion/counter-hacking procedure — no state machine.
- `module/documents/item.mjs` — `RyfItem`: equip toggling (applies/removes armor/shield bonuses), skill level up/down with XP cost.
- `module/documents/ryf-active-effect.mjs` — `RyfActiveEffect.createFromSpell` turns spell effect data into timed Active Effects (combat-turn durations).
- `module/config/spell-effects.mjs` — spells contain an `effects[]` array typed by `SPELL_EFFECT_TYPES` (immediate-damage, immediate-healing, buff, debuff, condition); each type declares which form fields it uses, rendered via `templates/item/partials/effect-*.hbs`.
- `module/helpers/settings.mjs` — world settings. Only module toggles (`enableCarisma`, `enableMagia`, `enableTokens`), `defaultCharacterType` and the two menus are visible in the general config window; every numeric rule setting (health/mana multipliers, attribute points, max skill level, max advantages) is registered with `config: false` and edited exclusively through the `RulesConfig` menu — don't re-expose them or you create duplicate configuration points.
- `module/helpers/rules.mjs` — every other sheet-affecting rule constant (defense/willpower bases, wounded/unconscious/death thresholds, range difficulty bands, actions-per-initiative step, dual-wield bonus, XP cost multiplier, rest recovery, creation caps) lives in `DEFAULT_RULES` with its PDF page citation, overridable per world via the `RulesConfig` menu (`rules-config.mjs`, hidden `coreRules` object setting). **Never hardcode a rule number — read it through `getRule(key)`.** Presets (Heroico/Realista) only pre-fill form values; every field stays freely editable.
- Sheets are **ApplicationV2** (`module/sheets/`, see "UI architecture" above). New sheet interactions: add a `data-action` in the template and a case in `_handleSheetAction`; new dialogs use the helpers in `module/helpers/dialogs.mjs`. No jQuery.

### Compendium translation-key system

Pack documents can carry `flags.ryf.translationKey`; names/descriptions stored as `RYF.ITEMS.<key>.*` are localized at render/create time by hooks in `ryf.mjs` (`preCreateItem`, `preCreateActor`, `renderCompendium`, `renderActorSheet`, the `localizeItem` Handlebars helper). All UI strings live in `lang/es.json` under the `RYF.` namespace (Spanish is currently the only language file; `system.json` also declares EN packs that don't exist yet).

## Conventions (from README)

- Code (variables, functions, comments) in **English**; user-facing strings localized via `lang/es.json`.
- Avoid comments except for complex logic or rule references.
- Any rules implementation must cite the official RyF 3.0 PDF page number in a comment, e.g. `// Reference: RyF 3.0 PDF, Page XX - "Daño Crítico"`.
- Work on feature branches off `main`; PRs target `main` and must include PDF page references and testing notes.
- Bump `version` in `system.json` when releasing; the manifest/download URLs point at GitHub releases.
