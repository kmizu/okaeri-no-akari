# Quarter-View Turn Battle

User request: replace the front-facing Dragon Quest-like battle presentation with an angled, party-visible quarter view reminiscent of turn-based SaGa/FF. Keep the existing two-command turn system, costs, cooperation, enemies and save compatibility. Execute inline, no subagents, no automatic commit/push.

Party stands right/front, foes left/back on a snowy diagonal path. Use newly generated, reference-matched transparent Touma/Nina battle poses and an illustrated winter clearing. Put commands, messages and party status along the bottom so the battlefield remains visible. Highlight the current actor and selected target. Allow clicking field targets as well as menu targeting.

Attackers move toward their actual targets; spells travel from caster to target; hits/heals attach to battlefield figures. Preserve the existing event-by-event HP snapshots, distinguishing identical enemies, redirected attacks and cover. Add optional presentation actor IDs to battle events without changing effect objects or saves. Respect reduced-motion preferences.

- [x] Write failing tests for correct actor attribution across damage, healing, cover, team attacks and counters.
- [x] Add battle assets and prompt/provenance notes. Rebuild BattleUI's scene and bottom HUD; retain command flow and keyboard controls.
- [x] Wire battlefield target highlighting/clicks and attacker/defender animations; show all three encounters in the standalone preview.
- [x] Run full tests; browser-play normal and boss turns, targeting/cancel/results and check layout; synchronize the local Git export without pushing.

Verification:

- The new attribution tests failed before implementation, then passed. The complete suite passed 86/86 with no failures, including final exported code. Exported ten changed files matched SHA-256; `git diff --check` passed.
- Browser preview: all three encounters rendered; field targeting on enemy B worked; a full attack/fire turn defeated B and returned to turn 2. Touma's actual animated movement toward B was visually observed. Back from Nina cleared the selected Touma command. Boss guard then protect/heal turns correctly showed 111 → 120 → 104 HP on Touma while Nina stayed at 90.
- Browser size 375 × 812: the boss, party, commands and both status cards fit without clipping. Reset the temporary viewport afterwards. Reduced-motion rules are implemented but a native reduced-motion setting was not exercised.
- Actual main game at isolated port 4176: new opening → board → forest → battle, reload before the encounter, two attack/fire turns → victory → normal exploration and the next objective, with exploration music restored. Original port-4175 saves were untouched. The QA main-game tab was closed.
- Both browser flows had no warning/error console logs. Left the standalone battle preview available at port 4175, with screenshot `outputs/quarter-battle-preview.png`.
- New party atlas and terrain are built-in generated images, stored in the game and documented with exact prompts, original paths, alpha statistics and hashes in `assets/BATTLE-ART-NOTES.md`. No new dependencies, commit or push.
