import fs from "node:fs";
import path from "node:path";
import { parseDocument, stringifyDocument } from "./src/index.js";

const filePath = process.argv[2];

if (!filePath) {
  console.error("Usage: node test-runner.mjs <file>");
  process.exit(1);
}

// resolve relative paths safely
const resolvedPath = path.resolve(process.cwd(), filePath);

if (!fs.existsSync(resolvedPath)) {
  console.error(`File not found: ${resolvedPath}`);
  process.exit(1);
}

const text = fs.readFileSync(resolvedPath, "utf8");

const result = parseDocument(text);

console.log("=== PARSE RESULT ===");
console.log(JSON.stringify(result, null, 2));

console.log("\n=== ROUNDTRIP ===\n");
console.log(stringifyDocument(result.document));