/**
 * Backend — Google Apps Script (@madeiramadeira.com.br)
 * Instruções em SETUP.md
 */

const SPREADSHEET_ID = 'COLE_O_ID_DA_SUA_PLANILHA_AQUI';
const SHEET_NAME = 'Respostas';

/** Mesmo valor de submitToken em config.js (deixe vazio para desativar) */
const API_SECRET = '';

const META_FIELDS = [
  'timestamp', 'session_id', 'customer_id', 'email',
  'order_id', 'utm_source', 'utm_campaign'
];

const MAX_BODY_CHARS = 50000;
const MAX_FIELD_LEN = 2000;
const RATE_LIMIT_PER_SESSION = 5;
const RATE_WINDOW_SECONDS = 3600;

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse_({ ok: false, error: 'empty_body' });
    }
    if (e.postData.contents.length > MAX_BODY_CHARS) {
      return jsonResponse_({ ok: false, error: 'payload_too_large' });
    }

    const raw = JSON.parse(e.postData.contents);

    if (API_SECRET) {
      const token = String(raw._token || '');
      if (token !== API_SECRET) {
        return jsonResponse_({ ok: false, error: 'unauthorized' });
      }
      delete raw._token;
    }

    const sessionId = String(raw.session_id || '');
    if (sessionId && !checkRateLimit_(sessionId)) {
      return jsonResponse_({ ok: false, error: 'rate_limited' });
    }

    const payload = sanitizePayload_(raw);
    const sheet = getOrCreateSheet_();
    ensureHeaders_(sheet, payload);
    sheet.appendRow(rowFromPayload_(sheet, payload));

    return jsonResponse_({ ok: true });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return jsonResponse_({ ok: true, service: 'questionario-financials-mm' });
}

function sanitizePayload_(raw) {
  const out = {};
  META_FIELDS.forEach(function (key) {
    if (raw[key] !== undefined && raw[key] !== null) {
      out[key] = truncate_(raw[key]);
    }
  });
  Object.keys(raw).forEach(function (key) {
    if (/^q\d{1,2}$/.test(key)) {
      out[key] = truncate_(raw[key]);
    }
  });
  return out;
}

function truncate_(val) {
  if (Array.isArray(val)) {
    return val.map(function (v) { return String(v).slice(0, MAX_FIELD_LEN); }).join('; ');
  }
  return String(val).slice(0, MAX_FIELD_LEN);
}

function checkRateLimit_(sessionId) {
  const cache = CacheService.getScriptCache();
  const key = 'rl_' + sessionId;
  const hits = parseInt(cache.get(key) || '0', 10);
  if (hits >= RATE_LIMIT_PER_SESSION) return false;
  cache.put(key, String(hits + 1), RATE_WINDOW_SECONDS);
  return true;
}

function getOrCreateSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  return sheet;
}

function getHeaders_(sheet) {
  if (sheet.getLastRow() === 0) return [];
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function ensureHeaders_(sheet, payload) {
  let headers = getHeaders_(sheet);
  if (!headers.length) {
    headers = META_FIELDS.slice();
  }
  const answerKeys = Object.keys(payload).filter(function (k) { return /^q\d{1,2}$/.test(k); }).sort();
  answerKeys.forEach(function (k) {
    if (headers.indexOf(k) === -1) headers.push(k);
  });
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function rowFromPayload_(sheet, payload) {
  const headers = getHeaders_(sheet);
  return headers.map(function (col) {
    const val = payload[col];
    return val === undefined || val === null ? '' : String(val);
  });
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
