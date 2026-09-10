"use strict";
function resolveRole({ isAdmin, clientId, restaurantId }) {
    if (isAdmin) return "admin";
    if (clientId) return "cliente";
    if (restaurantId) return "restaurante";
    return null;
}
function isRoleAllowed(role, allowedRoles) { return Boolean(role && new Set(allowedRoles).has(role)); }
function ownsResource(role, profileId, resource) {
    if (role === "admin") return true;
    if (role === "cliente") return Number(resource?.id_cliente) === Number(profileId);
    if (role === "restaurante") return Number(resource?.id_restaurante) === Number(profileId);
    return false;
}
module.exports = { isRoleAllowed, ownsResource, resolveRole };
