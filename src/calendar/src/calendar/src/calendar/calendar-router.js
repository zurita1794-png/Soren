/**
 * SOREN — Calendar Router V2 (Node.js / CommonJS)
 *
 * Traduce las acciones interpretadas por Gemini a las operaciones
 * del servicio y al formato de respuestas de WhatsApp.
 *
 * No modifica Index.js ni envía mensajes de WhatsApp directamente.
 * La eliminación mantiene su flujo original de confirmación hasta
 * que exista un módulo V2 completo para esa operación.
 */

const { crearServicioCalendario } = require('./calendar-service');
const { crearManejadorCalendario, formatearLista } = require('./calendar-handler');

const ACCIONES_V2 = Object.freeze([
  'calendario_ver',
  'calendario_buscar',
  'calendario_crear',
  'calendario_hoy',
  'calendario_semana'
]);

function crearRouterCalendario(llamarAppsScript) {
  const servicio = crearServicioCalendario(llamarAppsScript);
  const manejador = crearManejadorCalendario(servicio);

  function puedeManejar(accion) {
    return ACCIONES_V2.includes(String(accion || '').trim().toLowerCase());
  }

  async function ejecutar(interpretacion = {}) {
    const accion = String(interpretacion.accion || interpretacion.action || '')
      .trim().toLowerCase();

    if (!puedeManejar(accion)) {
      throw new Error('Acción no compatible con Calendar V2: ' + accion);
    }

    const parametros = {
      timeMin: interpretacion.timeMin || interpretacion.desde || '',
      timeMax: interpretacion.timeMax || interpretacion.hasta || '',
      maxResults: interpretacion.maxResults || 20
    };

    switch (accion) {
      case 'calendario_ver':
        return manejador.consultarEventos(parametros);

      case 'calendario_buscar':
        return manejador.buscarEventos({
          ...parametros,
          buscar: interpretacion.buscar || interpretacion.texto || interpretacion.evento || ''
        });

      case 'calendario_crear': {
        const datos = interpretacion.data || {};
        // El flujo V1 admitía varias fechas. No perder datos silenciosamente.
        if (Array.isArray(datos.fechas) && datos.fechas.length > 1) {
          throw new Error('Creación de varios eventos todavía pendiente en Calendar V2.');
        }
        return manejador.crearEvento(datos);
      }

      case 'calendario_hoy':
        return formatearLista(await servicio.agendaHoy({ fecha: interpretacion.fecha }),
          '🔔 *Agenda de hoy*');

      case 'calendario_semana':
        return manejador.consultarSemana({ fecha: interpretacion.fecha });
    }
  }

  return Object.freeze({ puedeManejar, ejecutar });
}

module.exports = { crearRouterCalendario, ACCIONES_V2 };
