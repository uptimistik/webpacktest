import '@/styles/index.scss';
import { defineDelegates } from '@/js/delegates';
import { TonConnectUI } from '@tonconnect/ui';

function muteOnPageHidden(engine) {
  function onVisibilityChanged() {
    if (!gse) {
      return;
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

function initializeTonConnectUI() {
  try {
    const tonConnectUI = new TonConnectUI({
      manifestUrl: './tonconnect-manifest.json', // Relative path to the manifest file
      buttonRootId: 'ton-connect',
      uiOptions: {
        twaReturnUrl: 'https://t.me/PachinkoAdmin_bot'
      }
    });

    // Function to connect to the wallet
    async function connectToWallet() {
      try {
        const connectedWallet = await tonConnectUI.connectWallet();
        console.log('Connected Wallet:', connectedWallet);

        if (!connectedWallet) {
          throw new Error('Wallet was not connected');
        }
      } catch (error) {
        console.error('Error connecting to wallet:', error);
      }
    }

    // Call to connect to the wallet when the game starts
    connectToWallet();

  } catch (error) {
    console.error('Error initializing TON Connect UI:', error);
  }
}

function sendLoadingStatus(value) {
  const { parent } = window;
  const payload = {
    playdeck: {
      method: 'loading',
      value: value,
    },
  };
  parent.postMessage(payload, '*');
}

function initializePlayDeckListeners() {
  window.addEventListener('message', ({ data }) => {
    if (!data || !data.playdeck) return;

    const pdData = data.playdeck;

    switch (pdData.method) {
      case 'play':
        if (gse.state === 'PAUSED') {
          gse.resume();
        } else {
          gse.play();
        }
        break;
      case 'pause':
        gse.pause();
        break;
      case 'isOpen':
        window.playdeckIsOpen = pdData.value;
        break;
      case 'getUser':
        window.playdeckUser = pdData.value;
        break;
      case 'getScore':
        window.playdeckScore = pdData.value;
        break;
      case 'getUserLocale':
        window.userLocale = pdData.value;
        break;
      default:
        console.log('Unknown PlayDeck message:', pdData);
    }
  });
}

function fetchUserProfile() {
  const { parent } = window;
  parent.postMessage({ playdeck: { method: 'getUserProfile' } }, '*');
}

function fetchUserLocale() {
  const { parent } = window;
  parent.postMessage({ playdeck: { method: 'getUserLocale' } }, '*');
}

function saveData(key, value) {
  const { parent } = window;
  parent.postMessage({
    playdeck: {
      method: 'setData',
      key: key,
      value: value,
    },
  }, '*');
}

function fetchData(key) {
  const { parent } = window;
  parent.postMessage({
    playdeck: {
      method: 'getData',
      key: key,
    },
  }, '*');
}

function sendGameEnd() {
  const { parent } = window;
  parent.postMessage({ playdeck: { method: 'gameEnd' } }, '*');
}

function sendAnalytics(event) {
  const { parent } = window;
  parent.postMessage({
    playdeck: {
      method: 'sendAnalytics',
      value: event,
    },
  }, '*');
}

// New function to post the high score to PlayDeck
function postHighScoreToPlayDeck(score, force = false) {
  const { parent } = window;
  parent.postMessage({
    playdeck: {
      method: 'setScore',
      value: score,
      isForce: force,
    },
  }, '*');
  updateHighScoreBanner(score); // Update the banner with the new high score
}

// Function to update the high score banner
function updateHighScoreBanner(score) {
  const highScoreBanner = document.getElementById('high-score-banner');
  if (highScoreBanner) {
    highScoreBanner.textContent = `High Score: ${score}`;
  }
}

window.onEngineLoad = function(path) {
  gse.ready((engine) => {
    const delegates = defineDelegates(engine);

    // Add a delegate for posting high score
    delegates.onGameCenterPostScore = function(score, leaderboard) {
      console.log(`High score of ${score} posted to leaderboard ${leaderboard}`);
      postHighScoreToPlayDeck(score); // Post high score to PlayDeck
    };

    engine.appendDelegate(delegates);
    if (delegates.onWindowResize) {
      window.addEventListener('resize', delegates.onWindowResize, false);
    }

    // Pause and resume on page visibility change.
    muteOnPageHidden(engine);

    // Set the div target for the game.
    engine.setRenderFrame('gse-player');

    // Resize based on window size.
    engine.setOptions({
      'viewport-reference': 'window',
      'viewport-fit': 'letterbox'
    });

    // Create and append the high score banner
    const highScoreBanner = document.createElement('div');
    highScoreBanner.id = 'high-score-banner';
    highScoreBanner.style.position = 'fixed';
    highScoreBanner.style.top = '0';
    highScoreBanner.style.width = '100%';
    highScoreBanner.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    highScoreBanner.style.color = 'white';
    highScoreBanner.style.textAlign = 'center';
    highScoreBanner.style.padding = '10px';
    highScoreBanner.style.zIndex = '1000';
    highScoreBanner.textContent = 'High Score: 0';
    document.body.appendChild(highScoreBanner);

    // Dynamically create the ton-connect element
    const tonConnectDiv = document.createElement('div');
    tonConnectDiv.id = 'ton-connect';
    document.body.appendChild(tonConnectDiv);

    // Initialize TON Connect UI
    initializeTonConnectUI();

    // Initialize PlayDeck listeners
    initializePlayDeckListeners();

    // Fetch user profile and locale
    fetchUserProfile();
    fetchUserLocale();

    // Signal loading process to PlayDeck
    sendLoadingStatus(1);

    // Simulate loading process
    setTimeout(() => {
      sendLoadingStatus(100);
    }, 1000);

    engine.loadOptionsFromURL(); // Load and playback options from the page URL.
    engine.play(path); // Load the game from the path specified.
  });

  // Initialize Telegram WebApp
  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    console.log(tg.initDataUnsafe.user);
  } else {
    console.log("Telegram WebApp SDK not found or not running inside Telegram.");
  }
};
