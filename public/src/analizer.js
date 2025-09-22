// src/analyzer.js

/**
 * analyzer.js
 * Generador tolerante de standings, goleadores y DOT a partir de tokens
 * o de un objeto tournament.
 */

/**
 * Escapa comillas dobles para etiquetas DOT
 */
function escape(s) {
    if (s == null) return "";
    return String(s).replace(/"/g, '\\"');
}

/**
 * computeStandings: calcula la tabla de posiciones
 */
export function computeStandings(tournament, options) {
    options = options || { win: 3, draw: 1 };

    // clonamos equipos con sus stats iniciales
    var teams = (Array.isArray(tournament.teams) ? tournament.teams : [])
        .map(function(t) {
            return {
                name: t.name,
                stats: t.stats ? Object.assign({}, t.stats) : {},
                phaseReached: t.phaseReached || ""
            };
        });

    // si todos vienen en cero, recontamos a partir de matches
    var needsRecalc = teams.every(function(t) {
        return (t.stats.played || 0) === 0 && (t.stats.points || 0) === 0;
    });
    if (teams.length > 0 && needsRecalc) {
        var map = {};
        teams.forEach(function(t) { map[t.name] = t; });

        (tournament.matches || []).forEach(function(m) {
            if (!m.score || typeof m.score !== "string") return;
            var parts = m.score.split("-").map(function(x) {
                return Number(x.trim() || 0);
            });
            if (parts.length < 2) return;
            var hg = parts[0],
                ag = parts[1];
            var home = map[m.home],
                away = map[m.away];
            if (!home || !away) return;

            home.stats.played = (home.stats.played || 0) + 1;
            away.stats.played = (away.stats.played || 0) + 1;
            home.stats.goalsFor = (home.stats.goalsFor || 0) + hg;
            home.stats.goalsAgainst = (home.stats.goalsAgainst || 0) + ag;
            away.stats.goalsFor = (away.stats.goalsFor || 0) + ag;
            away.stats.goalsAgainst = (away.stats.goalsAgainst || 0) + hg;

            if (hg > ag) {
                home.stats.won = (home.stats.won || 0) + 1;
                home.stats.points = (home.stats.points || 0) + options.win;
                away.stats.lost = (away.stats.lost || 0) + 1;
            } else if (ag > hg) {
                away.stats.won = (away.stats.won || 0) + 1;
                away.stats.points = (away.stats.points || 0) + options.win;
                home.stats.lost = (home.stats.lost || 0) + 1;
            } else {
                home.stats.draw = (home.stats.draw || 0) + 1;
                away.stats.draw = (away.stats.draw || 0) + 1;
                home.stats.points = (home.stats.points || 0) + options.draw;
                away.stats.points = (away.stats.points || 0) + options.draw;
            }
        });
    }

    // construimos el array final y calculamos diferencia de gol
    var result = teams.map(function(t) {
        var s = t.stats || {};
        return {
            name: t.name,
            phaseReached: t.phaseReached,
            stats: Object.assign({}, s, {
                goalDifference: (s.goalsFor || 0) - (s.goalsAgainst || 0)
            })
        };
    });

    // orden
    result.sort(function(a, b) {
        var pa = a.stats.points || 0;
        var pb = b.stats.points || 0;
        if (pb !== pa) return pb - pa;

        var da = a.stats.goalDifference || 0;
        var db = b.stats.goalDifference || 0;
        if (db !== da) return db - da;

        var ga = a.stats.goalsFor || 0;
        var gb = b.stats.goalsFor || 0;
        if (gb !== ga) return gb - ga;

        return a.name.localeCompare(b.name);
    });

    return result;
}

/**
 * computeScorers: genera ranking de goleadores
 */
export function computeScorers(tournament) {
    var map = {};
    (tournament.matches || []).forEach(function(m) {
        (Array.isArray(m.scorers) ? m.scorers : []).forEach(function(s) {
            var key = s.name + "||" + (s.team || "");
            if (!map[key]) {
                map[key] = { name: s.name, team: s.team, goals: 0, minutes: [] };
            }
            map[key].goals++;
            if (s.minute != null) map[key].minutes.push(s.minute);
        });
    });

    var arr = [];
    for (var k in map)
        if (map.hasOwnProperty(k)) arr.push(map[k]);

    arr.sort(function(a, b) {
        if (b.goals !== a.goals) return b.goals - a.goals;
        return a.name.localeCompare(b.name);
    });
    return arr;
}

/**
 * generateBracketDOT: crea un grafo DOT agrupado por fases
 */
export function generateBracketDOT(tournament, opts) {
    opts = opts || { groupByPhase: true };
    var phases = {};

    (tournament.matches || []).forEach(function(m, idx) {
        var phase = m.phase || "Eliminación";
        if (!phases[phase]) phases[phase] = [];
        phases[phase].push({ match: m, idx: idx });
    });

    var dot = "digraph Bracket {\n";
    dot += "  rankdir=TB;\n";
    dot += "  node [shape=box, style=filled, fillcolor=white];\n";
    dot += "  labelloc=top;\n";
    dot += '  label="' + escape(tournament.name) + '";\n\n';

    var phaseIndex = 0;
    for (var ph in phases) {
        if (!phases.hasOwnProperty(ph)) continue;
        if (opts.groupByPhase) {
            dot += "  subgraph cluster_" + phaseIndex + " {\n";
            dot += '    label="' + escape(ph) + '";\n';
            dot += "    color=\"#999999\";\n";
        }
        phases[ph].forEach(function(obj) {
            var m = obj.match;
            var idx = obj.idx;
            dot +=
                "    m" +
                idx +
                ' [label="' +
                escape(m.home) +
                " " +
                escape(m.score || "") +
                " " +
                escape(m.away) +
                '"];\n';
        });
        if (opts.groupByPhase) {
            dot += "  }\n\n";
        }
        phaseIndex++;
    }

    dot += "}\n";
    return dot;
}

/**
 * analyzeTournament: agrupa el flujo computeStandings + computeScorers + DOT + totales
 */
export function analyzeTournament(tournament) {
    var standings = computeStandings(tournament);
    var scorers = computeScorers(tournament);
    var bracketDOT = generateBracketDOT(tournament);
    var totalMatches = (tournament.matches || []).length;
    var totalGoals = (tournament.matches || []).reduce(function(acc, m) {
        if (!m.score) return acc;
        var parts = m.score.split("-").map(function(x) {
            return Number(x.trim() || 0);
        });
        return parts.length >= 2 ? acc + parts[0] + parts[1] : acc;
    }, 0);

    return {
        tournament: tournament,
        standings: standings,
        scorers: scorers,
        bracketDOT: bracketDOT,
        totalMatches: totalMatches,
        totalGoals: totalGoals
    };
}

/**
 * tokenScanToBasicTournament: fallback de parser que solo usa patrones simples
 */
function cleanLex(tok) {
    if (!tok) return "";
    if (tok.tipo === "CADENA") return tok.lexema.replace(/^"|"$/g, "");
    return tok.lexema;
}

function tokenScanToBasicTournament(tokens) {
    var basic = { name: "", sede: "", teams: [], matches: [] };
    var i = 0;

    while (i < tokens.length) {
        var tok = tokens[i];
        if (!tok) { i++; continue; }
        var L = tok.lexema.toUpperCase();

        // TORNEO
        if (L === "TORNEO") {
            var j = i + 1;
            while (j < tokens.length && tokens[j].lexema !== "{") j++;
            j++;
            while (j < tokens.length && tokens[j].lexema !== "}") {
                var t2 = tokens[j];
                if (
                    t2.tipo === "IDENTIFICADOR" &&
                    tokens[j + 1] &&
                    tokens[j + 1].lexema === ":"
                ) {
                    var key = t2.lexema.toLowerCase();
                    var valTok = tokens[j + 2];
                    var val = cleanLex(valTok);
                    if (key === "nombre") basic.name = val;
                    if (key === "sede") basic.sede = val;
                    j += 3;
                    if (tokens[j] && tokens[j].lexema === ",") j++;
                    continue;
                }
                j++;
            }
            i = j + 1;
            continue;
        }

        // EQUIPOS
        if (L === "EQUIPOS") {
            var k = i + 1;
            while (k < tokens.length && tokens[k].lexema !== "{") k++;
            k++;
            while (k < tokens.length && tokens[k].lexema !== "}") {
                var t3 = tokens[k];
                if (
                    (t3.tipo === "CADENA" || t3.tipo === "IDENTIFICADOR") &&
                    tokens[k - 1] &&
                    tokens[k - 1].lexema === ":"
                ) {
                    basic.teams.push({
                        name: cleanLex(t3),
                        stats: {
                            played: 0,
                            won: 0,
                            draw: 0,
                            lost: 0,
                            goalsFor: 0,
                            goalsAgainst: 0,
                            points: 0
                        }
                    });
                }
                k++;
            }
            i = k + 1;
            continue;
        }

        // ELIMINACION
        if (L === "ELIMINACION") {
            var mIdx = i + 1;
            while (mIdx < tokens.length && tokens[mIdx].lexema !== "{") mIdx++;
            mIdx++;
            while (mIdx < tokens.length && tokens[mIdx].lexema !== "}") {
                if (
                    tokens[mIdx] &&
                    tokens[mIdx].lexema.toLowerCase() === "vs"
                ) {
                    // home
                    var h = mIdx - 1;
                    while (h >= 0 && tokens[h].lexema === ",") h--;
                    var home = cleanLex(tokens[h]);
                    // away
                    var a = mIdx + 1;
                    while (a < tokens.length && tokens[a].lexema === ",") a++;
                    var away = cleanLex(tokens[a]);
                    // score
                    var score = "";
                    if (tokens[a + 1] && tokens[a + 1].tipo === "NUMERO") {
                        score = tokens[a + 1].lexema;
                    }
                    // scorers
                    var list = [];
                    var p = a + 2;
                    if (tokens[p] && tokens[p].lexema === "[") {
                        p++;
                        while (p < tokens.length && tokens[p].lexema !== "]") {
                            var tp = tokens[p];
                            if (
                                tp.tipo === "RESERVADA" &&
                                tp.lexema.toLowerCase() === "goleador"
                            ) {
                                var name = cleanLex(tokens[p + 1]);
                                var minute = null;
                                var q = p + 2;
                                while (
                                    q < tokens.length &&
                                    tokens[q].lexema.toLowerCase() !== "minuto"
                                ) {
                                    q++;
                                }
                                if (
                                    tokens[q] &&
                                    tokens[q].lexema.toLowerCase() === "minuto" &&
                                    tokens[q + 1] &&
                                    tokens[q + 1].tipo === "NUMERO"
                                ) {
                                    minute = tokens[q + 1].lexema;
                                }
                                list.push({ name: name, minute: minute });
                            }
                            p++;
                        }
                    }
                    basic.matches.push({ home: home, away: away, score: score, scorers: list });
                }
                mIdx++;
            }
            i = mIdx + 1;
            continue;
        }

        i++;
    }

    return basic;
}

/**
 * analyzeFromTokens: importa dinámicamente parser.js y tournament.js,
 * intenta el parser estricto y si falla hace fallback con tokenScan.
 */
export async function analyzeFromTokens(tokens, options) {
    options = options || { allowParseErrors: true };
    var ParserMod, TournamentMod;

    // dinámico import parser
    try {
        ParserMod = await
        import ("./parser.js");
    } catch (e) {
        ParserMod = null;
    }
    // dinámico import tournament
    try {
        TournamentMod = await
        import ("./tournament.js");
    } catch (e) {
        TournamentMod = null;
    }

    // si tenemos parser
    if (ParserMod && ParserMod.default) {
        try {
            var parser = new ParserMod.default(tokens);
            var ast = parser.parse();
            var tournamentObj = new TournamentMod.default(ast);
            if (typeof tournamentObj.computeStats === "function") {
                tournamentObj.computeStats();
            }
            return analyzeTournament(tournamentObj);
        } catch (err) {
            // si no permitimos fallback, relanzamos
            if (!options.allowParseErrors) throw err;

            console.warn(
                "Parser falló, usando fallback de tokens:",
                err && err.message ? err.message : err
            );

            var basic = tokenScanToBasicTournament(tokens);
            return analyzeTournament(basic);
        }
    }

    // sin parser, fallback directo
    if (!options.allowParseErrors) {
        throw new Error("Parser no disponible y allowParseErrors=false");
    }
    var basic = tokenScanToBasicTournament(tokens);
    return analyzeTournament(basic);
}