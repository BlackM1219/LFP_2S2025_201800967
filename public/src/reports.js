/**
 * Funciones de reporte para renderizar tablas de errores y tokens
 */

export function generateErrorTable(errors) {
    if (!errors.length) {
        return `<div class="success-message">✅ No se encontraron errores léxicos</div>`;
    }

    let rows = errors
        .map(
            (e, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><code>${escapeHtml(e.lexema)}</code></td>
          <td><span style="color: red;">${e.tipo}</span></td>
          <td>${escapeHtml(e.desc)}</td>
          <td>${e.linea}</td>
          <td>${e.columna}</td>
        </tr>`
        )
        .join("");

    return `
    <table>
      <thead>
        <tr style="background-color: #f44336; color: white;">
          <th>No.</th>
          <th>Lexema</th>
          <th>Tipo</th>
          <th>Descripción</th>
          <th>Línea</th>
          <th>Columna</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

export function renderTokensTable(tokens) {
    if (!tokens.length) {
        return `<div class="error-message">⚠️ No se encontraron tokens</div>`;
    }

    let rows = tokens
        .map(
            (t, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><code>${escapeHtml(t.lexema)}</code></td>
          <td><strong>${t.tipo}</strong></td>
          <td>${t.linea}</td>
          <td>${t.columna}</td>
        </tr>`
        )
        .join("");

    return `
    <table>
      <thead>
        <tr style="background-color: #4CAF50; color: white;">
          <th>#</th>
          <th>Lexema</th>
          <th>Tipo</th>
          <th>Línea</th>
          <th>Columna</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
