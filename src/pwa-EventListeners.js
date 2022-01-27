export const pwaTrackingListeners = () => {
    const fireAddToHomeScreenImpression = event => {
        event.userChoice.then(choiceResult => {});
      //This is to prevent `beforeinstallprompt` event that triggers again on `Add` or `Cancel` click
      window.removeEventListener("beforeinstallprompt", fireAddToHomeScreenImpression);
    };
    window.addEventListener("beforeinstallprompt", fireAddToHomeScreenImpression);
    
    //Track web app install by user
    window.addEventListener("appinstalled", event => {
    });
  
    //Track from where your web app has been opened/browsed
    window.addEventListener("load", () => {      
    });
  };