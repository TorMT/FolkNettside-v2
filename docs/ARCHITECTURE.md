# FolkNettside v2 architecture

This repository is isolated from the existing production FolkNettside.

## Current direction

- one shared app shell
- Courses keeps Semester -> Course -> Resources
- Kok belongs inside Courses/course content
- Portfolio does not surface Kok or course archive details
- public browsing is default
- Google/Autodesk connections are optional
- theme controls live only under Settings

## Viewer redesign

`src/viewer.js` is one shared ViewerShell with adapters for:
- text/code/Markdown/Python
- CSV
- sandboxed HTML
- Jupyter Notebook
- PDF
- ASCII STL lightweight preview
- 3MF archive/object/build graph

This intentionally avoids separate HTML mini-apps per file type.

## Fixtures

All deterministic test files live under `examples/`. They contain no production course material.

The 3MF adapter uses one centralized JSZip dependency in the preview. A later production build should package/vendor it once rather than duplicate ZIP loaders.
