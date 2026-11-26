import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LINE =
  "That glass was squatting in my sunbeam, so I evicted it.";

function assertValidLine(line: string): void {
  if (line.length < 1 || line.length > MAX_LINE_CHARS) {
    throw new Error(
      `Line must be 1-${MAX_LINE_CHARS} characters, got ${line.length}.`,
    );
  }
  if (line.trim().length === 0) {
    throw new Error("Line must not be only whitespace.");
  }
  if (line !== line.trim()) {
    throw new Error("Line must not have leading or trailing whitespace.");
  }
  if (/[\r\n]/.test(line)) {
    throw new Error("Line must be a single line (no newline characters).");
  }
  // No control characters: the output must be one clean line of text.
  if (/[\u0000-\u001F\u007F]/.test(line)) {
    throw new Error("Line must not contain control characters.");
  }
  // No Unicode replacement character: U+FFFD signals a broken UTF-8
  // decode upstream, so a line containing it is never a clean result.
  if (line.includes("\uFFFD")) {
    throw new Error("Line must not contain the replacement character U+FFFD.");
  }
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// Maximum characters allowed in the single output line.
const MAX_LINE_CHARS = 200;

assertValidLine(LINE);

// Writes the validated line to <outDir>/entry.txt and verifies the write
// by reading it back; any mismatch aborts so a corrupt entry can never
// pass as a successful run.
function writeEntry(line: string): void {
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "entry.txt");
  writeFileSync(outPath, line, "utf8");

  // Read-back verification: catch partial or corrupted writes.
  const written = readFileSync(outPath, "utf8");
  if (written !== line) {
    throw new Error("Read-back mismatch: entry.txt does not match the line.");
  }
  // Byte-length check: the written bytes must encode exactly the line;
  // a mismatch here would mean the file was re-encoded or truncated.
  if (Buffer.byteLength(written, "utf8") !== Buffer.byteLength(line, "utf8")) {
    throw new Error("Byte-length mismatch: entry.txt is not the line.");
  }
}

writeEntry(LINE);
