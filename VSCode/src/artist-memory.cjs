'use strict';
const ROLES = ['Author', 'Creator', 'Artist'];
function readAuthorship(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  let i = 0;
  while (i < lines.length && !lines[i].trim()) i++;
  if (lines[i++]?.trim() !== '---') return null;
  const fields = [];
  let generation = false;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '---') return fields.length === 1 && fields[0].value ? fields[0] : null;
    if (line.trim() === '[Generation]') generation = true;
    const match = /^[ \t]*(Artist|Author|Creator)[ \t]*:[ \t]*(.*)$/.exec(line);
    if (match && !generation) fields.push({ role: match[1], value: match[2].trim() });
  }
  return null;
}
function readArtist(text) {
  const field = readAuthorship(text);
  return field?.role === 'Artist' ? field.value : null;
}
function observe(state, file, artist) {
  if (!artist || (state.seen || []).includes(file)) return state;
  const recent = [...(state.recent || []), artist].slice(-3);
  return { ...state, seen: [...(state.seen || []), file], recent,
    preferred: recent.length === 3 && recent.every(value => value === artist) ? artist : state.preferred || null };
}
function observeAuthorship(state, file, field) {
  if (!field || !ROLES.includes(field.role) || !field.value) return state;
  const valueState = observe(state, file, field.value);
  // Existing v1 histories did not record roles. Start role counts separately;
  // retain learned values and their original once-per-file history.
  if ((state.roleSeen || []).includes(file)) return valueState;
  const counts = { ...state.roleCounts };
  counts[field.role] = (counts[field.role] || 0) + 1;
  const maximum = Math.max(...ROLES.map(role => counts[role] || 0));
  const leaders = ROLES.filter(role => counts[role] === maximum);
  let preferredRole = state.preferredRole || 'Author';
  if (maximum >= 3 && leaders.length === 1) preferredRole = leaders[0];
  return { ...valueState, roleSeen: [...(state.roleSeen || []), file], roleCounts: counts, preferredRole };
}
function escapeSnippet(value) { return value.replace(/[\\$}]/g, '\\$&'); }
function snippetBody(definition, preferred, preferredRole) {
  let body = Array.isArray(definition.body) ? definition.body.join('\n') : definition.body;
  if (ROLES.includes(preferredRole)) body = body.replace(/^(Artist|Author|Creator)(?=:[ \t]*\$\{\d+:)/m, preferredRole);
  if (!preferred) return body;
  // Keep the user-editable template and its numbered placeholder intact.
  return body.replace(/^((?:Artist|Author|Creator):[ \t]*\$\{\d+:)((?:\\.|[^}])*)(\})/m,
    (_, prefix, fallback, suffix) => prefix + escapeSnippet(preferred) + suffix);
}
module.exports = { readArtist, readAuthorship, observe, observeAuthorship, snippetBody };
