// 1) Render de tabla de tokens
export function renderTokensTable(tokens) {
    if (!Array.isArray(tokens) || tokens.length === 0) {
        return '<p>⚠️ No se encontraron tokens</p>';
    }
    const rows = tokens.map((t, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${t.lexema   || ''}</td>
      <td>${t.tipo     || ''}</td>
      <td>${t.linea    || ''}</td>
      <td>${t.columna  || ''}</td>
    </tr>
  `).join('');
    return `
    <table>
      <thead>
        <tr>
          <th>#</th><th>Lexema</th><th>Tipo</th><th>Línea</th><th>Columna</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// 2) Render de tabla de errores léxicos
export function generateErrorTable(errors) {
    if (!Array.isArray(errors) || errors.length === 0) {
        return '<p>✅ No se encontraron errores léxicos</p>';
    }
    const rows = errors.map((e, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${e.lexema   || ''}</td>
      <td>${e.tipo     || ''}</td>
      <td>${e.desc     || ''}</td>
      <td>${e.linea    || ''}</td>
      <td>${e.columna  || ''}</td>
    </tr>
  `).join('');
    return `
    <table>
      <thead>
        <tr>
          <th>#</th><th>Lexema</th><th>Tipo</th>
          <th>Descripción</th><th>Línea</th><th>Columna</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// 3) Tabla de posiciones finales
export function generateStandingsTable(tournament) {
    const teams = Array.isArray(tournament.teams) ? tournament.teams.slice() : [];
    if (teams.length === 0) {
        return '<p>⚠️ No hay equipos registrados</p>';
    }

    teams.sort((a, b) => {
        const pa = (a.stats && a.stats.points) || 0;
        const pb = (b.stats && b.stats.points) || 0;
        if (pb !== pa) return pb - pa;
        const gda = ((a.stats.goalsFor) || 0) - ((a.stats.goalsAgainst) || 0);
        const gdb = ((b.stats.goalsFor) || 0) - ((b.stats.goalsAgainst) || 0);
        return gdb - gda;
    });

    const rows = teams.map((team, i) => {
        const s = team.stats || {};
        const gd = (s.goalsFor || 0) - (s.goalsAgainst || 0);
        return `
      <tr>
        <td>${i + 1}</td>
        <td>${team.name || ''}</td>
        <td>${s.played        || 0}</td>
        <td>${s.won           || 0}</td>
        <td>${s.draw          || 0}</td>
        <td>${s.lost          || 0}</td>
        <td>${s.goalsFor      || 0}</td>
        <td>${s.goalsAgainst  || 0}</td>
        <td>${gd}</td>
        <td>${s.points        || 0}</td>
      </tr>
    `;
    }).join('');

    return `
    <table>
      <thead>
        <tr>
          <th>#</th><th>Equipo</th><th>J</th><th>G</th><th>E</th>
          <th>P</th><th>GF</th><th>GC</th><th>Dif</th><th>Pts</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// 4) Estadísticas por equipo
export function generateTeamStatsTable(tournament) {
    const teams = Array.isArray(tournament.teams) ? tournament.teams : [];
    if (teams.length === 0) {
        return '<p>⚠️ Sin estadísticas de equipos</p>';
    }

    const rows = teams.map(team => {
        const s = team.stats || {};
        const gd = (s.goalsFor || 0) - (s.goalsAgainst || 0);
        return `
      <tr>
        <td>${team.name           || ''}</td>
        <td>${s.played            || 0}</td>
        <td>${s.won               || 0}</td>
        <td>${s.draw              || 0}</td>
        <td>${s.lost              || 0}</td>
        <td>${s.goalsFor          || 0}</td>
        <td>${s.goalsAgainst      || 0}</td>
        <td>${gd}</td>
        <td>${team.phaseReached   || ''}</td>
      </tr>
    `;
    }).join('');

    return `
    <table>
      <thead>
        <tr>
          <th>Equipo</th><th>Jugados</th><th>Ganados</th><th>Empates</th>
          <th>Perdidos</th><th>GF</th><th>GC</th><th>Dif</th><th>Fase Alc.</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// 5) Estadísticas individuales (goleadores)
export function generateIndividualStatsTable(tournament) {
    const map = {};
    const matches = Array.isArray(tournament.matches) ? tournament.matches : [];

    matches.forEach(m => {
        const scorers = Array.isArray(m.scorers) ? m.scorers : [];
        scorers.forEach(g => {
            const key = g.name || '';
            if (!map[key]) {
                map[key] = { name: key, team: g.team || '', goals: 0, minutes: [] };
            }
            map[key].goals++;
            map[key].minutes.push(g.minute || '');
        });
    });

    const players = Object.values(map).sort((a, b) => b.goals - a.goals);
    if (players.length === 0) {
        return '<p>⚠️ No hay datos de goleadores</p>';
    }

    const rows = players.map((p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${p.name}</td>
      <td>${p.team}</td>
      <td>${p.goals}</td>
      <td>${p.minutes.join(', ')}</td>
    </tr>
  `).join('');

    return `
    <table>
      <thead>
        <tr>
          <th>#</th><th>Jugador</th><th>Equipo</th><th>Goles</th><th>Minutos</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}