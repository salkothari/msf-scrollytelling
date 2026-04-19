// Scroll helpers built on scrollama (loaded via CDN in index.html).
// Each helper returns the scroller instance so callers can .destroy() if needed.

/**
 * Fires `onProgress(p)` with p in [0, 1] as the user scrolls through `selector`.
 * Uses a single scrollama step covering the full element with offset: 1.
 */
function onSectionProgress(selector, onProgress, opts) {
  opts = opts || {};
  if (typeof scrollama === 'undefined') {
    console.warn('[scroll.js] scrollama not loaded; ' + selector + ' will not animate');
    return null;
  }
  var scroller = scrollama();
  scroller
    .setup({
      step: selector,
      offset: opts.offset != null ? opts.offset : 1,
      progress: true,
    })
    .onStepProgress(function (response) {
      onProgress(response.progress);
    });
  window.addEventListener('resize', scroller.resize);
  return scroller;
}

/**
 * Fires callbacks when `selector` enters/exits the viewport crossing `offset`
 * (0 = top of viewport, 0.5 = middle, 1 = bottom). Returns the scroller.
 */
function onSectionEnter(selector, onEnter, onExit, offset) {
  if (typeof scrollama === 'undefined') return null;
  var scroller = scrollama();
  scroller
    .setup({ step: selector, offset: offset != null ? offset : 0.5 })
    .onStepEnter(function (r) { onEnter && onEnter(r); })
    .onStepExit(function (r) { onExit && onExit(r); });
  window.addEventListener('resize', scroller.resize);
  return scroller;
}

window.onSectionProgress = onSectionProgress;
window.onSectionEnter = onSectionEnter;
