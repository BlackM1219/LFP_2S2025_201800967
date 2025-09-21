/**
 * parser.js
 * Parser: construye el AST del Torneo a partir de tokens generados por el Lexer.
 */

// Definición de tipos de token que reconoce el parser
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

    /**
     * Devuelve el token actual o null si no hay más
     */
    _current() {
        return (this.tokens[this.pos] !== undefined) ? this.tokens[this.pos] : null;
    }

    /**
     * Consume un token del tipo esperado (y opcionalmente con lexema esperado).
     * Si no coincide, lanza error.
     */
    _eat(type, lexema = null) {
            const tok = this._current();
            if (!tok || tok.tipo !== type || (lexema && tok.lexema !== lexema)) {
                throw new Error(
                        `Se esperaba ${type}${lexema ? ` ('${lexema}')` : ""} en línea ${tok ? tok.linea : "?"}`
      );
    }
    this.pos++;
    return tok;
  }

  /**
   * Parser principal: recorre todas las secciones
   */
  parse() {
    const ast = { tipo: "Programa", secciones: [] };
    while (this._current()) {
      const tok = this._current();
      if (tok.lexema.toUpperCase() === "TORNEO") {
        ast.secciones.push(this.parseTorneo());
      } else if (tok.lexema.toUpperCase() === "EQUIPOS") {
        ast.secciones.push(this._parseEquipos());
      } else if (tok.lexema.toUpperCase() === "ELIMINACION") {
        ast.secciones.push(this._parseEliminacion());
      } else {
        // si no reconoce, avanza
        this.pos++;
      }
    }
    return ast;
  }

  /**
   * Parser de sección TORNEO
   */
  parseTorneo() {
    this._eat(TokenType.RESERVADA, "TORNEO");
    this._eat(TokenType.SIMBOLO, "{");
    const info = this._parseAttributes();
    this._eat(TokenType.SIMBOLO, "}");
    return { tipo: "Torneo", attrs: info };
  }

  /**
   * Parser de sección EQUIPOS
   */
  _parseEquipos() {
    this._eat(TokenType.RESERVADA, "EQUIPOS");
    this._eat(TokenType.SIMBOLO, "{");
    const equipos = [];
    while (this._current() && this._current().tipo === TokenType.IDENTIFICADOR) {
      const name = this._eat(TokenType.IDENTIFICADOR).lexema.trim();
      equipos.push({ name });
      if (this._current() && this._current().lexema === ",") this.pos++;
    }
    this._eat(TokenType.SIMBOLO, "}");
    return { tipo: "Equipos", equipos };
  }

  /**
   * Parser de sección ELIMINACION
   */
  _parseEliminacion() {
    this._eat(TokenType.RESERVADA, "ELIMINACION");
    this._eat(TokenType.SIMBOLO, "{");
    const matches = [];
    while (this._current() && this._current().tipo === TokenType.IDENTIFICADOR) {
      const home = this._eat(TokenType.IDENTIFICADOR).lexema;
      this._eat(TokenType.OPERADOR, "vs");
      const away = this._eat(TokenType.IDENTIFICADOR).lexema;
      let score = "";
      if (this._current() && this._current().tipo === TokenType.NUMERO) {
        score = this._eat(TokenType.NUMERO).lexema;
      }
      matches.push({ home, away, score });
      if (this._current() && this._current().lexema === ",") this.pos++;
    }
    this._eat(TokenType.SIMBOLO, "}");
    return { tipo: "Eliminacion", matches };
  }

  /**
   * Parser de atributos dentro de un bloque { ... }
   */
  _parseAttributes() {
    const attrs = {};
    while (this._current() && this._current().tipo === TokenType.IDENTIFICADOR) {
      const keyTok = this._eat(TokenType.IDENTIFICADOR);
      const key = keyTok.lexema.trim();
      this._eat(TokenType.SIMBOLO, ":");
      const valTok = this._current();
      if (!valTok) throw new Error(`Valor esperado para ${key}`);

      if (
        [TokenType.CADENA, TokenType.NUMERO, TokenType.IDENTIFICADOR, TokenType.VALOR_ESPECIAL].includes(valTok.tipo)
      ) {
        let value = valTok.lexema;
        if (valTok.tipo === TokenType.CADENA) {
          value = value.replace(/^"|"$/g, "");
        }
        attrs[key] = value;
        this.pos++;
      } else {
        throw new Error(`Valor inválido para ${key} en línea ${valTok.linea}`);
      }

      if (this._current() && this._current().lexema === ",") {
        this.pos++;
      }
    }
    return attrs;
  }
}