# B18 — Physical-device and native zoom acceptance protocol

**Status: NOT EXECUTED.** These are acceptance procedures for the owner or a tester with real hardware, not claims that an AI agent ran VoiceOver, TalkBack, native browser zoom or low-memory GPU testing. V1 and NTNU originals must not be changed. Use approved synthetic/demo CAD data only when recording evidence.

## Build and evidence

1. Open the actual GitHub Pages preview on the device; record the preview commit/hash from GitHub Actions. Confirm the latest successful `deploy-pages-preview` run is for that commit before interpreting any failed behavior.
2. Keep the test record limited to device family, OS/browser version, viewport class, route, action, expected outcome and pass/fail. Never attach private NTNU resources, medical data or login credentials.
3. Test at both default appearance and **Settings → Appearance → Contrast: High; Motion: Reduced**. Restore normal settings afterward.

## Native browser zoom — desktop

Use desktop Chrome, Firefox and/or Edge's **browser zoom menu** (not devtools responsive width). At **200%** and **400%** on a desktop 1280px-wide window:

- Visit `#/courses`, `#/settings`, `#/engineering/cad` and `#/tools/model-inspector`. Verify primary controls stay present, top and bottom navigation is usable, headings/long filenames wrap and no horizontal **page** scrolling is required to use essential functions. Scrolling within an explicitly scrollable CAD component list is acceptable.
- On CAD select the synthetic demo, open tools, use Fit, choose one assembly component, close with Escape and verify focus returns to the correct button. Select a local approved STL if available. Confirm opening/closing does not lose the 3D canvas.
- On Model Inspector load the synthetic wedge example, select a component using Tab + Enter, focus canvas and press F, and find the hydro result cards. A component list must remain available at 400%.
- With keyboard only, check skip-to-content, mobile More menu, focus indicator and return. Confirm enlarged native file input still accepts a local file.

Record any overlapping, missing or unreachable content with a reproducible route + zoom level. **Do not** equate the CI's iframe CSS-zoom simulation with this test.

## iOS Safari / VoiceOver

Enable VoiceOver under iOS Accessibility, then open the Pages preview in Safari.

- Navigate **Portfolio → Courses → Model Inspector** by VoiceOver swipe/rotor and via visible mobile bottom navigation. Check top-level landmarks/headings, skip control, current page and More menu; dismiss with the provided action.
- Open CAD synthetic demo. Ensure the CAD canvas has a meaningful name/instructions and that the **Vis CAD-verktøy** disclosure reports expanded/collapsed and exposes only visible controls. Select a component from the list, use Fit and return to the prior position.
- Check that closing drawers restores keyboard/screen-reader navigation rather than leaving focus on invisible controls. Repeat in landscape and with increased text size (Accessibility → Display & Text Size).
- Check whether a useful textual alternative is available for measurements when 3D canvas selection cannot be done by VoiceOver alone. **Record as a limitation if it is not**; a named canvas is not equivalent to fully accessible 3D manipulation.

## Android Chrome / TalkBack

Enable TalkBack in Android Accessibility, open the preview in Chrome, and repeat the iOS route, disclosure, component selection and focus-flow tests using TalkBack gestures.

- Test Android's larger font/display settings, TalkBack navigation by controls/headings, open/close of CAD tools and screen rotation.
- Confirm no disabled/inert offscreen components are announced or keyboard-focusable while a mobile CAD/Engineering drawer is closed.
- Check status announcements during local example load, import success/failure and optional unavailable features without requiring cloud sign-in.

## Low-memory and large-file stress

Use a device on which the owner has permission to test. Begin with synthetic wedge/CAD demo, then an approved **local non-sensitive** STL/3MF of roughly 5 MiB and optionally a larger, permitted model. Do not use medical records, course submissions, private CAD or student files as test artifacts.

- Record file type, byte size, facet/component count if known, approximate load time, ability to orbit/fit, response during resize/orientation, and whether repeated open/close causes freezes or abnormal memory warnings.
- Verify a load failure communicates an error without blanking navigation, preserves the local-file option, and does **not** upload the file to a cloud service.
- On low-memory phones, repeat load/close cycles and record browser reload/crash or severe input latency. Chrome CI's 4.77 MiB / 100k-triangle sample is a desktop synthetic baseline, **not** a mobile acceptance measurement.

## Acceptance matrix

| Gate | Current status | Required evidence to close |
| --- | --- | --- |
| Chrome CSS zoom simulation 200/400 | Automated Chrome CI passed, PR #133 | No hardware evidence required; does not prove native zoom |
| Native browser zoom 200/400 | NOT RUN | Browser/OS/version + routes checked + screenshots/issues |
| iOS VoiceOver | NOT RUN | Physical iPhone/iPad, Safari, screen-reader flow results |
| Android TalkBack | NOT RUN | Physical Android, Chrome, screen-reader flow results |
| Native high contrast/forced colors | NOT RUN | OS forced-colors appearance with keyboard focus and controls |
| Large synthetic STL on desktop Chrome | Automated Chrome CI passed, PR #133 | No physical-device claim |
| Low-memory mobile / representative large models | NOT RUN | Device, permitted model size, load/latency/stability notes |

B18 remains **partial** until the missing manual gates are performed and documented.
