
'use strict';

/**
 * SOREN — Calendar Service V2
 * Adaptador de comunicación con Apps Script.
 */

const ACCIONES = Object.freeze({
  listar: 'soren_calendar_list',
  buscar: 'soren_calendar_search',
  crear: 'soren_calendar_create',
  eliminar: 'soren_calendar_delete',
  agendaHoy: 'soren_calendar_today',
  agendaSemana: 'soren_calendar_week'
});

function crearServicioCalendario(llamarAppsScript) {

  if (typeof llamarAppsScript !== 'function') {
    throw new TypeError(
      'Se requiere la funcion llamarAppsScript.'
    );
  }

  async function ejecutar(accion, payload = {}) {

    if (
      payload === null ||
      typeof payload !== 'object' ||
      Array.isArray(payload)
    ) {
      throw new TypeError(
        'Los datos del calendario deben ser un objeto.'
      );
    }

    const respuesta = await llamarAppsScript({
      action: accion,
      payload
    });

    if (
      !respuesta ||
      typeof respuesta !== 'object' ||
      Array.isArray(respuesta)
    ) {
      throw new Error(
        'Apps Script no devolvio una respuesta valida.'
      );
    }

    if (respuesta.ok === false) {
      throw new Error(
        respuesta.error ||
        'Error consultando Calendar V2.'
      );
    }

    return Object.prototype.hasOwnProperty.call(
      respuesta,
      'resultado'
    )
      ? respuesta.resultado
      : respuesta;
  }

  return Object.freeze({
    listar: (datos = {}) =>
      ejecutar(ACCIONES.listar, datos),

    buscar: (datos = {}) =>
      ejecutar(ACCIONES.buscar, datos),

    crear: (datos = {}) =>
      ejecutar(ACCIONES.crear, datos),

    eliminar: (datos = {}) =>
      ejecutar(ACCIONES.eliminar, datos),

    agendaHoy: (datos = {}) =>
      ejecutar(ACCIONES.agendaHoy, datos),

    agendaSemana: (datos = {}) =>
      ejecutar(ACCIONES.agendaSemana, datos)
  });
}

module.exports = {
  crearServicioCalendario,
  ACCIONES
};
