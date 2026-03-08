import { Browser } from '@capacitor/browser';

window.onload = async () => {
  await Browser.open({
    url: 'https://www.tgu-shop.com',
    presentationStyle: 'fullscreen'
  });
};