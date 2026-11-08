
'use strict';

async function llamarAppsScriptCalendarioV2(payload) {
  const url = process.env.SOREN_APPS_SCRIPT_TEST_URL;
  const secreto = process.env.SOREN_V2_APP_SECRET;

  if (!url || !secreto) {
    throw new Error(
      'Falta configurar la conexión de Soren Calendar V2.'
    );
  }

  const respuesta = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...payload,
      secret: secreto
    })
  });

  let datos;

  try {
    datos = await respuesta.json();
  } catch (error) {
    throw new Error(
      'Apps Script V2 no devolvió un JSON válido.'
    );
  }

  if (!respuesta.ok || datos?.ok !== true) {
    throw new Error(
      datos?.error || 'Error comunicando con Soren Calendar V2.'
    );
  }

  return datos;
}

module.exports = {
  llamarAppsScriptCalendarioV2
};
