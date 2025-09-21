/**
 * Lexer: Analizador Léxico para TourneyJS
 * Analiza el texto de entrada y devuelve tokens y errores.
 */
export default class Lexer {
    constructor(input) {
        this.input = input;
        this.pos = 0;
        this.line = 1;
        this.col = 1;
        this.tokens = [];
        this.errors = [];
    }

    _currentChar() {
        return this.input[this.pos] || null;
    }

    _advance(n = 1) {
        for (let i = 0; i < n; i++) {
            if (this._currentChar() === "\n") {
                this.line++;
                this.col = 1;
            } else {
                this.col++;
            }
            this.pos++;
        }
    }

    _match(regex, type) {
        regex.lastIndex = this.pos;
        const match = regex.exec(this.input);
        if (!match) return false;

        const lexema = match[0];
        if (type) {
            this.tokens.push({
                lexema,
                tipo: type,
                linea: this.line,
                columna: this.col,
            });
        }
        this._advance(lexema.length);
        return true;
    }

    _recordError() {
        const char = this._currentChar();
        const context = this.input.slice(this.pos, this.pos + 5);
        this.errors.push({
            lexema: char,
            tipo: "Token inválido",
            desc: `Símbolo desconocido cerca de '${context}'`,
            linea: this.line,
            columna: this.col,
        });
        this._advance();
    }

    tokenize() {
        while (this.pos < this.input.length) {
            // Ignorar espacios en blanco
            if (this._match(/^\s+/y, null)) continue;

            // Palabras reservadas
            if (this._match(/^(TORNEO|EQUIPOS|ELIMINACION|fase|partido|goleador|jugador|equipo|cuartos|semifinal|final|resultado|goleadores|posicion|numero|edad|minuto|nombre|sede)\b/iy, "RESERVADA")) continue;

            // Cadenas con manejo de errores
            const cadenaRegex = /^"([^"\\]|\\.)*"/y;
            cadenaRegex.lastIndex = this.pos;
            const cadenaMatch = cadenaRegex.exec(this.input);
            if (cadenaMatch) {
                this.tokens.push({
                    lexema: cadenaMatch[0],
                    tipo: "CADENA",
                    linea: this.line,
                    columna: this.col,
                });
                this._advance(cadenaMatch[0].length);
                continue;
            } else if (this._currentChar() === '"') {
                // Cadena sin cierre - error
                const start = this.pos;
                while (this._currentChar() && this._currentChar() !== "\n") {
                    this._advance();
                }
                const fragment = this.input.slice(start, this.pos);
                this.errors.push({
                    lexema: fragment,
                    tipo: "Error de cadena",
                    desc: "Cadena sin cierre",
                    linea: this.line,
                    columna: this.col,
                });
                continue;
            }

            // Símbolos
            if (this._match(/^(\{|\}|\[|\]|:|,)/y, "SIMBOLO")) continue;

            // Operador vs
            if (this._match(/^vs\b/y, "OPERADOR")) continue;

            // Números (incluyendo resultados como "3-1")
            if (this._match(/^\d+(-\d+)?/y, "NUMERO")) continue;

            // Identificadores (nombres con espacios y caracteres especiales)
            if (this._match(/^[A-Za-zÀ-ÿ_][A-Za-zÀ-ÿ0-9_\s]*/y, "IDENTIFICADOR")) continue;

            // Valores especiales
            if (this._match(/^(Pendiente|TBD)\b/y, "VALOR_ESPECIAL")) continue;

            // Si nada coincide, registrar error
            this._recordError();
        }

        return {
            tokens: this.tokens,
            errors: this.errors
        };
    }
}
