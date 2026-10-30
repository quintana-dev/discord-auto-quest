(function() {
  'use strict';

  function esperar_webpack(devolucion_llamada) {
    const intervalo_verificacion = 100;
    const intentos_maximos = 100;
    let intentos = 0;

    const verificar = () => {
      if (intentos >= intentos_maximos) return;

      if (typeof window.webpackChunkdiscord_app === 'undefined') {
        intentos++;
        setTimeout(verificar, intervalo_verificacion);
        return;
      }

      try {
        const jquery_original = window.$;
        delete window.$;

        const webpack_require = window.webpackChunkdiscord_app.push([[Symbol()], {}, (require) => require]);
        window.webpackChunkdiscord_app.pop();

        if (jquery_original) window.$ = jquery_original;

        if (!webpack_require || !webpack_require.c || Object.keys(webpack_require.c).length < 10) {
          intentos++;
          setTimeout(verificar, intervalo_verificacion);
          return;
        }

        devolucion_llamada(webpack_require);
      } catch (error) {
        intentos++;
        setTimeout(verificar, intervalo_verificacion);
      }
    };

    verificar();
  }

  function buscar_modulo(webpack_require, filtro) {
    for (const modulo of Object.values(webpack_require.c)) {
      if (modulo?.exports) {
        const exportaciones = modulo.exports;
        if (exportaciones.A && filtro(exportaciones.A)) return exportaciones.A;
        if (exportaciones.Ay && filtro(exportaciones.Ay)) return exportaciones.Ay;
        if (exportaciones.ZP && filtro(exportaciones.ZP)) return exportaciones.ZP;
        if (filtro(exportaciones)) return exportaciones;
      }
    }
    return null;
  }

  function emitir_registro(mensaje, nivel = 'info') {
    const ahora = new Date();
    const tiempo_str = ahora.toTimeString().split(' ')[0];
    enviar_actualizacion('EVENTO_LOG', {
      mensaje: mensaje,
      nivel: nivel,
      hora: tiempo_str
    });
  }

  function enviar_actualizacion(tipo, datos) {
    window.postMessage({
      prefijo: 'DISCORD_COMPLETADOR_MISIONES',
      prefix: 'DISCORD_COMPLETADOR_MISIONES',
      tipo: tipo,
      type: tipo,
      datos: datos,
      data: datos
    }, '*');
  }

  async function ejecutar_codigo_misiones(webpack_require) {
    try {
      const version = window.__VERSION_MISIONES || window.__QUEST_VERSION || '1.0.0';
      if ('__VERSION_MISIONES' in window) {
        try { delete window.__VERSION_MISIONES; } catch (e) {}
      }
      if ('__QUEST_VERSION' in window) {
        try { delete window.__QUEST_VERSION; } catch (e) {}
      }
      
      emitir_registro(`Inicializando motor AutoQuest (v${version})...`, 'info');

      const almacenes = cargar_almacenes(webpack_require);
      if (!almacenes) {
        emitir_registro('Error: No se pudieron cargar los almacenes de Discord', 'error');
        return;
      }

      emitir_registro('Almacenes y API de Discord vinculados correctamente', 'exito');

      const misiones_activas = obtener_misiones_activas(almacenes.almacen_misiones);
      if (misiones_activas.length === 0) {
        emitir_registro('No se encontraron misiones activas pendientes de completar', 'advertencia');
        return;
      }

      emitir_registro(`Detectadas ${misiones_activas.length} misión(es) para procesar`, 'info');

      const estados_misiones = misiones_activas.map(mision => inicializar_estado_mision(mision));

      enviar_actualizacion('LISTA_MISIONES', estados_misiones.map(estado => ({
        id: estado.mision.id,
        nombre: estado.nombre_mision,
        name: estado.nombre_mision,
        tipo_tarea: estado.tipo_tarea,
        taskType: estado.tipo_tarea,
        progreso: Math.floor(estado.progreso_actual),
        progress: Math.floor(estado.progreso_actual),
        objetivo: estado.segundos_necesarios,
        target: estado.segundos_necesarios,
        completado: estado.completado,
        completed: estado.completado
      })));

      for (const estado of estados_misiones) {
        if (estado.completado) continue;

        emitir_registro(`Iniciando progreso: ${estado.nombre_mision} (${estado.tipo_tarea})`, 'info');

        while (!estado.completado) {
          const es_video = estado.tipo_tarea.startsWith('WATCH_VIDEO');

          if (es_video) {
            await procesar_paso_video(estado, almacenes.api);
            if (!estado.completado) await new Promise(resolver => setTimeout(resolver, 1000 + (Math.random() * 500)));
          } else {
            await procesar_paso_latido(estado, almacenes);
            if (!estado.completado) await new Promise(resolver => setTimeout(resolver, 20000 + (Math.random() * 2000)));
          }
        }
      }

      emitir_registro('Todas las misiones activas han sido completadas con éxito', 'exito');
    } catch (error) {
      emitir_registro(`Error durante la ejecución: ${error.message}`, 'error');
    }
  }

  function obtener_misiones_activas(almacen_misiones) {
    const tareas_compatibles = ['WATCH_VIDEO', 'PLAY_ON_DESKTOP', 'STREAM_ON_DESKTOP', 'PLAY_ACTIVITY', 'WATCH_VIDEO_ON_MOBILE'];

    return [...almacen_misiones.quests.values()].filter(mision => {
      const esta_expirada = new Date(mision.config.expiresAt).getTime() <= Date.now();
      const esta_completada = !!mision.userStatus?.completedAt;
      const esta_inscrito = !!mision.userStatus?.enrolledAt;
      const config_tarea = mision.config.taskConfig ?? mision.config.taskConfigV2;
      const tiene_tarea_compatible = tareas_compatibles.some(tipo => config_tarea.tasks[tipo] !== null);

      return esta_inscrito && !esta_completada && !esta_expirada && tiene_tarea_compatible;
    });
  }

  function inicializar_estado_mision(mision) {
    const config_tarea = mision.config.taskConfig ?? mision.config.taskConfigV2;
    const tareas_compatibles = ['WATCH_VIDEO', 'PLAY_ON_DESKTOP', 'STREAM_ON_DESKTOP', 'PLAY_ACTIVITY', 'WATCH_VIDEO_ON_MOBILE'];
    const tipo_tarea = tareas_compatibles.find(tipo => config_tarea.tasks[tipo] != null);

    const datos_tarea = config_tarea.tasks[tipo_tarea];
    const segundos_necesarios = datos_tarea?.target ?? 0;
    const progreso_actual = mision.userStatus?.progress?.[tipo_tarea]?.value ?? mision.userStatus?.streamProgressSeconds ?? 0;

    return {
      mision: mision,
      quest: mision,
      tipo_tarea: tipo_tarea,
      taskType: tipo_tarea,
      segundos_necesarios: segundos_necesarios,
      secondsNeeded: segundos_necesarios,
      progreso_actual: progreso_actual,
      currentProgress: progreso_actual,
      completado: progreso_actual >= segundos_necesarios,
      completed: progreso_actual >= segundos_necesarios,
      inscrito_en: new Date(mision.userStatus.enrolledAt).getTime(),
      nombre_mision: mision.config.messages.questName,
      questName: mision.config.messages.questName
    };
  }

  function cargar_almacenes(webpack_require) {
    try {
      const almacen_misiones = buscar_modulo(webpack_require, m => m.__proto__?.getQuest);
      const almacen_canales = buscar_modulo(webpack_require, m => m.__proto__?.getAllThreadsForParent);
      const almacen_canales_servidor = buscar_modulo(webpack_require, m => m.getSFWDefaultChannel);
      const api_modulo = buscar_modulo(webpack_require, m => m.Bo?.get || m.tn?.get);

      if (!almacen_misiones || !api_modulo) return null;

      return {
        almacen_misiones: almacen_misiones,
        QuestsStore: almacen_misiones,
        almacen_canales: almacen_canales,
        ChannelStore: almacen_canales,
        almacen_canales_servidor: almacen_canales_servidor,
        GuildChannelStore: almacen_canales_servidor,
        api: api_modulo.Bo || api_modulo.tn || api_modulo
      };
    } catch (error) {
      return null;
    }
  }

  const notificar_interfaz = (mision, tipo_tarea, progreso, objetivo, completado) => {
    enviar_actualizacion('ACTUALIZACION_MISION', {
      id: mision.id,
      nombre: mision.config.messages.questName,
      name: mision.config.messages.questName,
      tipo_tarea: tipo_tarea,
      taskType: tipo_tarea,
      progreso: progreso,
      progress: progreso,
      objetivo: objetivo,
      target: objetivo,
      completado: completado,
      completed: completado
    });
  };

  async function procesar_paso_video(estado, api) {
    const { mision, tipo_tarea, segundos_necesarios, progreso_actual } = estado;
    const velocidad = 1;

    const siguiente_tiempo = Math.min(segundos_necesarios, progreso_actual + velocidad + Math.random());

    try {
      const respuesta = await api.post({ url: `/quests/${mision.id}/video-progress`, body: { timestamp: siguiente_tiempo } });
      estado.progreso_actual = siguiente_tiempo;
      estado.currentProgress = siguiente_tiempo;
      notificar_interfaz(mision, tipo_tarea, Math.floor(estado.progreso_actual), segundos_necesarios, false);

      if (respuesta.body.completed_at !== null || estado.progreso_actual >= segundos_necesarios) {
        estado.completado = true;
        estado.completed = true;
        notificar_interfaz(mision, tipo_tarea, segundos_necesarios, segundos_necesarios, true);
        await api.post({ url: `/quests/${mision.id}/video-progress`, body: { timestamp: segundos_necesarios } });
        emitir_registro(`Misión de video finalizada: ${mision.config.messages.questName}`, 'exito');
      }
    } catch (error) {
      emitir_registro(`Fallo en llamada /video-progress: ${error.message}`, 'error');
    }
  }

  async function procesar_paso_latido(estado, almacenes) {
    const { api, almacen_canales, almacen_canales_servidor } = almacenes;
    const { mision, tipo_tarea, segundos_necesarios } = estado;

    let id_canal = almacen_canales?.getSortedPrivateChannels()[0]?.id;
    if (!id_canal && almacen_canales_servidor) {
      const servidores = Object.values(almacen_canales_servidor.getAllGuilds());
      const canal_voz = servidores.find(servidor => servidor?.VOCAL?.length > 0);
      if (canal_voz) id_canal = canal_voz.VOCAL[0].channel.id;
    }

    const clave_stream = id_canal ? `call:${id_canal}:1` : `call:${mision.id}:1`;

    try {
      const respuesta = await api.post({
        url: `/quests/${mision.id}/heartbeat`,
        body: { stream_key: clave_stream, terminal: false }
      });

      const progreso_servidor = respuesta.body?.progress?.[tipo_tarea]?.value ?? 0;
      estado.progreso_actual = progreso_servidor;
      estado.currentProgress = progreso_servidor;
      notificar_interfaz(mision, tipo_tarea, Math.floor(estado.progreso_actual), segundos_necesarios, estado.progreso_actual >= segundos_necesarios);

      const porcentaje = Math.min(100, Math.round((progreso_servidor / segundos_necesarios) * 100));
      emitir_registro(`Heartbeat OK [${porcentaje}%] | ${Math.floor(progreso_servidor)}s / ${segundos_necesarios}s (${clave_stream})`, 'info');

      if (estado.progreso_actual >= segundos_necesarios) {
        await api.post({
          url: `/quests/${mision.id}/heartbeat`,
          body: { stream_key: clave_stream, terminal: true }
        });
        estado.completado = true;
        estado.completed = true;
        notificar_interfaz(mision, tipo_tarea, segundos_necesarios, segundos_necesarios, true);
        emitir_registro(`Misión de transmisión completada: ${mision.config.messages.questName}`, 'exito');
      }
    } catch (error) {
      emitir_registro(`Fallo en heartbeat de stream: ${error.message}`, 'error');
    }
  }

  esperar_webpack(ejecutar_codigo_misiones);
})();
