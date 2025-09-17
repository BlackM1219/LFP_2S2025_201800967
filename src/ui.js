/**
 * Controla la interacción del usuario en la web:
 * - Carga de archivo
 * - Llamada a Lexer y Parser
 * - Render de tablas y gráfico
 */
import Lexer from "./lexer.js";
import Parser from "./parser.js";
import { generateErrorTable, generateBracketDOT } from "./reports.js";

document.getElementById("fileInput").addEventListener("change", async e => {
    const text = await e.target.files[0].text();
    const lexer = new Lexer(text);
    const { tokens, errors } = lexer.tokenize();
    document.getElementById("errors").innerHTML = generateErrorTable(errors);
    if (!errors.length) {
        const parser = new Parser(tokens);
        const tournamentMeta = parser.parseTorneo();
        // Aquí seguir parseando equipos y eliminatorias...
        // Render bracket con Graphviz WASM o solicitar dot-server.
    }
});
