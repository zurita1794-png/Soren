/**
 * SOREN — Calendar handler V2 (Node.js / CommonJS)
 *
 * Responsabilidad: validar solicitudes y convertir resultados del servicio
 * de calendario en mensajes de WhatsApp. NO usa la API de Meta directamente.
 *
 * Este módulo no cambia Index.js ni envía mensajes por sí mismo.
 * Requiere un servicio creado mediante crearServicioCalendario().
 */

const ZONA_HORARIA = 'America/Mexico_City';

function texto(valor) {
  return valor === null || valor === undefined ? '' : String(valor).trim();
}

function normalizar(valor) {
  return texto(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function esCumpleanos(data) {
  const tipo = normalizar(data.tipo || data.tipoEvento);
  const titulo = normalizar(data.titulo || data.title || data.Titulo);
  return tipo === 'cumpleanos' || /\b(cumpleanos|cumple)\b/.test(titulo);
}

function fechaLegible(fechaYMD) {
  const fecha = texto(fechaYMD);
  const match = fecha.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return fecha || 'Fecha no disponible';
  const dia = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12));
  if (dia.toISOString().slice(0, 10) !== fecha) return fecha;
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(dia);
}

function formatearEvento(evento) {
  const titulo = texto(evento?.titulo || evento?.title) || 'Evento';
  const fecha = texto(evento?.fechaLocal || evento?.fecha);
  const hora = texto(evento?.horaLocal);
  const todoElDia = evento?.todoElDia === true || (evento?.todoElDia !== false && !hora);
  const horario = todoElDia ? 'Todo el día' : (hora ? `${hora} h` : 'Horario no disponible');
  const ubicacion = texto(evento?.ubicacion);
  return [
    `📅 *${titulo}*`,
    `📆 ${fechaLegible(fecha)} · ${horario}`,
    ubicacion ? `📍 ${ubicacion}` : ''
  ].filter(Boolean).join('\n');
}

function formatearLista(resultado, encabezado = '📅 *Tus eventos*') {
  const eventos = resultado?.eventos;
  if (!Array.isArray(eventos)) {
    throw new Error('El calendario devolvió una lista de eventos inválida.');
  }
  if (eventos.length === 0) return `${encabezado}\n\nNo encontré eventos en ese periodo.`;
  return `${encabezado}\n\n${eventos.map(formatearEvento).join('\n\n──────────\n\n')}`;
}

function crearManejadorCalendario(servicio) {
  if (!servicio || typeof servicio.crear !== 'function' ||
      typeof servicio.listar !== 'function' || typeof servicio.buscar !== 'function' ||
      typeof servicio.agendaSemana !== 'function') {
    throw new TypeError('Se requiere un servicio de calendario válido.');
  }

  async function crearEvento(data = {}) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return '⚠️ No pude interpretar los datos del evento.';
    }
    const titulo = texto(data.titulo || data.title || data.Titulo);
    const fecha = texto(data.fecha);
    if (!titulo) return '¿Qué nombre quieres ponerle al evento?';
    if (!fecha) return '¿Para qué fecha quieres agendarlo?';
    // Apps Script valida fecha y hora antes de crear el evento.
    const resultado = await servicio.crear({ data: { ...data, titulo, fecha } });
    const evento = resultado?.evento;
    if (!evento) throw new Error('El calendario no confirmó los datos del evento.');

    if (resultado.duplicado === true) {
      return `ℹ️ *Este evento ya estaba registrado*\n\n${formatearEvento(evento)}`;
    }
    if (resultado.creado !== true) {
      throw new Error('Google Calendar no confirmó la creación del evento.');
    }
    const anual = resultado.recurrente === true && resultado.recurrencia === 'anual';
    return [
      '✅ *Evento agregado a tu calendario*',
      '',
      formatearEvento(evento),
      anual ? '🔁 Se repetirá cada año.' : '',
      '',
      'Si necesitas cambiar algo, dime qué deseas corregir.'
    ].filter((x, i) => x !== '' || i === 1).join('\n');
  }

  async function consultarEventos(parametros = {}) {
    return formatearLista(await servicio.listar(parametros));
  }

  async function buscarEventos(parametros = {}) {
    const buscar = texto(parametros.buscar || parametros.texto);
    if (!buscar) return '¿Qué evento quieres buscar?';
    const resultado = await servicio.buscar({ ...parametros, buscar });
    return formatearLista(resultado, '🔎 *Eventos encontrados*');
  }

  async function consultarSemana(parametros = {}) {
    const resultado = await servicio.agendaSemana(parametros);
    return formatearLista(resultado, '📅 *Agenda semanal*');
  }

  return Object.freeze({ crearEvento, consultarEventos, buscarEventos, consultarSemana });
}

module.exports = {
  crearManejadorCalendario,
  formatearEvento,
  formatearLista
};
