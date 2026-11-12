# Connected Battle Animations and Visible Conditions

User asks for smoother, more satisfying attack/spell animation, shorter-lived messages, damage above the actual heads of enemies/heroes, and visibly distinct conditions. Keep the approved quarter view, battle rules and existing character identities. Work inline without subagents or automatic commits/push.

Diagnosis: `showMessage` rebuilds the battlefield for every low-level log line and waits a fixed 1250 ms each time. Action announcement, ice melting and damage are separate pauses. Numbers are children of the moving/shaking sprite body at 25% height. Command tags remain during results. Ice/break are small text labels, chill is mainly a weak tint, and buff has no persistent field treatment.

Implementation:

- [x] Write failing tests for grouping action events, scheduled impact/skip/cancellation, final-state preservation, condition expiry and head anchors.
- [x] Group each action's existing events into one presentation beat; preserve the battlefield DOM across the result sequence. Commit HP/status at impact, and settle immediately when the player skips. Cancel old timers when restarting/changing encounters.
- [x] Add staged windup/travel/impact/recovery, curved spell trails, short action captions and independent head-level number popups. Remove lingering result command tags and duplicate numerical message text.
- [x] Show ice shells, stagger stars, frost, sword light and guarding with field overlays and labeled icons. Clear expired conditions from final authoritative state. Respect reduced motion.
- [x] Verify full tests and rendered attack/spell/support/status/skip flows, sync the Git export and leave a working preview with a screenshot.

## Verified result

- Canonical game and Git export: 93 tests passed, 0 failed. Export copies of all six changed game files match SHA-256 hashes; git diff --check passed.
- Browser: slash, fire, area magic, healing, ice break, cold cure, stagger, consumed sword buff, fast-forward, encounter switching and victory/reset verified. No console warnings or errors.
- Head number placement measured above enemy and hero figures. Old effects and captions clear after playback. Reduced-motion emulation and a 375px viewport checked, then restored.
- Visible preview left open at http://127.0.0.1:4175/battle-preview.html. Screenshots: outputs/battle-attack-polished.png, outputs/battle-magic-impact.png and outputs/battle-effects-polished.png.
- No commit or push performed.

No new raster assets or dependencies are required; use the approved battle atlas and code-native particles/overlays.

Additional fix from visual-state review: the core used to emit the damage snapshot before assigning break or consuming sword light. Move those bookkeeping operations into an after-damage callback before emitting the snapshot, preserving the damage calculation and final rules. A regression test first failed with break=0 instead of 2, then passed; the browser subsequently showed stagger on the exact 14-damage impact and consumed both bonuses on the later 45-damage impact.
