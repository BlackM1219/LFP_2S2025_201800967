import Lexer from "./lexer.js";
import Parser from "./parser.js";
import Tournament from "./tournament.js";
import {
    renderTokensTable,
    generateErrorTable,
    generateBracketDOT,
    generateTeamStatsTable,
    generateScorersDOT,
    generateGeneralInfoDOT
} from "./reports.js";

// DOM refs
const fileInput = document.getElementById("fileInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

let fileText = "";

// 1) Navegación de pestañas
tabButtons.forEach(btn =>
    btn.addEventListener("click", () => {
        tabButtons.forEach(b => b.classList.remove("active"));
        tabContents.forEach(c => c.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(btn.dataset.tab).classList.add("active");
    })
);

// 2) Lectura del .txt
fileInput.addEventListener("change", async e => {
    const file = e.target.files[0];
    if (!file) {
        analyzeBtn.disabled = true;
        return;
    }
    try {
        fileText = await file.text();
        analyzeBtn.disabled = false;
    } catch (err) {
        console.error("No se pudo leer archivo:", err);
        analyzeBtn.disabled = true;
    }
});

// 3) Análisis completo
analyzeBtn.addEventListener("click", async() => {
    // Léxico
    const lexer = new Lexer(fileText);
    const { tokens, errors } = lexer.tokenize();

    document.getElementById("tokensTab").innerHTML =
        renderTokensTable(tokens);
    document.getElementById("errorsTab").innerHTML =
        errors.length ?
        generateErrorTable(errors) :
        "<p>✅ No se encontraron errores léxicos</p>";

    // Si hay errores léxicos, detenemos aquí
    if (errors.length) return;

    // Sintáctico → Modelo
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const tournament = new Tournament(ast);
    tournament.computeStats();

    // Viz.js instance
    const viz = new window.Viz();

    // Bracket (Graphviz)
    const bracketDot = generateBracketDOT(tournament);
    try {
        const svg = await viz.renderSVGElement(bracketDot);
        const c = document.getElementById("bracketTab");
        c.innerHTML = "";
        c.appendChild(svg);
    } catch {
        document.getElementById("bracketTab").innerHTML = `<pre>${bracketDot}</pre>`;
    }

    // Estadísticas de Equipos (HTML table)
    document.getElementById("teamStatsTab").innerHTML =
        generateTeamStatsTable(tournament);

    // Goleadores (Graphviz)
    const scorersDot = generateScorersDOT(tournament);
    try {
        const svg = await viz.renderSVGElement(scorersDot);
        const c2 = document.getElementById("scorersTab");
        c2.innerHTML = "";
        c2.appendChild(svg);
    } catch {
        document.getElementById("scorersTab").innerHTML = `<pre>${scorersDot}</pre>`;
    }

    // Info General (Graphviz)
    const infoDot = generateGeneralInfoDOT(tournament);
    try {
        const svg = await viz.renderSVGElement(infoDot);
        const c3 = document.getElementById("generalInfoTab");
        c3.innerHTML = "";
        c3.appendChild(svg);
    } catch {
        document.getElementById("generalInfoTab").innerHTML = `<pre>${infoDot}</pre>`;
    }
});