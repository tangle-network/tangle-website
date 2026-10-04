# Homepage component fixes

- Harness connections remain visible in compact layouts. Wide layouts retain scroll-drawn paths; endpoints follow the actual cards and Intelligence node on resize.
- The run uses Sandbox's maintained `AgentTimeline`. The waterfall uses the timing primitives extracted from Intelligence into `@tangle-network/charts@0.3.0` ([brand #211](https://github.com/tangle-network/brand/pull/211), [release #212](https://github.com/tangle-network/brand/pull/212)).
- Captured tool offsets/durations remain intact. Baseline output reports two failing tests; the tool itself completed successfully. No model spans or native TUI recording were invented.
- Quickstart scopes both canonical and legacy light-theme tokens. Selection uses dark text on opaque lavender. Action cards are passive, with official colored marks.

Verified on Beelink: frozen registry install, strict affected TypeScript, production build (121 pages). Charts package passed its focused timing/render tests and packed-export check. Base matched `5595aab3` at final verification.

Safari review of the production build covered the connected compact layout, actual timeline, waterfall/failure state, passive action cards, Python highlighting and selected-text contrast. Narrow layout was inspected through browser zoom; this is not a physical-phone test. Wide scroll-driven paths were observed mid-animation. Native interactive TUI capture remains separate work in [#226](https://github.com/tangle-network/tangle-website/issues/226).

| Before | After |
| --- | --- |
| [Unreadable code panel](homepage-before-theme.png) | [Python highlighting](homepage-after-python.png) |
| [Previous harness grid](homepage-harnesses-desktop.png) | [Connected compact layout](homepage-connected-tablet.png) |
| [Previous story](homepage-scroll-desktop.png) | [Shared timeline](homepage-shared-timeline.png) · [Shared waterfall](homepage-shared-waterfall.png) |
| [Previous action controls](homepage-actions-desktop.png) | [Passive action cards](homepage-passive-actions.png) |
