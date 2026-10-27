(function() {
  'use strict';

  const agente_usuario_electron = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Discord/1.0.0 Chrome/120.0.0.0 Electron/28.0.0 Safari/537.36';

  try {
    Object.defineProperty(navigator, 'userAgent', {
      get: function() {
        return agente_usuario_electron;
      },
      configurable: true
    });

    Object.defineProperty(navigator, 'platform', {
      get: function() {
        return 'Win32';
      },
      configurable: true
    });

    console.info('[quintana.dev | AutoQuest] Suplantación de User-Agent activa:', agente_usuario_electron);
  } catch (error) {
    console.error('[quintana.dev | AutoQuest] Error al anular el User-Agent:', error);
  }
})();
