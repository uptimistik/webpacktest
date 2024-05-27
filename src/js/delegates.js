export function defineDelegates (engine) {
  const loadingElement = document.getElementById('gse-loading');

  return {
    // LIFECYCLE DELEGATES
    onLoadingBegin: function() {
      engine.showOverlay();
      loadingElement.style.visibility = 'visible';
    },

    onLoadingEnd: function() {
      loadingElement.style.visibility = 'hidden';
      engine.hideOverlay();
    },

    onGameReady: async function () {
      const userLocale =
        (navigator.languages && navigator.languages.length)
          ? navigator.languages[0]
          : navigator.language;
      const [language, location] = userLocale.split('-');
      engine.postEvent('localeDetected', null, location || 'US', language);
      engine.relayout();
    },

    onWindowResize: function() {
      engine.relayout();
    },

    onSceneAboutToChange: function (sceneKey, sceneName, adType) {
      // Scene name is always blank, but we're stuck passing it for legacy purposes.
      if (adType == '1') {
        console.log('Showing interstitail ad.');
      }
      if (adType == '2') {
        console.log('Showing rewared ad.');
        /*
        Promise.resolve().then((rewardName, rewardValue) => {
          engine.postEvent('giveAdReward', null, rewardName, rewardValue);
        })
        */
      }
    },

    onCurrentSceneChanged: function(sceneKey, sceneName) {
      // Do something after the scene has changed.
      // For instance if you want to send data to a server after a specific scene change
    },
    
    onEndGame: function() {
      console.log(`We're in the end game now.`)
    },

    // EXTERNAL SERVICE DELEGATES
    onShowBannerShow: function(position)  {
      console.log(`Show a banner at ${position}`)
    },

    onTweetSheet: async function(msg, image) {
      console.log('Tweetsheet Msg:', msg, image)

      // When GameSalad Ask to Load an Image from a URL.
      if (msg.indexOf('gsLoadImage:') === 0) {
        const uri = msg.slice('gsLoadImage:'.length);
        engine.postEvent('loadExternalImage', null, image, uri);
        return;
      }

      // Example of other things you could do:
      if (msg.indexOf('analytics:') == 0) {
        const event = msg.replace('analytics:');
        console.log('Record analytics events:', event, ':', image);
        return;
      }

      // This examples shows getting data from an API using fetch
      // Then updating an attribute based on that response data.
      /*
      if (msg.indexOf('getApiValue:') == 0) {
        fetch(url).then(async (resp) => {
          const data = resp.json()
          engine.postEvent('externalWriteGameAttribute', null, 'game.attributes.attributeid', data.updateValue)
        })
      }
      */

      // Not doing anything else special? Then this is an actual tweet request! 
      // Assumes image is a url to a page or an image.
      window.open(`http://www.twitter.com/share?text=${encodeURIComponent(msg)}&url=${encodeURIComponent(image)}`);
    },

    onLogDebuggingStatement: function (text, entity) {
      console.log(`[${entity}] ${text}`);
    },

    // IN APP PURCHASE DELEGATES

    //  Return a promise that rejects if the purchase fails and resolves with the following json object: {buyerCancelled: (true || false), purchaseComplete: (true || false)}.
    //  itemInfo: {itemID, consumable, name, price, state}. 
    onIAPBuyItem: function (itemInfo) {
      return Promise.resolve({ purchaseComplete: true });
    },

    // Returns a promise. Resolves with purchases object. 
    // Purchases is an array of objects containing the key itemID for all items purchased.
    onIAPRestoreItems: function () {
      return Promise.resolve([{ itemID: 'ItemId' }]);
    },

    // Return a promise that rejects if the purchase fails and resolves if the purchase is a success.
    // itemInfo: {itemID, consumable, name, price, state}. 
    onIAPConsumeItem: function (itemInfo) {
      return Promise.resolve();
    },

    // Promise that resolves successful with itemInfo (see onIAPBuyItem) or rejects unsuccessfully.
    // State is currently ignored, you'll need to get Restore Items to update state.
    onIAPRequestPurchaseData() {
      return Promise.resolve([{ itemID: 'ItemId', consumable: false, name: 'Item Name', price: 1000 }])
    },

    // GAME SERVICE DELEGATES
    // Called when Game Service Login is triggered.
    // Return a promise. When promise resolves, Platform Connected will be set to true.

    // Here you'd call the SDK or a server to start a player session.
    // You could track user state information outside of the game in varable you defined above
    // or you could send a message to the game to update a table with the user info.
    // Not a delegate function but putting ther to get the "this" context.
    // When game ask for "Game Center Login"
    onGameCenterLogin: async function () {
      console.log('Logging in to leadeboard');
      return true;
    },

    // No promise, just do what you will with the score and leaderboard name.
    // Here we're storing the score temporarily in map for latter submission
    onGameCenterPostScore: function (score, leaderboard) {
      console.log(`Posting score ${score} to ${leaderboard}`);
    },

    // Called when the Show Achievements action is triggered.

    // EXAMPLE: pause game, show an alert representing the game UI, unpause game after dimissed.
    onGameCenterShowAchievements: async function () {
      // In this case we want to pause the game while the UI is shown. 
      // You don't have to do this, it really depends on your game.
      gse.pause();

      // Promise represents showing the UI an the promise resolves when the UI is hidden.
      // The SDK you are integrating with might not do this.
      Promise.resolve().then((result) => {
        gse.unpause();
      })
    },

    // Called when the Reset Achievements action is triggered.
    onGameCenterResetAchievements: function () {
      console.log('Resetting achievements.')
    },

    // Called when Update Achievement is called.
    // Unlike the native engine, percentageComplete can be a string or a number.
    // So you can ignore the convention of the value being a percentage and use it to send
    // an absolute value or an instructions like 'increment:value'
    onGameCenterUpdateAchievement: function (identifier, percentageComplete) {
      // console.log('Update user achievement:', identifier, percentageComplete)
      if (percentageComplete === 100) {
        const ach = new Set(gameSession.achievements)
        ach.add(parseInt(identifier, 10))
        gameSession.achievements = Array.from(ach)
      }
    },

    // Called when Show Leaderboard action is triggered.
    
    // EXAMPLE: pause game, show an alert representing the game UI, unpause game after dimissed.
    onGameCenterShowLeaderboard: async function (identifier) {
      // console.log(`Showing leaderboard UI for: ${identifier}`)
      // In this case we want to pause the game while the UI is shown. 
      // You don't have to do this, it really depends on your game.
      gse.pause();
      // Promise represents showing the UI an the promise resolves when the UI is hidden.
      // The SDK you are integrating with might not do this.
      Promise.resolve().then((result) => {
        gse.unpause();
      })
    },

    // DATA LOADING DELEGATES

    // For all of these:

    // If your delegate returns anything but undefined, the default behavior will be skipped. 
    // You can use this to do things in addition to saving data to local storage,
    // or you can skip storing the table to local storage the data elsewhere like a server.

    // Or you can do something else completely like using a certain table
    // to pass information to a servers for analytics, login, or a player turn.

    // defaultFunction is a function that performs the default save/load behavior, in case you want 
    // to make sure the data is saved to local storage before you do your own thing.

    // Intercept Save Table Action

    // EXAMPLE: doesn't save table to local storage if the table key is 'some table known key'
    onSaveTable: function(key, table, defaultFunction) {
      console.log(`Saving table ${key} with data `, table)
      if (key == 'some table known key') {
        console.log(`Skipping saivng ${key} to local storage.`)
        return true; // Skips saving the table to local storage.
      }
    },

    // Intercept Save Attribute Action. 

    // EXAMPLE: doesn't save attribute to local storage if the table key is 'some known attribute key'
    onSaveAttribute: function(key, value, defaultFunction) {
      // console.log(`Saving attribute ${key} with data `, value)
      if (key == 'some known attribute key') {
        console.log(`Skipping saivng ${key} to local storage.`)
        return true; // Skips saving the table to local storage.
      }

      // Promise represents some async action we want to do before saving attribute in the standard way.
      const saveAfterAsyncAction = false;
      if (saveAfterAsyncAction) {
        Promise.resolve().then(() => {
          console.log('Thing is done, now save value')
          defaultFunction();
          console.log(`${value} has been stored to ${key}`)
        })
        return true;
      }

      // Doing none of the above give an undefined return and save attribute works like normal.
    },

    // Intercept Load Attribute Action. 

    // EXAMPLE: calls the default load function.  if the key is 'some special key', log a message to the console.
    onLoadAttribute: function(key, defaultFunction) {
      if (defaultFunction) {
        defaultFunction();// Let's load the data from local storage first.
      }

      if (key == 'some special key') {
        console.log('Saw special key, do something speical.');
      }
    },
  }
}
