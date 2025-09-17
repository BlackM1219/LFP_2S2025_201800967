/**
 * tournament.js
 * Clase Tournament para gestión de torneos deportivos
 * 
 * Maneja la estructura de datos del torneo incluyendo equipos,
 * jugadores, partidos y cálculo de estadísticas.
 * 
 * @author Tu Nombre
 * @version 1.0
 * @date 2025
 */

/**
 * Clase Tournament - Gestión integral de torneos
 * 
 * Proporciona funcionalidades para crear, gestionar y calcular
 * estadísticas de torneos deportivos de eliminación directa.
 */
class Tournament {
    /**
     * Constructor de la clase Tournament
     * @param {Object} metadata - Metadatos del torneo
     */
    constructor(metadata = {}) {
        this.nombre = metadata.nombre || 'Torneo Sin Nombre';
        this.equiposCount = Number(metadata.equipos) || 0;
        this.sede = metadata.sede || '';
        this.fecha = metadata.fecha || new Date().toISOString().split('T')[0];
        
        // Estructuras de datos principales
        this.teams = [];        // Lista de equipos
        this.matches = [];      // Lista de todos los partidos
        this.phases = {};       // Partidos organizados por fase
        this.players = [];      // Lista de todos los jugadores
        this.scorers = [];      // Lista de goleadores
        
        // Estadísticas calculadas
        this.stats = {
            totalGoals: 0,
            totalMatches: 0,
            averageGoalsPerMatch: 0,
            averagePlayerAge: 0,
            currentPhase: ''
        };
    }

    /**
     * Añade un equipo al torneo
     * @param {Object} teamData - Datos del equipo
     */
    addTeam(teamData) {
        const team = {
            nombre: teamData.nombre || '',
            jugadores: teamData.jugadores || [],
            estadisticas: this._initTeamStats(),
            id: this.teams.length + 1
        };

        // Añadir jugadores del equipo a la lista global
        team.jugadores.forEach(jugador => {
            jugador.equipo = team.nombre;
            jugador.id = this.players.length + 1;
            this.players.push(jugador);
        });

        this.teams.push(team);
        this._updateStats();
    }

    /**
     * Inicializa las estadísticas de un equipo
     * @returns {Object} Estadísticas iniciales del equipo
     * @private
     */
    _initTeamStats() {
        return {
            partidosJugados: 0,
            partidosGanados: 0,
            partidosPerdidos: 0,
            partidosEmpatados: 0,
            golesFavor: 0,
            golesContra: 0,
            diferencia: 0,
            puntos: 0,
            faseAlcanzada: 'Grupo'
        };
    }

    /**
     * Añade un partido al torneo
     * @param {Object} matchData - Datos del partido
     * @param {string} phase - Fase del torneo
     */
    addMatch(matchData, phase = 'general') {
        const match = {
            equipo1: matchData.equipo1 || '',
            equipo2: matchData.equipo2 || '',
            resultado: matchData.resultado || '',
            goleadores: matchData.goleadores || [],
            fase: phase,
            fecha: matchData.fecha || new Date().toISOString().split('T')[0],
            estado: matchData.resultado ? 'finalizado' : 'pendiente',
            id: this.matches.length + 1
        };

        // Añadir a la lista general
        this.matches.push(match);

        // Añadir a la fase correspondiente
        if (!this.phases[phase]) {
            this.phases[phase] = [];
        }
        this.phases[phase].push(match);

        // Actualizar estadísticas si el partido está finalizado
        if (match.estado === 'finalizado') {
            this._updateMatchStats(match);
        }

        this._updateStats();
    }

    /**
     * Actualiza las estadísticas basadas en un partido
     * @param {Object} match - Partido a procesar
     * @private
     */
    _updateMatchStats(match) {
        if (!match.resultado || !match.resultado.includes('-')) {
            return; // No se puede procesar sin resultado válido
        }

        const [goles1, goles2] = match.resultado.split('-').map(Number);
        
        // Buscar equipos
        const team1 = this.teams.find(t => t.nombre === match.equipo1);
        const team2 = this.teams.find(t => t.nombre === match.equipo2);

        if (!team1 || !team2) {
            console.warn(`Equipos no encontrados para el partido: ${match.equipo1} vs ${match.equipo2}`);
            return;
        }

        // Actualizar estadísticas del equipo 1
        team1.estadisticas.partidosJugados++;
        team1.estadisticas.golesFavor += goles1;
        team1.estadisticas.golesContra += goles2;
        team1.estadisticas.diferencia = team1.estadisticas.golesFavor - team1.estadisticas.golesContra;

        // Actualizar estadísticas del equipo 2
        team2.estadisticas.partidosJugados++;
        team2.estadisticas.golesFavor += goles2;
        team2.estadisticas.golesContra += goles1;
        team2.estadisticas.diferencia = team2.estadisticas.golesFavor - team2.estadisticas.golesContra;

        // Determinar ganador y actualizar estadísticas
        if (goles1 > goles2) {
            team1.estadisticas.partidosGanados++;
            team1.estadisticas.puntos += 3;
            team2.estadisticas.partidosPerdidos++;
        } else if (goles2 > goles1) {
            team2.estadisticas.partidosGanados++;
            team2.estadisticas.puntos += 3;
            team1.estadisticas.partidosPerdidos++;
        } else {
            team1.estadisticas.partidosEmpatados++;
            team1.estadisticas.puntos += 1;
            team2.estadisticas.partidosEmpatados++;
            team2.estadisticas.puntos += 1;
        }

        // Actualizar fase alcanzada
        this._updateTeamPhase(team1, match.fase, goles1 > goles2);
        this._updateTeamPhase(team2, match.fase, goles2 > goles1);

        // Procesar goleadores
        this._processScorers(match);
    }

    /**
     * Actualiza la fase alcanzada por un equipo
     * @param {Object} team - Equipo
     * @param {string} phase - Fase actual
     * @param {boolean} won - Si el equipo ganó
     * @private
     */
    _updateTeamPhase(team, phase, won) {
        const phaseHierarchy = {
            'cuartos': 1,
            'semifinal': 2,
            'final': 3,
            'campeon': 4
        };

        const currentPhaseLevel = phaseHierarchy[team.estadisticas.faseAlcanzada.toLowerCase()] || 0;
        const newPhaseLevel = phaseHierarchy[phase.toLowerCase()] || 0;

        if (won && newPhaseLevel > currentPhaseLevel) {
            team.estadisticas.faseAlcanzada = phase.charAt(0).toUpperCase() + phase.slice(1);
        }
    }

    /**
     * Procesa los goleadores de un partido
     * @param {Object} match - Partido
     * @private
     */
    _processScorers(match) {
        if (!Array.isArray(match.goleadores)) {
            return;
        }

        match.goleadores.forEach(goleador => {
            // Buscar si el goleador ya existe
            let scorer = this.scorers.find(s => s.nombre === goleador.nombre || s.nombre === goleador);
            
            if (!scorer) {
                // Buscar el jugador en la lista de jugadores
                const player = this.players.find(p => p.nombre === (goleador.nombre || goleador));
                
                scorer = {
                    nombre: goleador.nombre || goleador,
                    equipo: player?.equipo || 'Desconocido',
                    goles: 0,
                    minutosGol: []
                };
                this.scorers.push(scorer);
            }

            scorer.goles++;
            if (goleador.minuto) {
                scorer.minutosGol.push(goleador.minuto);
            }
        });

        // Ordenar goleadores por número de goles
        this.scorers.sort((a, b) => b.goles - a.goles);
    }

    /**
     * Actualiza las estadísticas generales del torneo
     * @private
     */
    _updateStats() {
        const finishedMatches = this.matches.filter(m => m.estado === 'finalizado');
        
        this.stats.totalMatches = finishedMatches.length;
        this.stats.totalGoals = this.teams.reduce((sum, team) => sum + team.estadisticas.golesFavor, 0);
        this.stats.averageGoalsPerMatch = this.stats.totalMatches > 0 ? 
            (this.stats.totalGoals / this.stats.totalMatches).toFixed(2) : 0;

        // Calcular edad promedio de jugadores
        if (this.players.length > 0) {
            const totalAge = this.players.reduce((sum, player) => sum + (player.edad || 0), 0);
            this.stats.averagePlayerAge = (totalAge / this.players.length).toFixed(2);
        }

        // Determinar fase actual
        this.stats.currentPhase = this._getCurrentPhase();
    }

    /**
     * Determina la fase actual del torneo
     * @returns {string} Nombre de la fase actual
     * @private
     */
    _getCurrentPhase() {
        const phaseOrder = ['cuartos', 'semifinal', 'final'];
        
        for (let i = phaseOrder.length - 1; i >= 0; i--) {
            const phase = phaseOrder[i];
            if (this.phases[phase] && this.phases[phase].some(m => m.estado === 'pendiente')) {
                return phase.charAt(0).toUpperCase() + phase.slice(1);
            }
        }

        return 'Finalizado';
    }

    /**
     * Obtiene la tabla de posiciones ordenada
     * @returns {Array} Equipos ordenados por posición
     */
    getStandings() {
        return [...this.teams].sort((a, b) => {
            // Ordenar por puntos, luego por diferencia de goles, luego por goles a favor
            if (b.estadisticas.puntos !== a.estadisticas.puntos) {
                return b.estadisticas.puntos - a.estadisticas.puntos;
            }
            if (b.estadisticas.diferencia !== a.estadisticas.diferencia) {
                return b.estadisticas.diferencia - a.estadisticas.diferencia;
            }
            return b.estadisticas.golesFavor - a.estadisticas.golesFavor;
        });
    }

    /**
     * Obtiene el ranking de goleadores
     * @returns {Array} Goleadores ordenados por número de goles
     */
    getTopScorers() {
        return [...this.scorers].sort((a, b) => {
            if (b.goles !== a.goles) {
                return b.goles - a.goles;
            }
            return a.nombre.localeCompare(b.nombre);
        });
    }

    /**
     * Obtiene estadísticas detalladas de un equipo
     * @param {string} teamName - Nombre del equipo
     * @returns {Object|null} Estadísticas del equipo
     */
    getTeamStats(teamName) {
        const team = this.teams.find(t => t.nombre === teamName);
        if (!team) return null;

        return {
            ...team.estadisticas,
            partidos: this.matches.filter(m => 
                m.equipo1 === teamName || m.equipo2 === teamName
            )
        };
    }

    /**
     * Obtiene información detallada de un jugador
     * @param {string} playerName - Nombre del jugador
     * @returns {Object|null} Información del jugador
     */
    getPlayerInfo(playerName) {
        const player = this.players.find(p => p.nombre === playerName);
        if (!player) return null;

        const scorer = this.scorers.find(s => s.nombre === playerName);
        
        return {
            ...player,
            goles: scorer?.goles || 0,
            minutosGol: scorer?.minutosGol || []
        };
    }

    /**
     * Valida la integridad de los datos del torneo
     * @returns {Array} Lista de problemas encontrados
     */
    validate() {
        const issues = [];

        // Validar que hay equipos
        if (this.teams.length === 0) {
            issues.push('No hay equipos registrados en el torneo');
        }

        // Validar nombres únicos de equipos
        const teamNames = new Set();
        this.teams.forEach(team => {
            if (teamNames.has(team.nombre)) {
                issues.push(`Equipo duplicado: ${team.nombre}`);
            }
            teamNames.add(team.nombre);
        });

        // Validar que los equipos en partidos existen
        this.matches.forEach((match, index) => {
            if (!this.teams.find(t => t.nombre === match.equipo1)) {
                issues.push(`Partido ${index + 1}: Equipo "${match.equipo1}" no existe`);
            }
            if (!this.teams.find(t => t.nombre === match.equipo2)) {
                issues.push(`Partido ${index + 1}: Equipo "${match.equipo2}" no existe`);
            }
        });

        // Validar formato de resultados
        this.matches.forEach((match, index) => {
            if (match.resultado && !match.resultado.match(/^\d+-\d+$/)) {
                issues.push(`Partido ${index + 1}: Formato de resultado inválido "${match.resultado}"`);
            }
        });

        return issues;
    }

    /**
     * Exporta el torneo a formato JSON
     * @returns {Object} Representación JSON del torneo
     */
    toJSON() {
        return {
            metadata: {
                nombre: this.nombre,
                equiposCount: this.equiposCount,
                sede: this.sede,
                fecha: this.fecha
            },
            teams: this.teams,
            matches: this.matches,
            phases: this.phases,
            players: this.players,
            scorers: this.scorers,
            stats: this.stats
        };
    }

    /**
     * Carga un torneo desde formato JSON
     * @param {Object} data - Datos JSON del torneo
     * @static
     */
    static fromJSON(data) {
        const tournament = new Tournament(data.metadata);
        
        tournament.teams = data.teams || [];
        tournament.matches = data.matches || [];
        tournament.phases = data.phases || {};
        tournament.players = data.players || [];
        tournament.scorers = data.scorers || [];
        tournament.stats = data.stats || tournament.stats;

        return tournament;
    }

    /**
     * Reinicia el torneo manteniendo solo la metadata
     */
    reset() {
        this.teams = [];
        this.matches = [];
        this.phases = {};
        this.players = [];
        this.scorers = [];
        this.stats = {
            totalGoals: 0,
            totalMatches: 0,
            averageGoalsPerMatch: 0,
            averagePlayerAge: 0,
            currentPhase: ''
        };
    }

    /**
     * Obtiene un resumen ejecutivo del torneo
     * @returns {Object} Resumen del torneo
     */
    getSummary() {
        const standings = this.getStandings();
        const topScorers = this.getTopScorers().slice(0, 3);

        return {
            nombre: this.nombre,
            equipos: this.teams.length,
            partidos: this.stats.totalMatches,
            goles: this.stats.totalGoals,
            promedioGoles: this.stats.averageGoalsPerMatch,
            edadPromedio: this.stats.averagePlayerAge,
            faseActual: this.stats.currentPhase,
            lider: standings[0]?.nombre || 'N/A',
            goleador: topScorers[0]?.nombre || 'N/A'
        };
    }
}

// Exportar para uso en Node.js y navegador
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Tournament;
}

if (typeof window !== 'undefined') {
    window.Tournament = Tournament;
}