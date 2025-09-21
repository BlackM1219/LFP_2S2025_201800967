import Lexer from './lexer.js';
import Parser from './parser.js';
import Tournament from './tournament.js';
import {
    renderTokensTable,
    generateErrorTable,
    generateStandingsTable,
    generateTeamStatsTable,
    generateIndividualStatsTable
} from './reports.js';

const fileInput = document.getElementById('fileInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const generateReportBtn = document.getElementById('generateReportBtn');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

let fileText = '';

// 1) Navegación de pestañas
tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

// 2) Lectura de archivo
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
    const { tokens, errors } = new Lexer(fileText).tokenize();

    document.getElementById('tokensTab').innerHTML =
        renderTokensTable(tokens);

    document.getElementById('errorsTab').innerHTML =
        generateErrorTable(errors);

    // habilita Generar Reporte solo si no hay errores
    generateReportBtn.disabled = errors.length !== 0;
});

// 4) Generar y abrir reporte (solo tablas)
generateReportBtn.addEventListener('click', () => {
    // reconstruye el modelo de torneo
    const lexResult = new Lexer(fileText).tokenize();
    const ast = new Parser(lexResult.tokens).parse();
    const tournament = new Tournament(ast);
    tournament.computeStats();

    // construye el HTML del reporte
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Reporte de Torneo</title>
  <link rel="stylesheet" href="styles.css?v=1.0.4">
</head>
<body>
  <div class="container">
    <h1>Reporte de Torneo: ${tournament.name || ''}</h1>

    <section>
      <h2>Tabla de Posiciones Finales</h2>
      ${generateStandingsTable(tournament)}
    </section>

    <section>
      <h2>Estadísticas por Equipo</h2>
      ${generateTeamStatsTable(tournament)}
    </section>

    <section>
      <h2>Estadísticas Individuales (Goleadores)</h2>
      ${generateIndividualStatsTable(tournament)}
    </section>
  </div>
</body>
</html>`;

    // abre en nueva pestaña
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
});