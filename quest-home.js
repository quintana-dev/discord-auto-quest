(function() {
  'use strict';

  let panel_abierto = false;
  let pestana_activa = 'misiones'; // 'misiones' | 'registro' | 'diagnostico'
  const cache_estado_misiones = new Map();
  const registros_actividad = [];
  const max_registros = 100;

  const TEMA = {
    fuente: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    fuente_mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fondo_panel: '#0c0c11',
    fondo_tarjeta: '#08080c',
    fondo_consola: '#060608',
    borde_panel: '#20202d',
    borde_tarjeta: '#181824',
    morado_primario: '#8b5cf6',
    morado_hover: '#7c3aed',
    boton_secundario: '#15151e',
    boton_secundario_hover: '#20202c',
    texto_blanco: '#ffffff',
    texto_subtitulo: '#94a3b8',
    texto_etiqueta: '#cbd5e1',
    texto_apagado: '#64748b',
    verde_exito: '#10b981',
    amarillo_aviso: '#f59e0b',
    rojo_error: '#ef4444',
    azul_insignia: '#60a5fa',
    fondo_azul_insignia: '#1e1b4b'
  };

  const ESTILOS = {
    disparador_flotante: `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      background: ${TEMA.fondo_panel};
      color: ${TEMA.texto_blanco};
      border: 1px solid ${TEMA.borde_panel};
      border-radius: 8px;
      padding: 9px 14px;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
      font-family: ${TEMA.fuente};
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;
      user-select: none;
      transition: background 0.15s ease, border-color 0.15s ease;
    `,
    panel: `
      position: fixed;
      bottom: 68px;
      right: 20px;
      z-index: 9999;
      background: ${TEMA.fondo_panel};
      color: ${TEMA.texto_blanco};
      border: 1px solid ${TEMA.borde_panel};
      border-radius: 12px;
      padding: 18px;
      width: 360px;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.8);
      font-family: ${TEMA.fuente};
      box-sizing: border-box;
    `,
    resumen_grid: `
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 14px;
    `,
    resumen_caja: `
      background: ${TEMA.fondo_tarjeta};
      border: 1px solid ${TEMA.borde_tarjeta};
      border-radius: 6px;
      padding: 8px 6px;
      text-align: center;
    `,
    resumen_numero: `
      font-size: 16px;
      font-weight: 800;
      color: #ffffff;
      font-family: ${TEMA.fuente_mono};
    `,
    resumen_titulo: `
      font-size: 10px;
      font-weight: 600;
      color: ${TEMA.texto_apagado};
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-top: 2px;
    `,
    pestanas_contenedor: `
      display: flex;
      background: ${TEMA.fondo_tarjeta};
      border: 1px solid ${TEMA.borde_tarjeta};
      border-radius: 6px;
      padding: 2px;
      margin-bottom: 12px;
      gap: 2px;
    `,
    pestana_boton: `
      flex: 1;
      padding: 6px 4px;
      font-size: 11px;
      font-weight: 700;
      text-align: center;
      cursor: pointer;
      border: none;
      border-radius: 4px;
      background: transparent;
      color: ${TEMA.texto_apagado};
      transition: all 0.15s ease;
      font-family: ${TEMA.fuente};
    `,
    pestana_activa: `
      background: #1a1a26;
      color: #ffffff;
    `,
    contenedor_vistas: `
      min-height: 140px;
      max-height: 220px;
      overflow-y: auto;
      margin-bottom: 14px;
      box-sizing: border-box;
    `,
    tarjeta_mision: `
      background: ${TEMA.fondo_tarjeta};
      border: 1px solid ${TEMA.borde_tarjeta};
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 8px;
    `,
    consola_registro: `
      background: ${TEMA.fondo_consola};
      border: 1px solid ${TEMA.borde_tarjeta};
      border-radius: 6px;
      padding: 10px;
      height: 140px;
      overflow-y: auto;
      font-family: ${TEMA.fuente_mono};
      font-size: 11px;
      line-height: 1.5;
      color: #cbd5e1;
    `,
    boton_primario: `
      width: 100%;
      background: ${TEMA.morado_primario};
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 12px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      cursor: pointer;
      font-family: ${TEMA.fuente};
      transition: background 0.15s ease;
      display: block;
      text-align: center;
      box-sizing: border-box;
    `,
    boton_secundario: `
      width: 100%;
      background: ${TEMA.boton_secundario};
      color: ${TEMA.texto_blanco};
      border: 1px solid ${TEMA.borde_panel};
      border-radius: 8px;
      padding: 9px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      cursor: pointer;
      margin-top: 8px;
      font-family: ${TEMA.fuente};
      transition: background 0.15s ease, border-color 0.15s ease;
      display: block;
      text-align: center;
      box-sizing: border-box;
    `
  };

  function inyectar_estilos_base() {
    if (document.getElementById('qdev-estilos-base')) return;
    const estilo = document.createElement('style');
    estilo.id = 'qdev-estilos-base';
    estilo.textContent = `
      #qdev-vista-contenedor::-webkit-scrollbar,
      #qdev-consola-log::-webkit-scrollbar {
        width: 4px;
      }
      #qdev-vista-contenedor::-webkit-scrollbar-thumb,
      #qdev-consola-log::-webkit-scrollbar-thumb {
        background: #252535;
        border-radius: 4px;
      }
    `;
    document.head.appendChild(estilo);
  }

  function agregar_registro(mensaje, nivel = 'info') {
    const ahora = new Date();
    const hora_str = ahora.toTimeString().split(' ')[0];
    registros_actividad.push({ hora: hora_str, mensaje: mensaje, nivel: nivel });
    if (registros_actividad.length > max_registros) {
      registros_actividad.shift();
    }
    actualizar_vista_registro();
  }

  function crear_boton_flotante() {
    if (!window.location.pathname.includes('/quest-home')) {
      eliminar_elementos();
      return;
    }

    if (document.getElementById('DiscordQuestButton')) return;

    inyectar_estilos_base();

    const disparador = document.createElement('div');
    disparador.id = 'DiscordQuestButton';
    disparador.style.cssText = ESTILOS.disparador_flotante;

    disparador.innerHTML = `
      <span>quintana<span style="color: #a855f7;">.dev</span></span>
      <span style="color: #64748b;">|</span>
      <span style="color: #cbd5e1;">AutoQuest</span>
    `;

    disparador.addEventListener('mouseenter', () => {
      disparador.style.background = '#14141d';
      disparador.style.borderColor = '#38384d';
    });

    disparador.addEventListener('mouseleave', () => {
      disparador.style.background = TEMA.fondo_panel;
      disparador.style.borderColor = TEMA.borde_panel;
    });

    disparador.addEventListener('click', alternar_panel);

    document.body.appendChild(disparador);

    if (panel_abierto) {
      renderizar_panel();
    }
  }

  function calcular_metricas() {
    const total = cache_estado_misiones.size;
    let completadas = 0;
    let segundos_restantes = 0;

    cache_estado_misiones.forEach(mision => {
      const progreso = mision.progreso !== undefined ? mision.progreso : (mision.progress || 0);
      const objetivo = mision.objetivo !== undefined ? mision.objetivo : (mision.target || 0);
      const esta_completa = mision.completado || mision.completed || (progreso >= objetivo && objetivo > 0);

      if (esta_completa) {
        completadas++;
      } else {
        segundos_restantes += Math.max(0, objetivo - progreso);
      }
    });

    const minutos_est = Math.ceil(segundos_restantes / 60);

    return {
      total: total,
      completadas: completadas,
      tiempo_str: total === 0 ? '--' : (segundos_restantes === 0 ? '0 min' : `~${minutos_est}m`)
    };
  }

  function actualizar_resumen_metricas() {
    const metricas = calcular_metricas();
    const el_total = document.getElementById('qdev-metrica-total');
    const el_completadas = document.getElementById('qdev-metrica-completadas');
    const el_tiempo = document.getElementById('qdev-metrica-tiempo');

    if (el_total) el_total.textContent = metricas.total;
    if (el_completadas) el_completadas.textContent = `${metricas.completadas}/${metricas.total}`;
    if (el_tiempo) el_tiempo.textContent = metricas.tiempo_str;
  }

  function renderizar_panel() {
    if (document.getElementById('DiscordQuestPanel')) return;

    const panel = document.createElement('div');
    panel.id = 'DiscordQuestPanel';
    panel.style.cssText = ESTILOS.panel;

    // 1. Cabecera
    const cabecera = document.createElement('div');
    cabecera.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;';
    cabecera.innerHTML = `
      <div style="font-size: 16px; font-weight: 800; letter-spacing: -0.2px;">
        quintana<span style="color: #a855f7;">.dev</span>
      </div>
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${TEMA.verde_exito};"></span>
        <span style="background: ${TEMA.fondo_azul_insignia}; color: ${TEMA.azul_insignia}; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px;">
          WIN32 ELECTRON
        </span>
      </div>
    `;
    panel.appendChild(cabecera);

    // 2. Título
    const titulo_bloque = document.createElement('div');
    titulo_bloque.style.cssText = 'margin-bottom: 12px;';
    titulo_bloque.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 18px; font-weight: 800; color: #ffffff;">AutoQuest</span>
        <span style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 4px; padding: 1px 6px; font-size: 10px; font-weight: 800;">v1.0.0</span>
      </div>
      <div style="font-size: 12px; color: ${TEMA.texto_subtitulo}; margin-top: 2px;">
        Control y monitoreo en vivo de misiones Discord
      </div>
    `;
    panel.appendChild(titulo_bloque);

    // 3. Mini Dashboard de Estadísticas
    const metricas = calcular_metricas();
    const resumen = document.createElement('div');
    resumen.style.cssText = ESTILOS.resumen_grid;
    resumen.innerHTML = `
      <div style="${ESTILOS.resumen_caja}">
        <div id="qdev-metrica-total" style="${ESTILOS.resumen_numero}">${metricas.total}</div>
        <div style="${ESTILOS.resumen_titulo}">Detectadas</div>
      </div>
      <div style="${ESTILOS.resumen_caja}">
        <div id="qdev-metrica-completadas" style="${ESTILOS.resumen_numero}">${metricas.completadas}/${metricas.total}</div>
        <div style="${ESTILOS.resumen_titulo}">Listas</div>
      </div>
      <div style="${ESTILOS.resumen_caja}">
        <div id="qdev-metrica-tiempo" style="${ESTILOS.resumen_numero}">${metricas.tiempo_str}</div>
        <div style="${ESTILOS.resumen_titulo}">Restante</div>
      </div>
    `;
    panel.appendChild(resumen);

    // 4. Selector de Pestañas
    const pestanas = document.createElement('div');
    pestanas.style.cssText = ESTILOS.pestanas_contenedor;
    pestanas.innerHTML = `
      <button id="qdev-tab-misiones" style="${ESTILOS.pestana_boton} ${pestana_activa === 'misiones' ? ESTILOS.pestana_activa : ''}">MISIONES</button>
      <button id="qdev-tab-registro" style="${ESTILOS.pestana_boton} ${pestana_activa === 'registro' ? ESTILOS.pestana_activa : ''}">REGISTRO EN VIVO</button>
      <button id="qdev-tab-diagnostico" style="${ESTILOS.pestana_boton} ${pestana_activa === 'diagnostico' ? ESTILOS.pestana_activa : ''}">DIAGNÓSTICO</button>
    `;
    panel.appendChild(pestanas);

    // 5. Contenedor Dinámico de Vistas
    const contenedor_vistas = document.createElement('div');
    contenedor_vistas.id = 'qdev-vista-contenedor';
    contenedor_vistas.style.cssText = ESTILOS.contenedor_vistas;
    panel.appendChild(contenedor_vistas);

    // Eventos de Pestañas
    pestanas.querySelector('#qdev-tab-misiones').addEventListener('click', () => cambiar_pestana('misiones'));
    pestanas.querySelector('#qdev-tab-registro').addEventListener('click', () => cambiar_pestana('registro'));
    pestanas.querySelector('#qdev-tab-diagnostico').addEventListener('click', () => cambiar_pestana('diagnostico'));

    // 6. Botón Principal (TOMAR MISIONES)
    const boton_primario = document.createElement('button');
    boton_primario.id = 'qdev-boton-primario';
    boton_primario.style.cssText = ESTILOS.boton_primario;
    boton_primario.textContent = 'TOMAR MISIONES';

    boton_primario.addEventListener('mouseenter', () => {
      boton_primario.style.background = TEMA.morado_hover;
    });

    boton_primario.addEventListener('mouseleave', () => {
      boton_primario.style.background = TEMA.morado_primario;
    });

    boton_primario.addEventListener('click', manejar_ejecucion_misiones);
    panel.appendChild(boton_primario);

    // 7. Botón Secundario (CERRAR)
    const boton_cerrar = document.createElement('button');
    boton_cerrar.style.cssText = ESTILOS.boton_secundario;
    boton_cerrar.textContent = 'CERRAR PANEL';

    boton_cerrar.addEventListener('mouseenter', () => {
      boton_cerrar.style.background = TEMA.boton_secundario_hover;
      boton_cerrar.style.borderColor = '#38384d';
    });

    boton_cerrar.addEventListener('mouseleave', () => {
      boton_cerrar.style.background = TEMA.boton_secundario;
      boton_cerrar.style.borderColor = TEMA.borde_panel;
    });

    boton_cerrar.addEventListener('click', alternar_panel);
    panel.appendChild(boton_cerrar);

    document.body.appendChild(panel);

    actualizar_contenido_vista();
  }

  function cambiar_pestana(nombre_pestana) {
    pestana_activa = nombre_pestana;
    const tab_m = document.getElementById('qdev-tab-misiones');
    const tab_r = document.getElementById('qdev-tab-registro');
    const tab_d = document.getElementById('qdev-tab-diagnostico');

    if (tab_m) tab_m.style.cssText = `${ESTILOS.pestana_boton} ${pestana_activa === 'misiones' ? ESTILOS.pestana_activa : ''}`;
    if (tab_r) tab_r.style.cssText = `${ESTILOS.pestana_boton} ${pestana_activa === 'registro' ? ESTILOS.pestana_activa : ''}`;
    if (tab_d) tab_d.style.cssText = `${ESTILOS.pestana_boton} ${pestana_activa === 'diagnostico' ? ESTILOS.pestana_activa : ''}`;

    actualizar_contenido_vista();
  }

  function actualizar_contenido_vista() {
    const contenedor = document.getElementById('qdev-vista-contenedor');
    if (!contenedor) return;

    if (pestana_activa === 'misiones') {
      if (cache_estado_misiones.size === 0) {
        contenedor.innerHTML = `
          <div style="background: ${TEMA.fondo_tarjeta}; border: 1px solid ${TEMA.borde_tarjeta}; border-radius: 8px; padding: 18px; text-align: center; color: ${TEMA.texto_apagado}; font-size: 12px; font-family: ${TEMA.fuente_mono};">
            <div>[ESTADO: EN ESPERA]</div>
            <div style="margin-top: 6px; font-size: 11px;">Haz clic en <b>TOMAR MISIONES</b> para iniciar el escaneo y completar tareas.</div>
          </div>
        `;
      } else {
        contenedor.innerHTML = '';
        cache_estado_misiones.forEach(mision => {
          contenedor.appendChild(crear_elemento_mision(mision));
        });
      }
    } else if (pestana_activa === 'registro') {
      contenedor.innerHTML = `
        <div id="qdev-consola-log" style="${ESTILOS.consola_registro}">
          ${generar_html_logs()}
        </div>
        <div style="display: flex; gap: 6px; margin-top: 6px;">
          <button id="qdev-btn-copiar-log" style="flex: 1; background: #15151e; border: 1px solid #252535; color: #94a3b8; padding: 4px; font-size: 10px; border-radius: 4px; cursor: pointer; font-weight: 600;">COPIAR REGISTRO</button>
          <button id="qdev-btn-limpiar-log" style="background: #15151e; border: 1px solid #252535; color: #94a3b8; padding: 4px 8px; font-size: 10px; border-radius: 4px; cursor: pointer; font-weight: 600;">LIMPIAR</button>
        </div>
      `;
      const btn_copiar = contenedor.querySelector('#qdev-btn-copiar-log');
      const btn_limpiar = contenedor.querySelector('#qdev-btn-limpiar-log');

      if (btn_copiar) {
        btn_copiar.addEventListener('click', () => {
          const texto = registros_actividad.map(r => `[${r.hora}] ${r.mensaje}`).join('\n');
          navigator.clipboard.writeText(texto || 'Registro vacío');
          btn_copiar.textContent = '¡COPIADO!';
          setTimeout(() => { btn_copiar.textContent = 'COPIAR REGISTRO'; }, 1500);
        });
      }

      if (btn_limpiar) {
        btn_limpiar.addEventListener('click', () => {
          registros_actividad.length = 0;
          actualizar_vista_registro();
        });
      }

      const consola = contenedor.querySelector('#qdev-consola-log');
      if (consola) consola.scrollTop = consola.scrollHeight;
    } else if (pestana_activa === 'diagnostico') {
      contenedor.innerHTML = `
        <div style="background: ${TEMA.fondo_tarjeta}; border: 1px solid ${TEMA.borde_tarjeta}; border-radius: 8px; padding: 12px; font-family: ${TEMA.fuente_mono}; font-size: 11px; line-height: 1.6; color: #cbd5e1;">
          <div style="color: #a855f7; font-weight: 700; margin-bottom: 6px;">// DIAGNÓSTICO DEL SISTEMA</div>
          <div>• <b>Spoofing User-Agent:</b> <span style="color: #34d399;">Discord/1.0.0 (Win32)</span></div>
          <div>• <b>Contexto ejecutor:</b> <span style="color: #34d399;">MAIN (Página real)</span></div>
          <div>• <b>Almacén Webpack:</b> <span style="color: #34d399;">Conectado</span></div>
          <div>• <b>Misiones en cola:</b> ${cache_estado_misiones.size}</div>
          <div>• <b>Modo de red:</b> Directo (Sin proxies externos)</div>
          <div>• <b>URL actual:</b> ${window.location.pathname}</div>
        </div>
      `;
    }
  }

  function generar_html_logs() {
    if (registros_actividad.length === 0) {
      return '<div style="color: #555;">// Esperando eventos de ejecución...</div>';
    }
    return registros_actividad.map(r => {
      let color = '#cbd5e1';
      if (r.nivel === 'exito') color = '#34d399';
      if (r.nivel === 'error') color = '#ef4444';
      if (r.nivel === 'advertencia') color = '#f59e0b';
      return `<div><span style="color: #64748b;">[${r.hora}]</span> <span style="color: ${color};">${r.mensaje}</span></div>`;
    }).join('');
  }

  function actualizar_vista_registro() {
    if (pestana_activa !== 'registro') return;
    const consola = document.getElementById('qdev-consola-log');
    if (consola) {
      consola.innerHTML = generar_html_logs();
      consola.scrollTop = consola.scrollHeight;
    }
  }

  function crear_elemento_mision(mision) {
    const el = document.createElement('div');
    el.id = `qdev-mision-${mision.id}`;
    el.style.cssText = ESTILOS.tarjeta_mision;

    const progreso = mision.progreso !== undefined ? mision.progreso : (mision.progress || 0);
    const objetivo = mision.objetivo !== undefined ? mision.objetivo : (mision.target || 0);
    const completada = mision.completado || mision.completed || (progreso >= objetivo && objetivo > 0);
    const tipo_tarea = mision.tipo_tarea || mision.taskType || 'DESKTOP';
    const nombre = mision.nombre || mision.name || 'Misión Discord';
    const porcentaje = objetivo > 0 ? Math.min(100, Math.round((progreso / objetivo) * 100)) : (completada ? 100 : 0);

    el.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <span style="font-weight: 700; font-size: 12px; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;" title="${nombre}">${nombre}</span>
        <span style="font-family: ${TEMA.fuente_mono}; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 700; ${completada ? 'background: rgba(16, 185, 129, 0.2); color: #34d399;' : 'background: rgba(139, 92, 246, 0.2); color: #c084fc;'}">
          ${completada ? 'LISTO ✓' : `${porcentaje}%`}
        </span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 11px; font-family: ${TEMA.fuente_mono}; color: ${TEMA.texto_apagado}; margin-bottom: 6px;">
        <span>${tipo_tarea}</span>
        <span>${progreso}/${objetivo}s</span>
      </div>
      <div style="width: 100%; height: 4px; background: rgba(255, 255, 255, 0.08); border-radius: 2px; overflow: hidden;">
        <div style="height: 100%; width: ${porcentaje}%; background: ${completada ? TEMA.verde_exito : TEMA.morado_primario}; transition: width 0.3s ease;"></div>
      </div>
    `;

    return el;
  }

  function manejar_ejecucion_misiones() {
    const boton = document.getElementById('qdev-boton-primario');

    if (typeof chrome === 'undefined' || !chrome.runtime) {
      if (boton) boton.textContent = 'ERROR DE EXTENSIÓN';
      agregar_registro('Error: chrome.runtime no disponible', 'error');
      return;
    }

    if (boton) {
      boton.textContent = 'EJECUTANDO...';
      boton.disabled = true;
      boton.style.opacity = '0.7';
    }

    agregar_registro('Enviando solicitud de inyección al Service Worker...', 'info');

    chrome.runtime.sendMessage({ accion: 'ejecutar_codigo_misiones', action: 'executeQuestCode' }, (respuesta) => {
      if (boton) {
        boton.disabled = false;
        boton.style.opacity = '1';
      }

      if (chrome.runtime.lastError || !respuesta || (!respuesta.exito && !respuesta.success)) {
        if (boton) boton.textContent = 'ERROR';
        agregar_registro(`Fallo al ejecutar código: ${chrome.runtime.lastError?.message || 'Error desconocido'}`, 'error');
        setTimeout(() => {
          if (boton) boton.textContent = 'TOMAR MISIONES';
        }, 2000);
      } else {
        if (boton) boton.textContent = 'EN PROGRESO';
        agregar_registro('Código ejecutor inyectado en el contexto principal', 'exito');
        setTimeout(() => {
          if (boton) boton.textContent = 'TOMAR MISIONES';
        }, 2000);
      }
    });
  }

  function alternar_panel() {
    panel_abierto = !panel_abierto;
    if (panel_abierto) {
      renderizar_panel();
    } else {
      const panel = document.getElementById('DiscordQuestPanel');
      if (panel) panel.remove();
    }
  }

  function eliminar_elementos() {
    const boton = document.getElementById('DiscordQuestButton');
    if (boton) boton.remove();
    const panel = document.getElementById('DiscordQuestPanel');
    if (panel) panel.remove();
    const estilos = document.getElementById('qdev-estilos-base');
    if (estilos) estilos.remove();
  }

  window.addEventListener('message', ({ source, data }) => {
    if (source !== window || !data) return;
    if (data.prefijo !== 'DISCORD_COMPLETADOR_MISIONES' && data.prefix !== 'DISCORD_COMPLETADOR_MISIONES') return;

    const tipo = data.tipo || data.type;
    const datos = data.datos || data.data;

    if (tipo === 'EVENTO_LOG') {
      agregar_registro(datos.mensaje, datos.nivel);
    } else if (tipo === 'LISTA_MISIONES' || tipo === 'QUEST_LIST') {
      cache_estado_misiones.clear();
      datos.forEach(mision => cache_estado_misiones.set(mision.id, mision));
      actualizar_resumen_metricas();
      if (pestana_activa === 'misiones') actualizar_contenido_vista();
    } else if (tipo === 'ACTUALIZACION_MISION' || tipo === 'QUEST_UPDATE') {
      cache_estado_misiones.set(datos.id, datos);
      actualizar_resumen_metricas();
      if (pestana_activa === 'misiones') {
        const item_existente = document.getElementById(`qdev-mision-${datos.id}`);
        if (item_existente) {
          item_existente.replaceWith(crear_elemento_mision(datos));
        } else {
          actualizar_contenido_vista();
        }
      }
    }
  });

  function inicializar() {
    crear_boton_flotante();

    let url_anterior = window.location.href;
    new MutationObserver(() => {
      const url_actual = window.location.href;
      if (url_actual !== url_anterior) {
        url_anterior = url_actual;
        crear_boton_flotante();
      }
    }).observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
  } else {
    inicializar();
  }
})();
