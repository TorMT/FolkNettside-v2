# B09 — isolated parallel work

Started 2026-10-24 with owner authorization to take a separate task while another chat works on the catalog.

Branch: `work/b09-munin-mobile-isolated`.
Scope: real authorized Munin STEP → GLB candidate, dimension/geometry checks, then mobile preview only after acceptance.
Other active work observed: PR #112 (B02 crawler format parity). Do not modify that branch or its crawler files.

Confirmed source HTTP 200: `https://tormt.folk.ntnu.no/diverse/Njord/filer/MuninTing/NJ26_MUN_HULL_ASM_MASTER.step`, 39,308,913 bytes. Downloaded to isolated local scratch. Neither supplied nettsideFungerende.zip contains a filename matching NJ26_MUN_HULL_ASM_MASTER.

Existing converter was read from main. No application code changed, no GLB validated, no mobile acceptance or deployment claimed. Next step: run converter at 60 mm with existing size/triangle limits, inspect real geometry and dimensions, and only then propose viewer integration.

Keep V1 unchanged. Source STEP and unrelated archive content must not be committed. Update ACTIVE_WORK_HANDOFF after a tested PR, reconciling concurrent edits.
