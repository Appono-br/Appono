"use strict";

function parsePagination(query = {}, defaults = {}) {
    const defaultLimit = defaults.limit ?? 12;
    const maxLimit = defaults.maxLimit ?? 50;
    const page = Math.max(Number.parseInt(String(query.page ?? "1"), 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(String(query.limit ?? defaultLimit), 10) || defaultLimit, 1), maxLimit);
    return { page, limit, from: (page - 1) * limit, to: page * limit - 1 };
}

function paginationMeta(count, page, limit) {
    const total = Number(count ?? 0);
    return { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), total ? 1 : 0) };
}

module.exports = { paginationMeta, parsePagination };
