# Viewer migration and parity review

This matrix is maintained against the old `TorMT/FolkNettside/includes/kodeLesere` source.
**The old website remains unchanged.** New viewers share `ViewerShell` and adapter
contracts (`render`, optional `cleanup`, `actions`). A successful preview
does not imply executable file support or CAD geometric certification.

| Legacy file/viewer | New v2 viewer | Implemented functions | Remaining compatibility gap |
| --- | --- | --- | --- |
| `pyview.html` / `run-lite.js` / `run-lite_worker.js` | `adapters/python.js`, disposable Pyodide Worker | Syntax view, line numbers, wrapping, editing, Run, Stop/reset, persistent session variables, stdout/stderr, Matplotlib PNG plots, saved generated CSV/PDF download, manually uploaded local modules/data, scratchpad in Tools | Automatic sibling-file discovery, interactive `input()` prompts, legacy custom NumPy/Matplotlib file path interception, arbitrary 3rd-party packages not shipped for Pyodide |
| `nbview.html` | `adapters/notebook.js` | Saved cell outputs, markdown cells (escaped), per-cell Run, Run all, Stop/reset, shared interpreter, plots | Jupyter kernels other than browser Python, notebook widget/output types outside supported text/PNG, persist edited notebook in original format |
| `codeview.html` | `adapters/text.js` | Highlighting for registered source languages, copying, finding, wrapping and line-number toggles | Rich language-server diagnostics and source execution for non-Python languages |
| `csvview.html` | `adapters/csv.js` | Delimited tables including CSV/TSV/PSV, quoted multiline data, search/filter, raw view, sticky headings and scroll | Spreadsheet formulas/evaluation (use XLSX viewer) |
| `latexview.html` | `adapters/latex.js` | LaTeX source/preview | Full remote TeX compilation is not bundled |
| `htmlview.html` | `adapters/html.js` | Sandboxed HTML preview, source view | External assets follow sandbox and CORS restrictions |
| `pdfview.html` | `adapters/pdf.js` | Embedded PDF viewer/download | Editing/annotation not part of browser adapter |
| `officeview.html` | `adapters/office.js` | DOCX, XLSX, PPTX preview | Complex Office animations, macro execution, editing and full Excel calculation unsupported |
| `stlview.html` / `3mfview.html` / `3mfhydro.html` | `model-workbench.js` + shared Three.js `model-scene.js` | Fit, orbit, axes, alignment, clipping, appearance, transparency, measurement, screenshot, **real hull-waterline intersection in world-space 3D**, uniform still-water plane, wave preview, wave collection | Full vessel stability from a non-watertight CAD view must use Hydro's separate validated geometry pipeline; cloud CAD conversion remains separate |
| `hydrostaticsview.html` | Engineering Hydro | Displacement, dV/dT checks, waterplane moments, inverse draft, equilibrium heel/trim, signed GZ, export and 3D waterline; numeric gates | Real vessel data/datum validation, waves/RAOs/dynamic response, free surface and regulatory stability sign-off |
| `fusionview.html` / `f3dview.html` / `fusionshareview.html` / `aps-viewer.html` | `adapters/fusion.js` and external-source links | F3Z embedded mesh when present; explicit conversion-required notice for F3D | Native F3D/Fusion/FBM conversion requires Autodesk APS service/authorization and CAD geometry source. It cannot be credibly reimplemented as a pure static site parser without supported conversion infrastructure. |
| video embeddings | `adapters/video.js`, `youtube.js` | In-browser playback and supported progress state | DRM/provider embeds controlled by provider |
| quizzes | `adapters/quiz.js` | Interactive practice | Course-specific unsupported quiz variants |

## Wave and waterline coordinates

The geometric contour is obtained from the actual triangle intersection with
the plane `world Z = zWaterline` using the same segment interpolation and
stitching primitives as Hydro. 3MF and STL source units and transforms are
applied before intersection. Lines are drawn in the Three.js scene at the
correct `(x,y,z)`, and are recomputed after model alignment and heel/trim
transform changes.

Wave preview uses **linear regular waves** `eta(x,y,t)=H/2*cos(k*s-omega*t+phase)`,
with `omega²=gk*tanh(kh)` in finite depth; headings and animation affect the
visible water surface in the scene. This is not a wave-load, RAO, vessel-motion
or diffraction/radiation calculation.

The wave collection supports generating synthetic probe histories, collecting
time series, CSV observations, export/import of provenance-marked library JSON,
individual CSV download and reapplying stored synthetic waves to 3D. Imported
single-point measured water levels remain **time series**, never silently
converted into a full 3D wave field.

## Engineering layout

Desktop tree, 3D viewport, inspector and result panels own independent
scrolling regions. The result pane can be resized by dragging or keyboard
arrows/Home and the Three.js canvas is constrained to that resizable viewport.
The status bar remains visible.

## Release criteria

1. Node syntax + full regression suite.
2. Real Chrome for desktop Engineering resizing and viewer matrix.
3. Real Pyodide browser execution (source, variables, input modules, Matplotlib
   plots, file outputs, Stop/reset).
4. Real WebGL wave/waterline test on an analytic block plus imported CSV/JSON.
5. Existing old-site and demo repositories remain unchanged.

**Status:** This phase is significant migration progress, but FULL legacy parity
is not complete while the gaps above remain open. Do not remove old viewer
fallbacks for those formats.
