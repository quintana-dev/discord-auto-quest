chrome.runtime.onInstalled.addListener(() => {
  console.info('[quintana.dev | AutoQuest] Extensión instalada correctamente');
});

chrome.runtime.onMessage.addListener((solicitud, remitente, enviar_respuesta) => {
  if (solicitud.accion === 'obtener_version' || solicitud.action === 'getVersion') {
    const manifiesto = chrome.runtime.getManifest();
    enviar_respuesta({ version: manifiesto.version });
    return false;
  } else if (solicitud.accion === 'ejecutar_codigo_misiones' || solicitud.action === 'executeQuestCode') {
    if (remitente.tab && remitente.tab.id) {
      const manifiesto = chrome.runtime.getManifest();
      chrome.scripting.executeScript({
        target: { tabId: remitente.tab.id },
        func: (version) => { window.__VERSION_MISIONES = version; },
        args: [manifiesto.version],
        world: 'MAIN'
      }).then(() => {
        return chrome.scripting.executeScript({
          target: { tabId: remitente.tab.id },
          files: ['quest-code.js'],
          world: 'MAIN'
        });
      }).then(() => {
        enviar_respuesta({ exito: true, success: true });
      }).catch((error) => {
        console.error('[quintana.dev | AutoQuest] Error al inyectar código de misiones:', error);
        enviar_respuesta({ exito: false, success: false, error: error.message });
      });
      return true;
    } else {
      enviar_respuesta({ exito: false, success: false, error: 'No se encontró el identificador de pestaña (tabId)' });
      return false;
    }
  }
});
