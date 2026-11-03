# Discord AutoQuest

Extensión de navegador (Manifest V3) para automatizar y completar las misiones de Discord sin tener que abrir juegos ni hacer streaming real. 

El proyecto surgió para investigar cómo funciona el cliente web de Discord por dentro y saltear las restricciones que te obligan a usar la app de escritorio o streamear juegos que consumen muchos recursos.

---

## Cómo funciona por dentro

En vez de hacer clics simulados o scraping en el DOM (que se rompe a cada rato), la extensión interactúa directo con los componentes internos de Discord en memoria:

1. **Bypass de headers (Red):** Con `declarativeNetRequest` cambiamos el `User-Agent` de las peticiones a Discord para que los servidores crean que venimos del cliente de escritorio oficial en Windows (Electron).
2. **Override del entorno (DOM):** Antes de que cargue la app, en `document_start` sobreescribimos `navigator.userAgent` y `navigator.platform` a `Win32` en el contexto principal (`MAIN` world).
3. **Hook a Webpack:** Interceptamos el array global `webpackChunkdiscord_app` para cargar módulos internos que ya están en memoria. De ahí sacamos los stores de Flux (`QuestsStore`, `ChannelStore`) y el cliente HTTP autenticado.
4. **Simulación de actividad:** Con los stores ya enganchados, simulamos los heartbeats de streaming de voz o la visualización de videos según lo que pida cada misión activa.
5. **Panel flotante:** Inyecta un menú oscuro integrado a la interfaz de Discord con pestañas para ver las misiones disponibles, forzar el completado y ver los logs en tiempo real.

---

## Estructura del proyecto

- `manifest.json`: Configuración de Manifest V3 y permisos necesarios.
- `rules.json`: Reglas de red para modificar los headers de User-Agent.
- `user-agent-override.js`: Inyección inicial para spoofear la plataforma en el navegador.
- `background.js`: Service worker que se encarga de inyectar el script principal en la pestaña.
- `quest-code.js`: El motor que hace el hook a Webpack, lee las misiones y manda los heartbeats.
- `quest-home.js`: La interfaz flotante (HUD) inyectada en Discord.
- `assets/`: Íconos de la extensión.

---

## Instalación en modo desarrollador

1. Clonar este repo:
   ```bash
   git clone https://github.com/quintana-dev/discord-auto-quest.git
   ```
2. Abrir Chrome e ir a `chrome://extensions/`.
3. Activar el interruptor **Modo de desarrollador** (arriba a la derecha).
4. Hacer clic en **Cargar descomprimida** y seleccionar esta carpeta.
5. Entrar a [Discord Web](https://discord.com/app).
6. Va a aparecer el botón flotante en la esquina inferior derecha para abrir el panel y completar las misiones.

---

## Disclaimer

Este proyecto fue desarrollado con fines educativos y de investigación sobre la arquitectura interna de aplicaciones Electron y Single Page Applications. No está afiliado ni respaldado por Discord.
