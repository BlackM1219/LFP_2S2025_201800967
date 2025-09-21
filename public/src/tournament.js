class Tournament {
    constructor(ast) {
        this.name = "";
        this.teams = [];
        this.matches = [];
        this._buildFromAST(ast);
    }

    _buildFromAST(ast) {
        for (const sec of ast.secciones) {
            if (sec.tipo === "Torneo") {
                this.name = sec.attrs ? sec.attrs.nombre : "Torneo";
            }
            if (sec.tipo === "Equipos") {
                this.teams = sec.equipos.map(e => ({ name: e.name, stats: this._initStats() }));
            }
            if (sec.tipo === "Eliminacion") {
                this.matches = sec.matches;
            }
        }
    }

    _initStats() {
        return { played: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
    }

    computeStats() {
        this.matches.forEach(m => {
            if (!m.score || !m.score.includes("-")) return;
            const [hg, ag] = m.score.split("-").map(Number);
            const home = this.teams.find(t => t.name === m.home);
            const away = this.teams.find(t => t.name === m.away);
            if (!home || !away) return;

            home.stats.played++;
            away.stats.played++;
            home.stats.goalsFor += hg;
            home.stats.goalsAgainst += ag;
            away.stats.goalsFor += ag;
            away.stats.goalsAgainst += hg;

            if (hg > ag) { home.stats.won++;
                home.stats.points += 3;
                away.stats.lost++; } else if (hg < ag) { away.stats.won++;
                away.stats.points += 3;
                home.stats.lost++; } else { home.stats.draw++;
                away.stats.draw++;
                home.stats.points++;
                away.stats.points++; }
        });
    }
}

export default Tournament;