# FolkNet V2 — Accessibility audit (2026-10-25)

**Scope:** Development preview only. No V1 or NTNU original/course-file modification. This document is a measured accessibility work log, **not** a WCAG 2.2 AA conformance statement or a physical-device accessibility certificate.

## Automated browser coverage

- Existing whole-site route and horizontal-overflow Chrome matrix: **28 routes** at 320px and 390px, **9 selected routes** at 768px.
- New keyboard/drawer regression: portfolio, courses, Engineering Hydro and Settings at **320, 390 and 768px**. Confirms a real keyboard-focusable bypass, matching focus target, accessible names, mobile off-canvas `inert`/`aria-hidden`, `aria-expanded`, Escape, click-away, focus return and desktop panel availability.
- New **24-route** semantic inventory at **390 and 768px**: visible interactive controls without names, visible images without `alt`, duplicate HTML IDs, missing main landmarks. Each detected issue now fails CI. This is a bounded DOM heuristic and does not reproduce the full accessibility tree or assistive-technology behavior.
- CSS: sitewide `prefers-reduced-motion` for CSS animations/transitions and visible skip/focus indicators in `forced-colors` mode. Canvas/WebGL animation is **not** fully covered by these CSS overrides.

## Measured findings and code fixes

The first route-inventory CI run (before fixes) found:

| Viewport | Observed issues | Concrete finding | Remediation |
| --- | ---: | --- | --- |
| 390px | 3 | Three unnamed crystal replication inputs (`crystal-nx`, `crystal-ny`, `crystal-nz`) | Explicit accessible labels in `src/tools/crystal-viewer.js` |
| 768px | 5 | Same 3 crystal inputs, plus unlabeled `component-filter` in Engineering and Hydro | Labels in crystal viewer and `src/app.js` |

Also found during code review: off-screen mobile Engineering drawers could still be reached through keyboard/assistive technology. `src/shell/workspace-drawers.js` now applies `inert` plus `aria-hidden` while a mobile panel is closed, updates expanded state and restores focus on dismissal. Desktop resize removes these restrictions.

**Acceptance status:** Initial 49-step CI passed with the inventory in reporting mode and measured the issues above. The latest-head follow-up CI [run 40214399727](https://github.com/TorMT/FolkNettside-v2/actions/runs/40214399727) passed **all 49 steps** after the four label fixes. Zero-rule checks returned **0 heuristic issues across 24 routes at 390px** and **0 across the same 24 routes at 768px**. PR [#119](https://github.com/TorMT/FolkNettside-v2/pull/119) was merged as `38e5521b493efa1ecb00d8234c2c73404d780039`. Manual acceptance gates below remain open.

## Important limits / remaining manual acceptance

Automated Chrome at CSS widths is **not a physical Android/iPhone**. DOM labels and ARIA checks do **not** substitute for real VoiceOver, TalkBack, NVDA/JAWS or a full WCAG audit. Forced-colors and high-contrast appearances are not yet visually inspected in their native OS implementations.

Manual acceptance should include:
1. iOS Safari + VoiceOver and Android Chrome + TalkBack: reading order, main landmarks, headings, menus, file viewers, dialogs, focus restoration, slider/number labels, map and 3D canvas fallbacks.
2. Native hardware at 320/390/768 equivalent widths, landscape, 200%/400% zoom and increased font size. Check bottom navigation, scrolling, live dropdowns and interactive controls.
3. Windows High Contrast/forced colors and each light/dark/Theme Studio palette; measured foreground/background contrast (WCAG AA thresholds: 4.5:1 normal text and 3:1 large text and non-text UI boundaries where applicable), focus visibility and hover semantics.
4. Reduce Motion enabled while using 3D/KISSsoft/CAD and animated engineering visualizations. CSS motion is limited; GPU/canvas requestAnimationFrame behavior needs direct testing.
5. Large PDF, DOCX, deep NTNU directory, huge model and low-memory handset performance. Avoid publishing or copying student/private resources to reproduce a test.

The issue B18 remains **partial** until the manual gates and systematic contrast/zoom review are complete. A green CI result only validates the automated checks above.


## 2026-10-25 — High contrast and motion Settings follow-up

[PR #122](https://github.com/TorMT/FolkNettside-v2/pull/122), merge `1640542a04c1c9e758413331a75c8552b3371f34`.

**Measured issue:** Settings already persisted `contrast=high` and `motion=reduced`, but the stylesheet had no `[data-contrast]` or `[data-motion]` visual rules. The former OS-based reduced-motion media query did not respond to a user's explicit in-app choice.

**Fix:** CSS high-contrast text/border tokens in light and dark mode, keyboard focus rings on controls, readable dark-mode accent ink and dark accent-soft swatches. The explicit reduced-motion preference now limits CSS transitions/animations independently of system preferences, and selecting `system` restores normal CSS transitions where the OS setting permits them.

**Chrome acceptance:** [CI run 40215966024](https://github.com/TorMT/FolkNettside-v2/actions/runs/40215966024) passed all 49 regression steps. Browser checks at **320, 390 and 768px** each verified all **10 combinations** of light/dark × five bundled accent palettes; sampled high-contrast text tokens on panel/recessed surfaces at **≥4.5:1**, strong borders at **≥3:1**, white text on accent buttons at **≥4.5:1**, and saved Settings after a reload. Explicit reduced motion was verified against computed transition duration, then reset to system.

**Limits:** This is a bounded common-token and browser-style acceptance test, **not** full WCAG 2.2 conformance, full Theme Studio image/custom-palette audit or a claim that WebGL/canvas animations stop. Native Windows forced-colors, screen readers, 200–400% zoom and real low-memory phones still require separate testing.


## 2026-10-25 — Custom Theme Studio contrast safety

[PR #124](https://github.com/TorMT/FolkNettside-v2/pull/124), merged `520fc612140469f3fd3baf73d69bf0fca2dc4fec`.

**Observed before fix:** Theme Studio's legacy preview and generated CSS assumed white text for the navbar, sidebar and button even on white/light custom palettes. Main theme text was chosen using average RGB brightness instead of WCAG relative luminance. Extremely contrasting two-ended navbar gradients could not have a single readable foreground.

**Changes:** `src/settings/theme-studio-core.js` now computes relative luminance and contrast ratios in linear sRGB, selects accessible text colors for the generated navbar/sidebar/primary button, main/secondary/muted text, and contrast-adjusted primary headings/links. When a gradient contains conflicting bright/dark endpoints, the **preview and generated CSS gradient** use nearest contrast-corrected endpoints, leaving the original color selection and JSON palette unchanged. An eight-item preview report presents measured ratios and explains automatic adjustments. Colors and CSS-selector theme names are validated before output. This does not install a custom runtime theme or modify existing global Settings.

**Acceptance:** Latest-head [CI run 40217316066](https://github.com/TorMT/FolkNettside-v2/actions/runs/40217316066) **50/50 steps passed**. Node tests cover known WCAG numerical pairs, adversarial bright/dark/midgray palettes, preserved source/JSON, and safe CSS selectors. Chrome exercised manual and image-mode preview at **320, 390 and 768px**, confirming eight visible passing text pairs, correctly corrected navbar gradient and preserved editor values.

**Limits:** The 4.5:1 test refers to sampled *generated preview text*; it is not a full UI or imported-CSS contrast audit. Users may still export color variables for other arbitrary downstream selectors, images and 3D canvases; they need individual evaluation. Theme Studio remains a generator, separate from Settings's built-in accent presets. Native forced-colors, physical mobile screen readers, zoom and third-party viewers remain open manual B18 gates.


## 2026-10-25 — CAD and Model Inspector zoom-width / keyboard reflow

[PR #127](https://github.com/TorMT/FolkNettside-v2/pull/127), merge `9f227c0035f93c85f02e5f4d20c40d9e9f0b2afb`.

**Issues found:** The advanced STL/3MF Model Inspector hid all component-selection buttons at narrow widths, leaving mouse/canvas selection as the only route. Its fixed-height viewer grid did not account for keyboard guidance and downstream results. The CAD workbench's mobile drawer lacked focus restoration/Escape/ARIA-hidden state coordination. During Chrome testing at 320 CSS px, the CAD native file input retained a browser intrinsic width of ~278px, generating horizontal overflow (316px content versus a 305px usable viewport after scrollbar).

**Fixes:** Model Inspector now exposes a scrollable, named-button component list below the canvas at narrow widths, wraps long nested component names, reflows its stage and results, and includes visible keyboard shortcut text linked with `aria-describedby`. Hydro results have a region name, status changes are announced and Measure exposes `aria-pressed`. The compact CAD controls now mark closed content `inert`/`aria-hidden`, keep `aria-expanded` consistent, focus available controls when opening, restore opener focus on Escape/closing, and synchronize on breakpoint changes. Wave motion controls and native file chooser are width-constrained rather than clipping their contents.

**Acceptance:** Latest-head [Chrome/Node CI run 40218979471](https://github.com/TorMT/FolkNettside-v2/actions/runs/40218979471) passed **50/50 steps**. New real-Chrome regression passed at **320, 390 and 768 CSS px**, testing example STL/3D scene, long component names, keyboard focus/fit shortcut, Measure toggle, visible mobile component panel, CAD demo mobile disclosure, Escape/focus and absence of whole-document horizontal overflow. First test runs failed on an actual 320px file-input width issue, which was corrected and retested.

**Limits:** CSS width reductions act as zoom-equivalent reflow checks, **not** a direct native 200%/400% browser zoom session. The test did not use physical iPhone/Android hardware or VoiceOver/TalkBack; large or damaged proprietary models, canvas semantics and low-memory GPU behavior still need direct acceptance. No V1 or NTNU source files were touched.
