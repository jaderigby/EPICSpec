'use strict';
const ROLES = ['Artist', 'Author', 'Creator'];
function headerRoles(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  let first = lines.findIndex(line => line.trim());
  if (first < 0 || lines[first].trim() !== '---') return [];
  const fields = [];
  let generation = false;
  for (let line = first + 1; line < lines.length; line++) {
    if (lines[line].trim() === '---') return fields;
    if (lines[line].trim() === '[Generation]') generation = true;
    if (generation) continue;
    const match = /^([ \t]*)(Artist|Author|Creator)(?=[ \t]*:)/.exec(lines[line]);
    if (match) fields.push({ line, start: match[1].length, end: match[1].length + match[2].length, role: match[2] });
  }
  return [];
}
function alternatives(fields, current) {
  return ROLES.filter(role => role !== current.role && !fields.some(field => field.role === role));
}
module.exports = { headerRoles, alternatives };
