# Mobile layout

The mobile site is the same application and content model as desktop. It is not a separate mobile build.

## Breakpoint strategy

Primary mobile shell: `max-width: 760px`.

### Global shell
- Desktop navigation is replaced by a fixed bottom navigation:
  - Projects
  - Courses
  - Engineering
  - Search
- Settings remains available from the top bar.
- Touch targets should be at least roughly 38–44 CSS px where practical.
- Safe-area insets are respected for the bottom navigation.

### Portfolio
- One-column hero and project list.
- Project details become a single-column case-study layout.
- Media remains full-width.

### Courses
- Semester tabs scroll horizontally.
- Course sidebar is removed on mobile.
- Nested resource folders remain intact.
- Resource rows are touch-sized.

### Viewer
- File content gets the available viewport.
- The desktop metadata side panel is hidden.
- Toolbar remains horizontally scrollable.
- 3D component sidebar is hidden; the model itself remains interactive.

### Engineering workspace
- Mode tabs scroll horizontally.
- Main viewport and result panel remain visible.
- Component tree and property inspector become slide-in drawers.
- Mobile actions open those drawers.
- No separate engineering implementation is maintained.

### Tools
- Inputs/results stack to one column.
- Periodic Table remains horizontally scrollable because compressing 18 groups into phone width would make it unusable.
- Crystal structures keep the shared Three.js renderer and touch orbit controls.

## Developer preview

Route:

`#/mobile-preview`

The preview embeds the actual application at 390 × 844 CSS pixels and can switch between Portfolio, Courses, Engineering and Tools.
