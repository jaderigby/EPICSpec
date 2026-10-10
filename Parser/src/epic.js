import { findTrailingInstruction, parseInstructionBlock, stringifyInstructionBlock } from "./instruction.js";
import { parseSectionLine, stringifySection } from "./section.js";
import { makeIssue } from "./utils.js";

export function parseEpicBody(cursor) {
  const issues = [];
  const preamble = [];
  const sections = [];
  let currentSection = null;
  let notes = null;

  while (!cursor.eof()) {
    const lineNumber = cursor.lineNumber();
    const line = cursor.peek();
    if (line === null) break;

    const trimmed = line.trim();

    if (trimmed === "") {
      cursor.next();
      continue;
    }

    // Freeflows are opaque: their contents never enter section/lyric parsing.
    const freeflowOpen = trimmed.match(/^\[\{&\} ([^\]\r\n]+)\]$/);
    if (freeflowOpen || trimmed === "[{&}]") {
      const isNotes = trimmed === "[{&}]";
      if (isNotes && cursor.peek(-1)?.trim() !== "") {
        issues.push(makeIssue("FREEFLOW_NOTES_SEPARATOR", "Freeflow Notes must be preceded by an empty line.", lineNumber));
      }
      const parsed = parseFreeflow(cursor, freeflowOpen?.[1] ?? null);
      issues.push(...parsed.issues);
      if (isNotes) {
        notes = parsed.node;
      } else {
        (currentSection ? currentSection.lines : preamble).push(parsed.node);
      }
      continue;
    }
    if (trimmed.startsWith("[{&}")) {
      issues.push(makeIssue("INVALID_FREEFLOW_OPENER", "Invalid freeflow opener.", lineNumber));
      cursor.next();
      continue;
    }

    if (trimmed.startsWith("[")) {
      const parsedSection = parseSectionLine(cursor.next(), lineNumber);
      issues.push(...parsedSection.issues);
      if (!parsedSection.section) continue;
      currentSection = { type: "EpicSection", section: parsedSection.section, lines: [] };
      sections.push(currentSection);
      continue;
    }

    const parsedLine = parseEpicLine(cursor.next(), lineNumber);
    issues.push(...parsedLine.issues);

    if (currentSection) {
      currentSection.lines.push(parsedLine.node);
    } else {
      preamble.push(parsedLine.node);
    }
  }

  return { body: { type: "EpicBody", preamble, sections, notes }, issues };
}

function parseFreeflow(cursor, label) {
  const startLine = cursor.lineNumber();
  const opener = cursor.next();
  const lines = [];
  const issues = [];
  let terminated = false;
  while (!cursor.eof()) {
    const line = cursor.next();
    if (label !== null && line.trim() === ":::") {
      terminated = true;
      break;
    }
    lines.push(line);
  }
  if (label !== null && !terminated) {
    issues.push(makeIssue("UNTERMINATED_FREEFLOW", "Labeled freeflow must end with a standalone ::: line.", startLine));
  }
  if (!lines.some(line => line.length > 0)) {
    issues.push(makeIssue("EMPTY_FREEFLOW", "Freeflow must contain at least one nonempty line.", startLine));
  }
  return {
    node: {
      type: label === null ? "EpicFreeflowNotes" : "EpicFreeflow",
      label,
      opener,
      text: lines.join("\n"),
      terminated,
      loc: { startLine, endLine: cursor.lineNumber() - 1 },
    },
    issues,
  };
}

function parseEpicLine(raw, line) {
  const issues = [];
  const trimmed = raw.trim();

  if (trimmed.startsWith("{{") && trimmed.endsWith("}}")) {
    const parsedInstruction = parseInstructionBlock(trimmed, line);
    issues.push(...parsedInstruction.issues);
    return {
      node: { type: "EpicInstructionLine", instruction: parsedInstruction.block, loc: { startLine: line, endLine: line } },
      issues,
    };
  }

  const trailingInstructionIndex = findTrailingInstruction(raw);
  if (trailingInstructionIndex >= 0) {
    const textPart = raw.slice(0, trailingInstructionIndex).trim();
    const instructionRaw = raw.slice(trailingInstructionIndex).trim();
    const parsedInstruction = parseInstructionBlock(instructionRaw, line);
    issues.push(...parsedInstruction.issues);

    return {
      node: {
        type: "EpicLyricLine",
        text: textPart,
        instruction: parsedInstruction.block,
        loc: { startLine: line, endLine: line },
      },
      issues,
    };
  }

  return {
    node: { type: "EpicLyricLine", text: trimmed, instruction: null, loc: { startLine: line, endLine: line } },
    issues,
  };
}

export function stringifyEpicBody(body) {
  const lines = [];

  for (const line of body.preamble || []) {
    lines.push(stringifyEpicLine(line));
  }

  if ((body.preamble || []).length > 0 && (body.sections || []).length > 0) {
    lines.push("");
  }

  for (const section of body.sections || []) {
    lines.push(stringifySection(section.section));
    for (const line of section.lines || []) {
      lines.push(stringifyEpicLine(line));
    }
    lines.push("");
  }
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  if (body.notes) {
    // Notes always have a preceding empty line, including notes-only bodies.
    lines.push("", stringifyFreeflow(body.notes));
  }
  return lines.join("\n");
}

function stringifyFreeflow(node) {
  const opener = node.opener ?? (node.label === null ? "[{&}]" : `[{&} ${node.label}]`);
  const raw = `${opener}\n${node.text}`;
  return node.type === "EpicFreeflow" && node.terminated ? `${raw}\n:::` : raw;
}

function stringifyEpicLine(line) {
  if (line.type === "EpicFreeflow") return stringifyFreeflow(line);
  if (line.type === "EpicInstructionLine") {
    return stringifyInstructionBlock(line.instruction);
  }

  let text = line.text || "";
  if (line.instruction) text += (text ? " " : "") + stringifyInstructionBlock(line.instruction);
  return text;
}
