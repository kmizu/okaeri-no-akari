# Story Introductions Implementation Plan

> Execute inline; the user explicitly authorized this direction and has prohibited subagents.

**Goal:** A first-time player understands the snowy town, the two leads' shared life and work, and the reason for each day's objective before playing it.

**Architecture:** Split the opening into a home-morning scene and a town-briefing scene, with a validated `openingStage` for safe replay after closing the game. Preserve the episode event counts, coordinates, activities and relationship routes. Rewrite the first event of episodes 2–9 and each episode-10 route, and clarify the lake trip's request. Add a short current-episode context to the journal.

**Spec:** User-approved conversation: start from OP, communicate world and the two leads' work naturally, explain whom the task helps and why they take it on; retain mystery of the lights' origin and warm character-centered endings.

## Constraints

- No subagents, new dependencies, automatic commits or push.
- The origin of the lights stays unresolved; their practical role is clear before departure.
- Explain Touma's repairs, Nina's light magic, Sae's role as mentor, the departure board and the calming of spirits.
- Keep the episode-3 reconciliation, episode-9 choice and three episode-10 routes.
- Do not require older saves to restart or replay the new opening.

## Tasks

- [x] Add failing tests for home → town → exploration, interrupted opening resume, rejected invalid opening saves and legacy continuation.
- [x] Author the two opening scenes and implement their scene/save/music transitions.
- [x] Rewrite each episode introduction and the lake request; keep objectives and progression intact.
- [x] Add current-episode journal context and review the text for repetition, unexplained roles and accidental spoilers.
- [x] Run all tests and browser-check the home opening and town briefing. Synchronize the existing local Git export without pushing.

## Verification

- Canonical game and local Git export: `node --test tests/*.test.cjs` — 78 passed, 0 failed, including opening resume, old saves, episode progression and all relationship routes.
- Export: `git diff --check` passed; nine changed source/documentation files matched the canonical files by SHA-256.
- Browser at isolated port 4174: home opening, both visible leads, town request, resume in each opening scene, exploration objective and journal context checked. No warning/error logs.
- Kept the user's ongoing port-4173 play and save untouched. Left a separate chapter-1 opening preview available on port 4174.
- Screenshot: `outputs/story-introduction-preview.png`. No commit or push performed.
