# Dialogue Depth Revision

User feedback: dialogue is too terse. Revise the actual playable text, inline without subagents. Preserve the existing plot, route decisions, ten-episode order, short episode-3 quarrel and warm home endings.

The editorial approach is to let a character respond to the specific thing just said, supply the missing referent or reason, and allow a conversation to develop before reaching its conclusion. Everyday details and an occasional physical reaction should support the exchange. Keep urgent rescue instructions short where urgency calls for it; do not turn every reply into a speech. Keep the cinematic OP and title call intact.

- [x] Expand home-morning and first-episode conversations, work scenes, lunch and the first return home.
- [x] Revise the central exchanges in episodes 2–9 and all episode-10 routes, including the confessions and reconciliation. Preserve event checkpoints and optional-story insertion positions.
- [x] Expand the lake trip's split-work/reunion conversation and add a short authoring note to README.
- [x] Run all existing progression/save/route tests, inspect the rendered dialogue and sync the existing Git export without committing or pushing.

Use the existing regression suite for text-only edits. Add tests only for any changed dialogue insertion/control behavior, not for prose length or exact wording.

Verification: 82 tests passed with no failures in the game and the final Git export; the exported seven changed files match the canonical files by SHA-256, and `git diff --check` passed. Browser QA at isolated port 4175 confirmed the revised opening dialogue, readable text, next-line interaction and Nina's smile; no console warnings/errors. Existing port-4173/4174 play was untouched. Screenshot: `outputs/dialogue-depth-preview.png`. The original event counts, choice effects and insertion positions are unchanged. No commit or push.

Editorial checks: optional episode-2 night dialogue now follows the keepsake discussion rather than a premature goodnight; episode-6 letters still precede the household departure discussion; episode-10 optional echoes retain their original insertion positions. Confession text moved into `episodes-data.js`, with the existing completion callback still committing the route only after the dialogue is read. The cinematic OP retains the title call and gives the expanded exchange separate shots (about one minute total).
