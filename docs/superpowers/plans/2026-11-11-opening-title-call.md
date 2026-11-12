# Opening and Title Call

User correction: the new home/town explanation is the first scene, but a separate opening and title call must precede it. Implement this directly in the existing game, inline without subagents or automatic commits.

Use the approved cover illustration to keep the two characters recognizable. A short sequence moves from the snow road to the town's lights and the pair, then a full title card, then the first morning at home. Text establishes the setting and their shared return home without revealing the lights' origin. Use the existing opening music. This is an animated illustrated opening, not a voiced title call.

- [x] Add failing tests for film → title card → home, skip, timer cancellation and interrupted-film resume. Existing saves must remain unchanged.
- [x] Add `opening-film.js` and `opening-film.css`, a dedicated full-screen layer, keyboard/button controls and reduced-motion support.
- [x] Integrate the film ahead of `playOpening`, save `openingPrelude` only while needed, and validate it on restore. Hide gameplay controls until the film ends.
- [x] Run the complete suite; browser-check the film/title/home transition and save behavior on the separate preview origin; sync the local Git export without pushing.

Verification: canonical and exported games both passed 82 tests with no failures. Export diff whitespace check passed and the seven changed game files matched SHA-256. Browser checks on port 4174 confirmed chapter-1 film start, pause/manual advance, interrupted-film replay, full title call and transition to the first home dialogue; warning/error logs were empty. Fixed an observed focus-scroll issue with `overflow:clip` and focus without scrolling. Saved `outputs/opening-title-call-preview.png`; left the title card paused as a deliverable. The port-4173 ongoing play was untouched. No commit or push.
