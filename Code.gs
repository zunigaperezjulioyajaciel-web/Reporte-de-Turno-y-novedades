/**
 * API de Reporte de Turno (Google Apps Script) - guarda los reportes en una hoja de Google Sheets.
 *
 * INSTALACIÓN (resumen; los pasos completos están en el README):
 * 1. Crea una hoja de cálculo nueva en Google Sheets.
 * 2. Extensiones > Apps Script. Borra el contenido y pega este archivo.
 * 3. Cambia TOKEN por una clave larga y propia (mínimo 24 caracteres).
 * 4. Implementar > Nueva implementación > Tipo: Aplicación web
 *    - Ejecutar como: Yo
 *    - Quién tiene acceso: Cualquier persona
 * 5. Copia la URL que termina en /exec y pégala en el dashboard (botón de nube).
 *
 * Si modificas este código después, usa Implementar > Administrar implementaciones >
 * Editar > Versión nueva, para que la URL siga siendo la misma.
 */

const TOKEN = 'CAMBIA-ESTE-TOKEN-POR-UNA-CLAVE-LARGA';
const SHEET_NAME = 'Reportes';

const HEADERS = [
  'folio', 'fecha', 'hora', 'turno', 'instalacion', 'jefe',
  'totalAccesos', 'denegados', 'incidentes', 'asistenciaPct', 'puntualidadPct', 'equiposConFalla',
  'resumen', 'recomendaciones', 'updatedAt', 'deleted', 'serverAt', 'json'
];
// Columnas que deben quedar como texto para que Sheets no convierta fechas ni horas
const TEXT_COLS = ['folio', 'fecha', 'hora', 'updatedAt', 'serverAt', 'json'];

function doGet() {
  return json_({ ok: true, msg: 'API de Reporte de Turno activa' });
}

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    if (req.token !== TOKEN) return json_({ error: 'Token inválido' });
    const lock = LockService.getScriptLock();
    lock.waitLock(25000);
    try {
      const sh = sheet_();
      if (req.action === 'ping') {
        return json_({ ok: true, count: Math.max(0, sh.getLastRow() - 1) });
      }
      if (req.action === 'sync') {
        const wrote = upsert_(sh, req.reports || []);
        return json_({ ok: true, wrote: wrote, reports: read_(sh, req.since || '') });
      }
      return json_({ error: 'Acción desconocida' });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return json_({ error: String(err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    TEXT_COLS.forEach(function (c) {
      const col = HEADERS.indexOf(c) + 1;
      sh.getRange(1, col, sh.getMaxRows(), 1).setNumberFormat('@');
    });
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#1e3a5f').setFontColor('#ffffff');
  }
  return sh;
}

function toRow_(r, now) {
  const del = !!r.deleted;
  const acc = ['visitante', 'sinGafete', 'contratista', 'eom', 'nuevosIngresos', 'proveedores', 'autoridades', 'vip'];
  const total = acc.reduce(function (s, k) { return s + (Number(r[k]) || 0); }, 0);
  const incs = (r.incidentes || []).filter(function (i) { return i.folio || i.descripcion; }).length;
  const pa = r.plantillaTotal ? Math.round((Number(r.personalAsistio) || 0) / r.plantillaTotal * 100) : '';
  const pp = r.personalAsistio ? Math.round((Number(r.personalPuntual) || 0) / r.personalAsistio * 100) : '';
  let fallas = 0;
  ['radios', 'torniquetes', 'lectoras', 'puertas'].forEach(function (k) {
    (r[k] || []).forEach(function (x) { if (x.estado === 'Falla') fallas++; });
  });
  return [
    r.folio,
    del ? '' : (r.fecha || ''),
    del ? '' : (r.hora || ''),
    del ? '' : (r.turno || ''),
    del ? '' : (r.instalacion || ''),
    del ? '' : (r.jefe || ''),
    del ? '' : total,
    del ? '' : (Number(r.denegados) || 0),
    del ? '' : incs,
    del ? '' : pa,
    del ? '' : pp,
    del ? '' : fallas,
    del ? '' : (r.resumen || ''),
    del ? '' : (r.recomendaciones || ''),
    r.updatedAt || now,
    del ? 'true' : '',
    now,
    JSON.stringify(del ? { folio: r.folio, deleted: true, updatedAt: r.updatedAt || now } : r)
  ];
}

function upsert_(sh, reports) {
  if (!reports.length) return 0;
  const last = sh.getLastRow();
  const data = last > 1 ? sh.getRange(2, 1, last - 1, HEADERS.length).getValues() : [];
  const idx = {};
  data.forEach(function (row, i) { idx[String(row[0])] = i; });
  const iUpd = HEADERS.indexOf('updatedAt');
  const now = new Date().toISOString();
  const append = [];
  let n = 0;
  reports.forEach(function (rep) {
    if (!rep || !rep.folio) return;
    const row = toRow_(rep, now);
    if (Object.prototype.hasOwnProperty.call(idx, rep.folio)) {
      const cur = String(data[idx[rep.folio]][iUpd] || '');
      if (cur > String(rep.updatedAt || '')) return; // lo guardado en la nube es más reciente
      sh.getRange(idx[rep.folio] + 2, 1, 1, HEADERS.length).setValues([row]);
    } else {
      append.push(row);
    }
    n++;
  });
  if (append.length) {
    sh.getRange(sh.getLastRow() + 1, 1, append.length, HEADERS.length).setValues(append);
  }
  return n;
}

function read_(sh, since) {
  const last = sh.getLastRow();
  if (last < 2) return [];
  const rows = sh.getRange(2, 1, last - 1, HEADERS.length).getValues();
  const iSrv = HEADERS.indexOf('serverAt');
  const iJson = HEADERS.indexOf('json');
  const out = [];
  rows.forEach(function (r) {
    const srv = String(r[iSrv] || '');
    if (since && srv <= since) return;
    try {
      const o = JSON.parse(r[iJson]);
      o._serverAt = srv;
      out.push(o);
    } catch (e) { /* fila sin JSON válido: se ignora */ }
  });
  return out;
}
