// 1) Información General
export function generateGeneralInfoTable(tournament) {
    const totalMatches = tournament.matches.length;
    const totalGoals = tournament.matches.reduce((sum, m) => {
        if (!m.score) return sum;
        const [hg, ag] = m.score.split("-").map(Number);
        return sum + (hg || 0) + (ag || 0);
    }, 0);
    const avgGoals = totalMatches > 0 ?
        (totalGoals / totalMatches).toFixed(2) :
        "0";

    const rows = [
        `<tr><th>Nombre del Torneo</th><td>${tournament.name}</td></tr>`,
        tournament.sede ?
        `<tr><th>Sede</th><td>${tournament.sede}</td></tr>` :
        "",
        `<tr><th>Equipos Participantes</th><td>${tournament.teams.length}</td></tr>`,
        `<tr><th>Total de Partidos</th><td>${totalMatches}</td></tr>`,
        `<tr><th>Total de Goles</th><td>${totalGoals}</td></tr>`,
        `<tr><th>Promedio Goles/Partido</th><td>${avgGoals}</td></tr>`
    ].join("");

    return `<table>${rows}</table>`;
}

// 2) Tabla de Tokens
export function renderTokensTable(tokens) {
    if (!tokens.length) {
        return '<p>⚠️ No se encontraron tokens</p>';
    }
    const rows = tokens.map((t, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${t.lexema}</td>
      <td>${t.tipo}</td>
      <td>${t.linea}</td>
      <td>${t.columna}</td>
    </tr>
  `).join("");

    return `
    <table>
      <thead>
        <tr>
          <th>#</th><th>Lexema</th><th>Tipo</th>
          <th>Línea</th><th>Columna</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// 3) Tabla de Errores
export function generateErrorTable(errors) {
    if (!errors.length) {
        return '<p>✅ No se encontraron errores léxicos</p>';
    }
    const rows = errors.map((e, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${e.lexema}</td>
      <td>${e.tipo}</td>
      <td>${e.desc}</td>
      <td>${e.linea}</td>
      <td>${e.columna}</td>
    </tr>
  `).join("");

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

// 4) Tabla de Posiciones Finales
export function generateStandingsTable(tournament) {
    const teams = [...tournament.teams].sort((a, b) => {
        if (b.stats.points !== a.stats.points) {
            return b.stats.points - a.stats.points;
        }
        const gdA = a.stats.goalsFor - a.stats.goalsAgainst;
        const gdB = b.stats.goalsFor - b.stats.goalsAgainst;
        return gdB - gdA;
    });

    if (!teams.length) {
        return '<p>⚠️ No hay equipos registrados</p>';
    }

    const rows = teams.map((t, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${t.name}</td>
      <td>${t.stats.played}</td>
      <td>${t.stats.won}</td>
      <td>${t.stats.draw}</td>
      <td>${t.stats.lost}</td>
      <td>${t.stats.goalsFor}</td>
      <td>${t.stats.goalsAgainst}</td>
      <td>${t.stats.goalsFor - t.stats.goalsAgainst}</td>
      <td>${t.stats.points}</td>
      <td>${t.phaseReached}</td>
    </tr>
  `).join("");

    return `
    <table>
      <thead>
        <tr>
          <th>#</th><th>Equipo</th><th>J</th><th>G</th><th>E</th>
          <th>P</th><th>GF</th><th>GC</th><th>Dif</th>
          <th>Pts</th><th>Fase</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// 5) Estadísticas por Equipo
export function generateTeamStatsTable(tournament) {
    if (!tournament.teams.length) {
        return '<p>⚠️ Sin estadísticas de equipos</p>';
    }

    const rows = tournament.teams.map(t => `
    <tr>
      <td>${t.name}</td>
      <td>${t.stats.played}</td>
      <td>${t.stats.won}</td>
      <td>${t.stats.draw}</td>
      <td>${t.stats.lost}</td>
      <td>${t.stats.goalsFor}</td>
      <td>${t.stats.goalsAgainst}</td>
      <td>${t.stats.goalsFor - t.stats.goalsAgainst}</td>
      <td>${t.phaseReached}</td>
    </tr>
  `).join("");

    return `
    <table>
      <thead>
        <tr>
          <th>Equipo</th><th>Jugados</th><th>Ganados</th>
          <th>Empates</th><th>Perdidos</th><th>GF</th>
          <th>GC</th><th>Dif</th><th>Fase</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// 6) Ranking de Goleadores
export function generateIndividualStatsTable(tournament) {
    const map = {};
    (tournament.players || []).forEach(p => {
        const key = `${p.name}||${p.team}`;
        if (!map[key]) map[key] = { name: p.name, team: p.team, goals: 0, minutes: [] };
        map[key].goals++;
        if (p.minute != null) map[key].minutes.push(p.minute);
    });

    const players = Object.values(map).sort((a, b) =>
        b.goals !== a.goals ? b.goals - a.goals : a.name.localeCompare(b.name)
    );

    if (!players.length) {
        return '<p>⚠️ No hay datos de goleadores</p>';
    }

    const rows = players.map((pl, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${pl.name}</td>
      <td>${pl.team}</td>
      <td>${pl.goals}</td>
      <td>${pl.minutes.join(", ")}</td>
    </tr>
  `).join("");

    return `
    <table>
      <thead>
        <tr>
          <th>#</th><th>Jugador</th><th>Equipo</th>
          <th>Goles</th><th>Minutos</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}