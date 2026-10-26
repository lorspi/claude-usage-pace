const vscode = require('vscode');
const { parseLocal, formatLocal, cycleBounds, computePace, formatDuration } = require('./pace');
const { fetchUsage } = require('./usage');

const CFG = 'claudeUsagePace';
const QUOTA_LABELS = {
  seven_day: 'Semanal (todos los modelos)',
  seven_day_opus: 'Semanal Opus',
  seven_day_sonnet: 'Semanal Sonnet',
  extra_usage: 'Créditos extra',
};

let item;
let timer;
let lastData = null; // última respuesta del endpoint
let lastError = null;
let lastFetch = null;

function cfg() {
  return vscode.workspace.getConfiguration(CFG);
}

function fmt(n, digits = 1) {
  return n.toFixed(digits).replace(/\.0$/, '');
}

function signed(n) {
  return (n > 0 ? '+' : n < 0 ? '−' : '±') + fmt(Math.abs(n));
}

async function refresh() {
  if (cfg().get('source') === 'auto') {
    try {
      lastData = await fetchUsage(cfg().get('credentialsPath'));
      lastError = null;
      lastFetch = new Date();
    } catch (e) {
      lastError = e.message || String(e);
    }
  }
  render();
}

function usagePercent() {
  const c = cfg();
  if (c.get('source') === 'manual') return c.get('manualPercent');
  const q = lastData && lastData[c.get('quota')];
  return q && typeof q.utilization === 'number' ? q.utilization : null;
}

function render() {
  const c = cfg();
  const anchor = parseLocal(c.get('cutoff'));
  if (!anchor) {
    item.text = '$(clock) Claude: configura tu corte';
    item.tooltip = 'Haz clic para indicar la fecha y hora de tu corte.';
    item.command = 'claudeUsagePace.setCutoff';
    item.backgroundColor = undefined;
    return;
  }
  item.command = 'claudeUsagePace.refresh';

  const usage = usagePercent();
  if (usage === null) {
    item.text = '$(error) Claude: sin datos';
    item.tooltip = lastError || `No hay datos para la cuota "${QUOTA_LABELS[c.get('quota')]}".`;
    item.backgroundColor = undefined;
    return;
  }

  const now = new Date();
  const { last, next } = cycleBounds(anchor, now, c.get('period'), c.get('periodDays'));
  const p = computePace(usage, last, next, now);

  let icon = '$(check)';
  item.backgroundColor = undefined;
  if (p.delta >= c.get('errorAbove')) {
    icon = '$(flame)';
    item.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
  } else if (p.delta >= c.get('warnAbove')) {
    icon = '$(warning)';
    item.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
  } else if (p.delta > 0) {
    icon = '$(arrow-up)';
  }
  item.text = `${icon} Claude ${fmt(p.usagePct, 0)}% / ${fmt(p.timePct, 0)}% (${signed(p.delta)})`;

  const md = new vscode.MarkdownString();
  md.supportThemeIcons = true;
  const status = p.delta > 0
    ? `**${fmt(p.delta)} pts por encima** del uso óptimo`
    : `**${fmt(-p.delta)} pts por debajo** del uso óptimo`;
  md.appendMarkdown(`### Claude Code — ${QUOTA_LABELS[c.get('quota')]}\n\n${status}\n\n`);
  md.appendMarkdown('| | |\n|---|---|\n');
  md.appendMarkdown(`| Cuota usada | **${fmt(p.usagePct)}%** |\n`);
  md.appendMarkdown(`| Tiempo transcurrido | **${fmt(p.timePct)}%** |\n`);
  md.appendMarkdown(`| Último corte | ${formatLocal(last)} |\n`);
  md.appendMarkdown(`| Próximo corte | ${formatLocal(next)} (en ${formatDuration(p.remainingMs)}) |\n`);
  md.appendMarkdown(`| Proyección al corte | ${fmt(p.projected)}% |\n`);
  md.appendMarkdown(`| Ritmo disponible | ${fmt(p.budgetPerHour, 2)}% por hora |\n`);
  if (p.catchUpMs > 0) {
    md.appendMarkdown(`| Vuelves al ritmo sin usar Claude en | ${formatDuration(p.catchUpMs)} |\n`);
  }
  const session = lastData && lastData.five_hour;
  if (c.get('source') === 'auto' && session && typeof session.utilization === 'number') {
    const resets = session.resets_at ? formatLocal(new Date(session.resets_at)) : '—';
    md.appendMarkdown(`| Sesión de 5 h | ${fmt(session.utilization)}% (reinicia ${resets}) |\n`);
  }
  md.appendMarkdown('\n');
  if (c.get('source') === 'manual') {
    md.appendMarkdown('_Fuente: % ingresado manualmente._\n\n');
  } else if (lastFetch) {
    md.appendMarkdown(`_Actualizado ${lastFetch.toLocaleTimeString()}._`);
    if (lastError) md.appendMarkdown(` $(warning) ${lastError}`);
    md.appendMarkdown('\n\n');
  }
  md.appendMarkdown('Clic para actualizar.');
  item.tooltip = md;
}

function schedule() {
  clearInterval(timer);
  const secs = Math.max(30, cfg().get('refreshSeconds'));
  timer = setInterval(refresh, secs * 1000);
}

async function setCutoff() {
  const current = cfg().get('cutoff');
  const value = await vscode.window.showInputBox({
    title: 'Fecha y hora de tu corte (hora local)',
    prompt: 'Cualquier corte, pasado o futuro. Formato YYYY-MM-DD HH:mm',
    value: current || formatLocal(new Date()),
    validateInput: (v) => (parseLocal(v) ? null : 'Usa el formato YYYY-MM-DD HH:mm, p. ej. 2026-11-02 16:59'),
  });
  if (value === undefined) return;
  const period = await vscode.window.showQuickPick(
    [
      { label: 'Semanal', value: 'weekly' },
      { label: 'Mensual', value: 'monthly' },
      { label: 'Cada N días', value: 'custom' },
    ],
    { title: '¿Cada cuánto se repite el corte?' }
  );
  if (!period) return;
  const target = vscode.ConfigurationTarget.Global;
  if (period.value === 'custom') {
    const days = await vscode.window.showInputBox({
      title: 'Días entre cortes',
      value: String(cfg().get('periodDays')),
      validateInput: (v) => (Number(v) >= 1 ? null : 'Ingresa un número de días ≥ 1'),
    });
    if (days === undefined) return;
    await cfg().update('periodDays', Number(days), target);
  }
  await cfg().update('cutoff', formatLocal(parseLocal(value)), target);
  await cfg().update('period', period.value, target);
}

async function syncCutoff() {
  try {
    lastData = await fetchUsage(cfg().get('credentialsPath'));
    lastFetch = new Date();
    lastError = null;
  } catch (e) {
    vscode.window.showErrorMessage(e.message || String(e));
    return;
  }
  const quota = cfg().get('quota');
  const q = lastData[quota];
  if (!q || !q.resets_at) {
    vscode.window.showWarningMessage(`Claude no informa la fecha de corte para "${QUOTA_LABELS[quota]}". Configúrala a mano.`);
    return;
  }
  // Redondea al minuto más cercano (Claude informa p. ej. 05:59:59.8).
  const resets = new Date(Math.round(new Date(q.resets_at).getTime() / 60000) * 60000);
  const target = vscode.ConfigurationTarget.Global;
  await cfg().update('cutoff', formatLocal(resets), target);
  await cfg().update('period', 'weekly', target);
  vscode.window.showInformationMessage(`Corte configurado: ${formatLocal(resets)} (semanal).`);
}

async function setManualPercent() {
  const value = await vscode.window.showInputBox({
    title: '% de la cuota usado',
    value: String(cfg().get('manualPercent')),
    validateInput: (v) => (v !== '' && Number(v) >= 0 && Number(v) <= 100 ? null : 'Número entre 0 y 100'),
  });
  if (value === undefined) return;
  const target = vscode.ConfigurationTarget.Global;
  await cfg().update('manualPercent', Number(value), target);
  await cfg().update('source', 'manual', target);
}

function activate(context) {
  item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  item.name = 'Claude Usage Pace';
  item.show();

  context.subscriptions.push(
    item,
    vscode.commands.registerCommand('claudeUsagePace.refresh', refresh),
    vscode.commands.registerCommand('claudeUsagePace.setCutoff', setCutoff),
    vscode.commands.registerCommand('claudeUsagePace.syncCutoff', syncCutoff),
    vscode.commands.registerCommand('claudeUsagePace.setManualPercent', setManualPercent),
    vscode.commands.registerCommand('claudeUsagePace.openSettings', () =>
      vscode.commands.executeCommand('workbench.action.openSettings', CFG)
    ),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (!e.affectsConfiguration(CFG)) return;
      if (e.affectsConfiguration(`${CFG}.refreshSeconds`)) schedule();
      refresh();
    }),
    // El % de tiempo avanza aunque no se consulte la API.
    { dispose: () => clearInterval(timer) },
    (() => {
      const tick = setInterval(render, 60 * 1000);
      return { dispose: () => clearInterval(tick) };
    })()
  );

  schedule();
  refresh();
}

function deactivate() {}

module.exports = { activate, deactivate };
