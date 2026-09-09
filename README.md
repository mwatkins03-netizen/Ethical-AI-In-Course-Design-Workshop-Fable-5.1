# Cases in Practice

A sixty-minute faculty workshop on AI in course design, assessment, and grading/feedback, as a static, no-build website that doubles as each attendee’s worksheet and take-home.

**Created by Marc Watkins, Emily Donahue, and Danielle Clevenger · AI Institute & CETL, University of Mississippi.**

- **Landing page**: looped ambient video above five illustrated step cards (SVG art made for this workshop in the *Teaching for Discernment* style), drawn with that site’s WebGL card renderer (hover lift, tilt, paper-bend shaders). Drag, Shift+scroll, or arrow-key through them; opening one wipes to that step.
- **Choose your table** (course design / assessment / grading & feedback), then the **agenda** with per-segment start/pause timers.
- **Three ways to respond**: Talk it through (analog, print a case as a discussion sheet), Type it here, or Record my voice. A site-wide default plus a Talk / Type / Record switch on every response pane.
- **Step 1** introductions, curiosities, concerns; **Step 2** case study on the left, response pane on the right, side by side; **Step 3** debrief; **Step 4** guiding-principles builder; **Step 5** export.
- **Stored on your device only**: header chip, hero badge, callouts, recorder notes, export header. No server, accounts, or analytics; localStorage + IndexedDB only.
- **Every response field can be spoken**: Record a spoken response → audio saved on-device (IndexedDB) → optional live transcription into the editable text box (browser Web Speech API).
- **Export** as a self-contained HTML file with recordings embedded, print-to-PDF, or plain text.
- **Accessibility**: WCAG 2.1 AA target for ADA Title II; keyboard-operable deck and rail, motion toggle, AA contrast, labeled fields, live-region status for timers and recorders, accessibility statement under About. axe-core: 0 violations.
- **Facilitator guide** and **About, accessibility & AI disclosure** panels.

**Brand**: University of Mississippi palette from the UM Brand Portal (Lyceum #CF142B, Oxford #142142, Magnolia, Powder Blue #006BA6, Faulkner #F8EDD9 paper, Tupelo/Landshark accents) and brand typefaces IBM Plex Sans + IBM Plex Serif via Google Fonts (Matrole, Handelson One, Termina are licensed and not embedded).

All content lives in `js/data.js` (case text verbatim from the planning document; no attendee counts are published). No dependencies; deploy the folder to GitHub Pages as-is (`.nojekyll` included). Microphone recording requires HTTPS or localhost, which GitHub Pages provides. See `AI-DISCLOSURE.md`.
