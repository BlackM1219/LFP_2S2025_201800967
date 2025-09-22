export const TokenType = {
    RESERVADA: "RESERVADA",
    SIMBOLO: "SIMBOLO",
    IDENTIFICADOR: "IDENTIFICADOR",
    CADENA: "CADENA",
    NUMERO: "NUMERO",
    OPERADOR: "OPERADOR",
    VALOR_ESPECIAL: "VALOR_ESPECIAL",
};

export default class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.pos = 0;
    }

    _current() {
        return this.tokens[this.pos] || null;
    }

    _peek() {
        return this.tokens[this.pos + 1] || null;
    }

    _eat(type, lexema = null) {
        const tok = this._current();
        if (!tok ||
            (Array.isArray(type) ?
                !type.includes(tok.tipo) :
                tok.tipo !== type) ||
            (lexema && tok.lexema !== lexema)
        ) {
            throw new Error(
                `Se esperaba ${Array.isArray(type) ? type.join("/") : type}` +
                (lexema ? ` ('${lexema}')` : "") +
                ` en línea ${tok ? tok.linea : "?"}`
            );
        }
        this.pos++;
        return tok;
    }

    parse() {
        const ast = { tipo: "Programa", secciones: [] };
        while (this._current()) {
            const tok = this._current();
            const L = tok.lexema.toUpperCase();
            if (L === "TORNEO") {
                ast.secciones.push(this.parseTorneo());
            } else if (L === "EQUIPOS") {
                ast.secciones.push(this._parseEquipos());
            } else if (L === "ELIMINACION") {
                ast.secciones.push(this._parseEliminacion());
            } else {
                this.pos++;
            }
        }
        return ast;
    }

    parseTorneo() {
        this._eat(TokenType.RESERVADA, "TORNEO");
        this._eat(TokenType.SIMBOLO, "{");
        const info = this._parseAttributes();
        this._eat(TokenType.SIMBOLO, "}");
        return { tipo: "Torneo", attrs: info };
    }

    _parseEquipos() {
        this._eat(TokenType.RESERVADA, "EQUIPOS");
        this._eat(TokenType.SIMBOLO, "{");
        const equipos = [];
        while (this._current() && this._current().lexema !== "}") {
            if (this._current().lexema === ",") {
                this.pos++;
                continue;
            }
            // palabra reservada 'equipo'
            if (
                this._current().tipo === TokenType.RESERVADA &&
                this._current().lexema.toLowerCase() === "equipo"
            ) {
                this._eat(TokenType.RESERVADA, this._current().lexema);
                this._eat(TokenType.SIMBOLO, ":");
                // nombre como CADENA o IDENTIFICADOR
                const nameTok = this._eat([
                    TokenType.CADENA,
                    TokenType.IDENTIFICADOR,
                ]);
                const name = nameTok.lexema.replace(/^"|"$/g, "");
                equipos.push({ name });
                // opcional bloque de jugadores [...]
                if (this._current().lexema === "[") {
                    let depth = 0;
                    do {
                        if (this._current().lexema === "[") depth++;
                        if (this._current().lexema === "]") depth--;
                        this.pos++;
                    } while (depth > 0 && this._current());
                }
            } else {
                this.pos++;
            }
        }
        this._eat(TokenType.SIMBOLO, "}");
        return { tipo: "Equipos", equipos };
    }

    _parseEliminacion() {
        this._eat(TokenType.RESERVADA, "ELIMINACION");
        this._eat(TokenType.SIMBOLO, "{");
        const matches = [];

        while (this._current() && this._current().lexema !== "}") {
            // saltar fases: "cuartos:", "semifinal:", etc.
            if (
                this._current().tipo === TokenType.IDENTIFICADOR &&
                this._peek() &&
                this._peek().lexema === ":"
            ) {
                this.pos += 2;
                // opcional bloque [...]
                if (this._current().lexema === "[") {
                    let depth = 0;
                    do {
                        if (this._current().lexema === "[") depth++;
                        if (this._current().lexema === "]") depth--;
                        this.pos++;
                    } while (depth > 0 && this._current());
                }
                while (this._current() && this._current().lexema === ",") {
                    this.pos++;
                }
                continue;
            }

            // opcional 'partido:'
            if (
                this._current().tipo === TokenType.RESERVADA &&
                this._current().lexema.toLowerCase() === "partido"
            ) {
                this._eat(TokenType.RESERVADA, this._current().lexema);
                this._eat(TokenType.SIMBOLO, ":");
            }

            // equipo local
            const homeTok = this._current();
            const home =
                homeTok.tipo === TokenType.CADENA ?
                homeTok.lexema.replace(/^"|"$/g, "") :
                homeTok.lexema;
            this.pos++;

            // vs
            this._eat(TokenType.OPERADOR, "vs");

            // equipo visitante
            const awayTok = this._current();
            const away =
                awayTok.tipo === TokenType.CADENA ?
                awayTok.lexema.replace(/^"|"$/g, "") :
                awayTok.lexema;
            this.pos++;

            // marcador opcional
            let score = "";
            if (this._current() && this._current().tipo === TokenType.NUMERO) {
                score = this._eat(TokenType.NUMERO).lexema;
            }

            // bloque de goleadores
            const scorers = [];
            if (this._current().lexema === "[") {
                this._eat(TokenType.SIMBOLO, "[");
                while (this._current() && this._current().lexema !== "]") {
                    if (
                        this._current().tipo === TokenType.RESERVADA &&
                        this._current().lexema.toLowerCase() === "goleador"
                    ) {
                        this._eat(TokenType.RESERVADA, "goleador");
                        const nameTok = this._eat(TokenType.CADENA);
                        const name = nameTok.lexema.replace(/^"|"$/g, "");
                        this._eat(TokenType.RESERVADA, "minuto");
                        const minute = this._eat(TokenType.NUMERO).lexema;
                        scorers.push({ name, minute });
                    } else {
                        this.pos++;
                    }
                }
                this._eat(TokenType.SIMBOLO, "]");
            }

            matches.push({ home, away, score, scorers });

            if (this._current() && this._current().lexema === ",") {
                this.pos++;
            }
        }

        this._eat(TokenType.SIMBOLO, "}");
        return { tipo: "Eliminacion", matches };
    }

    _parseAttributes() {
        const attrs = {};
        while (
            this._current() &&
            this._current().tipo === TokenType.IDENTIFICADOR
        ) {
            const keyTok = this._eat(TokenType.IDENTIFICADOR);
            const key = keyTok.lexema.trim();
            this._eat(TokenType.SIMBOLO, ":");
            const valTok = this._current();
            if (!valTok) throw new Error(`Valor esperado para ${key}`);
            if (
                [
                    TokenType.CADENA,
                    TokenType.NUMERO,
                    TokenType.IDENTIFICADOR,
                    TokenType.VALOR_ESPECIAL,
                ].includes(valTok.tipo)
            ) {
                let value = valTok.lexema;
                if (valTok.tipo === TokenType.CADENA) {
                    value = value.replace(/^"|"$/g, "");
                }
                attrs[key] = value;
                this.pos++;
            } else {
                throw new Error(
                    `Valor inválido para ${key} en línea ${valTok.linea}`
                );
            }
            if (this._current() && this._current().lexema === ",") {
                this.pos++;
            }
        }
        return attrs;
    }
}