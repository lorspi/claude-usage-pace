// Obtiene el % de uso desde el mismo endpoint que usa `/usage` en Claude Code.
// El token se lee en cada consulta; Claude Code se encarga de renovarlo.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');

const USAGE_URL = 'https://api.anthropic.com/api/oauth/usage';

function readKeychain() {
  return new Promise((resolve) => {
    execFile('security', ['find-generic-password', '-s', 'Claude Code-credentials', '-w'], (err, stdout) => {
      resolve(err ? null : stdout.trim());
    });
  });
}

async function readToken(credentialsPath) {
  const file = credentialsPath || path.join(os.homedir(), '.claude', '.credentials.json');
  let raw = null;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch {
    if (process.platform === 'darwin') raw = await readKeychain();
  }
  if (!raw) throw new Error(`No encontré credenciales de Claude Code (${file}). Inicia sesión con \`claude\`.`);
  const oauth = JSON.parse(raw).claudeAiOauth;
  if (!oauth || !oauth.accessToken) throw new Error('Las credenciales no contienen un token OAuth de Claude.');
  return oauth;
}

/** Devuelve el JSON completo del endpoint de uso. */
async function fetchUsage(credentialsPath) {
  const oauth = await readToken(credentialsPath);
  const res = await fetch(USAGE_URL, {
    headers: {
      Authorization: `Bearer ${oauth.accessToken}`,
      'anthropic-beta': 'oauth-2025-04-20',
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(15000),
  });
  if (res.status === 401) {
    throw new Error('Token expirado. Abre o usa Claude Code para que lo renueve.');
  }
  if (!res.ok) throw new Error(`Error ${res.status} al consultar el uso.`);
  return res.json();
}

module.exports = { fetchUsage };
