# Lake Journey Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline. The user has explicitly prohibited subagents and authorized execution in the current conversation.

**Goal:** Add a playable lake trip with reciprocal cooperation and a warm return home.

**Architecture:** Keep episode 6 checkpoint 2 pending while `state.journey` progresses independently. Add `journey.js` for maps, interaction and actor switching; `journey-art.js` for canvas scenery and props. Hook the existing episode, save, HUD and renderer code without renumbering episode checkpoints.

**Tech Stack:** Existing vanilla JavaScript, canvas, Node's test runner; no dependencies.

**Spec:** docs/superpowers/specs/2026-11-11-lake-journey-design.md

## Global Constraints

- No subagents. Both characters stay playable. Reunite before returning home.
- Retain legacy saves, 10 episodes and three explicit relationship routes.
- Save each actor's map and position in the split section; commit story progress after dialogue completion.
- No automatic GitHub push.

## Review Focus

- Reload during split action must repeat the action without awarding progress early.
- Switching before prerequisite work must leave a reachable objective for the other actor.
- Invalid or inconsistent journey saves must be rejected.
- Existing episode completions and routes must still work with the trip completed.
- All new objectives, exits and return routes must be reachable on foot.

### Task 1: Playable trip, save state and integration

Files: journey.js; core.js; episodes.js; game.js; tests/journey.test.cjs; tests/episodes.test.cjs; tests/vignettes.test.cjs.

- [x] Write and run failing tests for new map access, reciprocal gates, actor switching, interrupted reading, save validation and reunion.
- [x] Implement `OkaeriJourney.begin(api)`, `handle(id,api)`, `switchActor(api)`, `capture(state)`, `split(state)`, `active(state)`, `objective(state)`, `notes(state)` and `walkable(scene,x,y)`.
- [x] Add episode-6 handoff, preserve completed journey across chapters, and integrate HUD/journal/party switching.
- [x] Walk complete trip and all relationship routes with save round trips; run full tests.

### Task 2: Scenery, story and verification

Files: journey-art.js; world.js; index.html; README.md.

- [x] Draw three distinct maps and stateful cooperation props. Hide the follower during split scenes.
- [x] Author environmental discoveries, reciprocal action dialogues, reunion, shared meal and home callbacks.
- [x] Browser-test chapter selection, departure, Q switching and the split objectives; inspect rendering and console errors.
- [x] Run all tests, verify source/export synchronization if needed, self-review and report what was actually verified.

## Verification record

- 73 tests passed, 0 failed. New tests cover reciprocal prerequisites, saved positions, unsafe saves, all three routes after the trip, the real game's Q handler and separate chapter-preview saves.
- Browser: chapter-select trip entry → lake sign → Nina's light → Minamo → workshop → four alternating actions → reunion → meal → return trail → home → episode-6 end modal. Also reloaded the home arrival save and resumed successfully. No browser error/warning logs.
- Scenery checked on desktop. Mobile viewport has not been checked in this pass.
- Self-review: departure is saved on a playable map; the travel journal cannot teleport a separated actor out of their scene; the home interaction retains the table's rendering; save validation and walking share the same new-map geometry.
- The existing Git export was clean before synchronization. Changes are prepared locally; no new commit or push was requested for this feature.
