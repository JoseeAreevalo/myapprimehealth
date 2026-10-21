import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

export function initNative() {
  if (!Capacitor.isNativePlatform()) return;

  void StatusBar.setStyle({ style: Style.Dark });
  if (Capacitor.getPlatform() === 'android') {
    void StatusBar.setOverlaysWebView({ overlay: true });
  }
  void SplashScreen.hide();

  // Boton "atras" de Android: navega en el historial y sale solo en la raiz.
  void App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) window.history.back();
    else void App.exitApp();
  });
}
