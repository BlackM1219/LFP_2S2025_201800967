import Lexer from "./lexer.js";
import Parser from "./parser.js";
import Tournament from "./tournament.js";
import { generateFullReportHTML, exportFullReport, exportBracketDOT } from "./reports.js";

const fileInput = document.getElementById("fileInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const reportsDiv = document.getElementById("reportsDiv");

let fileContent = "";

fileInput.addEventListener("change", async e => {
  const f = e.target.files[0];
  fileContent = await f.text();
  analyzeBtn.disabled = false;
});

analyzeBtn.addEventListener("click", () => {
  const lexer = new Lexer(fileContent);
  const { tokens, errors } = lexer.tokenize();
  if (errors.length > 0) {
    reportsDiv.innerHTML = `<p>Errores léxicos encontrados</p>`;
    return;
  }
  const parser = new Parser(tokens);
  const ast = parser.parse();
  const tournament = new Tournament(ast);
  tournament.computeStats();

  const html = generateFullReportHTML(tournament);
  reportsDiv.innerHTML = html;

  // Exportar automáticamente
  exportFullReport(tournament, "reporte.html");
  exportBracketDOT(tournament, "bracket.dot");
});

