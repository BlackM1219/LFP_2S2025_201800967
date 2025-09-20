/**
 * parser.js
 * Construye un AST a partir de los tokens.
 * Reconoce secciones: TORNEO, EQUIPOS, ELIMINACION.
 */

import { TokenType } from "./tokens.js"; // si quieres separar constantes, si no, define aquí.

export default class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.pos = 0;
    }

    _current() { return this.tokens[this.pos] || null; }
    _eat(type, lexema = null) {
        const tok = this._current();
        if (!tok || tok.tipo !== type || (lexema && tok.lexema !== lexema)) {
            throw new Error(`Se esperaba ${type} ${lexema || ""} en línea ${tok?.linea}`);
        }
        this.pos++;
        return tok;
    }

    parse() {
        const ast = { tipo: "Programa", secciones: [] };
        while (this._current()) {
            const tok = this._current();
            if (tok.lexema.toUpperCase() === "TORNEO") {
                ast.secciones.push(this._parseTorneo());
            } else if (tok.lexema.toUpperCase() === "EQUIPOS") {
                ast.secciones.push(this._parseEquipos());
            } else if (tok.lexema.toUpperCase() === "ELIMINACION") {
                ast.secciones.push(this._parseEliminacion());
            } else {
                this.pos++;
            }
        }
        return ast;
    }

    _parseTorneo() {
        this._eat(TokenType.RESERVADA, "TORNEO");
        this._eat(TokenType.SIMBOLO, "{");
        const attrs = this._parseKeyValues();
        this._eat(TokenType.SIMBOLO, "}");
        return { tipo: "Torneo", attrs };
    }

    _parseEquipos() {
        this._eat(TokenType.RESERVADA, "EQUIPOS");
        this._eat(TokenType.SIMBOLO, "{");
        const equipos = [];
        while (this._current()?.tipo === TokenType.IDENTIFICADOR) {
            const name = this._eat(TokenType.IDENTIFICADOR).lexema.trim();
            equipos.push({ tipo: "Equipo", name });
            if (this._current()?.lexema === ",") this.pos++;
        }
        this._eat(TokenType.SIMBOLO, "}");
        return { tipo: "Equipos", equipos };
    }

    _parseEliminacion() {
        this._eat(TokenType.RESERVADA, "ELIMINACION");
        this._eat(TokenType.SIMBOLO, "{");
        const matches = [];
        while (this._current() && this._current().tipo !== TokenType.SIMBOLO) {
            const home = this._eat(TokenType.IDENTIFICADOR).lexema;
            this._eat(TokenType.OPERADOR, "vs");
            const away = this._eat(TokenType.IDENTIFICADOR).lexema;
            let score = "";
            if (this._current()?.tipo === TokenType.NUMERO) {
                score = this._eat(TokenType.NUMERO).lexema;
            }
            matches.push({ home, away, score });
            if (this._current()?.lexema === ",") this.pos++;
        }
        this._eat(TokenType.SIMBOLO, "}");
        return { tipo: "Eliminacion", matches };
    }

    _parseKeyValues() {
        const attrs = {};
        while (this._current()?.tipo === TokenType.IDENTIFICADOR) {
            const key = this._eat(TokenType.IDENTIFICADOR).lexema;
            this._eat(TokenType.SIMBOLO, ":");
            const valTok = this._current();
            if ([TokenType.CADENA, TokenType.NUMERO, TokenType.IDENTIFICADOR].includes(valTok.tipo)) {
                attrs[key] = valTok.lexema.replace(/^"|"$/g, "");
                this.pos++;
            }
            if (this._current()?.lexema === ",") this.pos++;
        }
        return attrs;
    }
}
