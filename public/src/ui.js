import Lexer from './lexer.js';
import {
    renderTokensTable,
    generateErrorTable,
    generateStandingsTable,
    generateTeamStatsTable,
    generateIndividualStatsTable,
    generateGeneralInfoTable
} from './reports.js';
import { analyzeFromTokens } from './analizer.js';

const fileInput = document.getElementById('fileInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const generateReportBtn = document.getElementById('generateReportBtn');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

let fileText = '';

// 1) Pestañas
tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

// 2) Leer archivo
fileInput.addEventListener('change', async e => {
    const f = e.target.files[0];
    if (f) {
        fileText = await f.text();
        analyzeBtn.disabled = false;
        generateReportBtn.disabled = true;
    } else {
        analyzeBtn.disabled = true;
        generateReportBtn.disabled = true;
    }
});

// 3) Análisis léxico
analyzeBtn.addEventListener('click', () => {
    const { tokens = [], errors = [] } = new Lexer(fileText).tokenize();

    document.getElementById('tokensTab').innerHTML =
        renderTokensTable(tokens);

    let errHtml = generateErrorTable(errors);
    if (errors.length) {
        errHtml += `<p style="color:#a00; margin-top:8px;">
      Se encontraron ${errors.length} errores léxicos.
    </p>`;
    }
    document.getElementById('errorsTab').innerHTML = errHtml;

    generateReportBtn.disabled = false;
});

// 4) Generar reporte
generateReportBtn.addEventListener('click', async() => {
    const reportWin = window.open('', '_blank');

    try {
        const { tokens = [] } = new Lexer(fileText).tokenize();
        const {
            tournament: t,
            standings,
            scorers,
            bracketDOT,
            totalMatches,
            totalGoals
        } = await analyzeFromTokens(tokens, { allowParseErrors: true });

        if (Array.isArray(standings)) {
            t.teams = standings.map(s => ({
                name: s.name,
                stats: s.stats,
                phaseReached: s.phaseReached
            }));
        }

        const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Reporte de Torneo</title>
  <link rel="stylesheet" href="styles.css?v=1.0.6">
  <style>
    body { font-family:sans-serif; margin:1rem; }
    h1,h2 { margin-bottom:.5rem; }
    section { margin-top:1.5rem; }
    table { width:100%; border-collapse:collapse; margin-top:.5rem; }
    th,td { border:1px solid #ccc; padding:.25rem .5rem; text-align:left; }
    pre { background:#f5f5f5; padding:.5rem; overflow:auto; }
  </style>
</head>
<body>
  <h1>Reporte de Torneo: ${t.name}</h1>

  <section>
    <h2>Información General</h2>
    ${generateGeneralInfoTable(t)}
    <p>Total partidos: ${totalMatches} — Total goles: ${totalGoals}</p>
  </section>

  <section>
    <h2>Tabla de Posiciones Finales</h2>
    ${generateStandingsTable(t)}
  </section>

  <section>
    <h2>Estadísticas por Equipo</h2>
    ${generateTeamStatsTable(t)}
  </section>

  <section>
    <h2>Ranking de Goleadores</h2>
    ${generateIndividualStatsTable(t)}
  </section>

  <section>
    <h2>Bracket (formato DOT)</h2>
    <pre>${(bracketDOT||'').replace(/</g,'&lt;')}</pre>
  </section>
</body>
</html>`;

        reportWin.document.open();
        reportWin.document.write(html);
        reportWin.document.close();

    } catch (err) {
        console.error('Error generando reporte:', err);
        reportWin.document.body.innerHTML = `
      <p style="color:red;">
        No se pudo generar el reporte:<br>${err.message}
      </p>`;
    }
});