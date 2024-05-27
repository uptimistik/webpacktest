import '@/styles/index.scss'
import { defineDelegates } from '@/js/delegates';

function muteOnPageHidden () {
  function onVisibilityChanged() {
    if (!gse) {
      return
    }

    if (document.hidden || document.mozHidden || document.webkitHidden || document.msHidden)
      gse.setGameVolume(engine, 0);
    else
      gse.setGameVolume(engine, 1);
  };
  document.addEventListener("visibilitychange", onVisibilityChanged, false);
  document.addEventListener("mozvisibilitychange", onVisibilityChanged, false);
  document.addEventListener("webkitvisibilitychange", onVisibilityChanged, false);
  document.addEventListener("msvisibilitychange", onVisibilityChanged, false);
}

window.onEngineLoad = function(path) {
  gse.ready((engine) => {
    const delegates = defineDelegates(engine);
    engine.appendDelegates(delegates);
    if (delegates.onWindowResize) {
      window.addEventListener('resize', delegates.onWindowResize, false);
    }

    // Pause and resume on page visibility change.
    muteOnPageHidden();

    // Set the div target for the game.
    engine.setRenderFrame('gse-player');

    // Resize based on window size.
    engine.setOptions({
      'viewport-reference': 'window',
      'viewport-fit': 'letterbox'
    });

    engine.loadOptionsFromURL(); // Load and playback options from the page URL.
    engine.play(path); // Load the game from the path specified.
  })
}
