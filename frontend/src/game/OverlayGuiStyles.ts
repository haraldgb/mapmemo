/** Shared positioning for the overlay GUI row. */
export const s_overlayGUI_row =
  'pointer-events-none absolute top-4 left-2 sm:left-4 right-2 sm:right-4 z-10 flex sm:flex-row flex-col-reverse items-center gap-1 sm:gap-3'

/** Left slot — used by both the click-mode prompt and the name-mode input. */
export const s_overlayGUI_left =
  'pointer-events-auto min-w-0 sm:flex-1 flex justify-center'

/** Right slot — score/timer in GameHUD, empty spacer in GameUI. */
export const s_overlayGUI_right =
  'pointer-events-auto min-h-0 min-w-0 flex items-center justify-center gap-3'

/** Shared height for overlay GUI items (prompt, input container, score, timer). */
export const s_overlayGUI_item = 'h-8'
