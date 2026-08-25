"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { paginationMeta, parsePagination } = require("../src/domain/pagination");

test("normaliza pagina e limita quantidade de registros", () => {
    assert.deepEqual(parsePagination({ page: "2", limit: "20" }), { page: 2, limit: 20, from: 20, to: 39 });
    assert.equal(parsePagination({ page: "-3", limit: "999" }).page, 1);
    assert.equal(parsePagination({ limit: "999" }).limit, 50);
});

test("calcula metadados de paginacao", () => {
    assert.deepEqual(paginationMeta(25, 2, 12), { page: 2, limit: 12, total: 25, totalPages: 3 });
    assert.equal(paginationMeta(0, 1, 12).totalPages, 0);
});
