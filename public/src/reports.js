// 1) Tokens
export function renderTokensTable(tokens) {
    if (tokens.length === 0) {
        return "<p>⚠️ No se encontraron tokens</p>";
    }
    const rows = tokens
        .map((t, i) => `
      <tr>
        <td>${i + 1}</td><td>${t.lexema}</td><td>${t.tipo}</td>
        <td>${t.linea}</td><td>${t.columna}</td>
      </tr>
    `).join("");
    return `
    <table>
      <thead>
        <tr>
          <th>#</th><th>Lexema</th><th>Tipo</th><th>Línea</th><th>Columna</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// 2) Errores
export function generateErrorTable(errors) {
    const rows = errors
        .map((e, i) => `
      <tr>
        <td>${i + 1}</td><td>${e.lexema}</td><td>${e.tipo}</td>
        <td>${e.desc}</td><td>${e.linea}</td><td>${e.columna}</td>
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
    </table>`;
}

// 3) Bracket (DOT)
export function generateBracketDOT(tournament) {
    let dot = `digraph Bracket {
  label="${tournament.name}";
  labelloc=top;
  node [shape=box];
`;
    tournament.matches.forEach((m, i) => {
        dot += `  match${i} [label="${m.home} vs ${m.away}\\n${m.score}"];\n`;
    });
    dot += "}";
    return dot;
}

// 4) Estadísticas de Equipos (HTML)
export function generateTeamStatsTable(t) {
    const rows = t.teams
        .map(team => {
            const s = team.stats;
            return `
        <tr>
          <td>${team.name}</td>
          <td>${s.played}</td><td>${s.won}</td><td>${s.draw}</td><td>${s.lost}</td>
          <td>${s.goalsFor}</td><td>${s.goalsAgainst}</td>
          <td>${s.goalsFor - s.goalsAgainst}</td>
          <td>${s.points}</td><td>${team.phaseReached}</td>
        </tr>`;
        }).join("");

    return `
    <table>
      <thead>
        <tr>
          <th>Equipo</th><th>J</th><th>G</th><th>E</th><th>P</th>
          <th>GF</th><th>GC</th><th>Dif</th><th>Pts</th><th>Fase</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// 5) Goleadores (DOT con tabla HTML)
export function generateScorersDOT(tournament) {
    const map = {};
    tournament.matches.forEach(m =>
        m.scorers.forEach(g => {
            if (!map[g.name]) {
                map[g.name] = { name: g.name, team: g.team, goals: 0, minutes: [] };
            }
            map[g.name].goals++;
            map[g.name].minutes.push(g.minute);
        })
    );
    const sorted = Object.values(map).sort((a, b) => b.goals - a.goals);

    let table = `<TABLE BORDER="1" CELLBORDER="1" CELLSPACING="0">
    <TR><TD>#</TD><TD>Jugador</TD><TD>Equipo</TD><TD>Goles</TD><TD>Minutos</TD></TR>`;
    sorted.forEach((p, i) => {
        table += `<TR>
      <TD>${i + 1}</TD><TD>${p.name}</TD><TD>${p.team}</TD>
      <TD>${p.goals}</TD><TD>${p.minutes.join(", ")}</TD>
    </TR>`;
    });
    table += `</TABLE>`;

    return `digraph Goleadores {
  node [shape=none];
  tabla [label=<${table}>];
}`;
}

// 6) Info General (DOT con tabla HTML)
export function generateGeneralInfoDOT(t) {
    const totalMatches = t.matches.length;
    const completed = t.matches.filter(m => m.score.includes("-")).length;
    const totalGoals = t.teams.reduce((sum, tm) => sum + tm.stats.goalsFor, 0);
    const avgGoals = completed ? (totalGoals / completed).toFixed(1) : "0.0";
    const totalPlayers = t.teams.reduce((sum, tm) => sum + tm.players.length, 0);
    const avgAge = totalPlayers ?
        (
            t.teams.reduce(
                (acc, tm) => acc + tm.players.reduce((a, g) => a + g.age, 0), 0
            ) / totalPlayers
        ).toFixed(2) :
        "0.00";

    const table = `<TABLE BORDER="1" CELLBORDER="1" CELLSPACING="0">
    <TR><TD>Propiedad</TD><TD>Valor</TD></TR>
    <TR><TD>Nombre</TD><TD>${t.name}</TD></TR>
    <TR><TD>Sede</TD><TD>${t.venue}</TD></TR>
    <TR><TD>Equipos</TD><TD>${t.teams.length}</TD></TR>
    <TR><TD>Partidos</TD><TD>${totalMatches}</TD></TR>
    <TR><TD>Completados</TD><TD>${completed}</TD></TR>
    <TR><TD>Total Goles</TD><TD>${totalGoals}</TD></TR>
    <TR><TD>Goles/Partido</TD><TD>${avgGoals}</TD></TR>
    <TR><TD>Edad Prom.</TD><TD>${avgAge}</TD></TR>
    <TR><TD>Fase</TD><TD>${t.currentPhase}</TD></TR>
  </TABLE>`;

    return `digraph InfoGeneral {
  node [shape=none];
  datos [label=<${table}>];
}`;
}