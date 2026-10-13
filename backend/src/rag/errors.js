"use strict";

class RagError extends Error {
    constructor(code, message, options = {}) {
        super(message);
        this.name = "RagError";
        this.code = code;
        this.status = options.status ?? 400;
        this.publicMessage = options.publicMessage ?? message;
        this.cause = options.cause;
    }
}

function assertRag(condition, code, message, options) {
    if (!condition) throw new RagError(code, message, options);
}

module.exports = { RagError, assertRag };
