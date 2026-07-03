import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const visibleCopyFiles = [
  join(root, "src", "App.tsx"),
  join(root, "src", "contentBanks.ts"),
];
const forbiddenDiagnosticClaims = ["正常", "异常", "疑似痴呆", "高风险", "诊断为", "确诊"];
const restrictedToolNames = ["MMSE", "MoCA", "AD8"];

let failed = false;

for (const file of visibleCopyFiles) {
  const content = readFileSync(file, "utf8");
  for (const word of forbiddenDiagnosticClaims) {
    if (content.includes(word)) {
      console.error(`Forbidden diagnostic wording found in ${file}: ${word}`);
      failed = true;
    }
  }
  for (const name of restrictedToolNames) {
    if (content.includes(name)) {
      console.error(`Restricted instrument name found in visible copy ${file}: ${name}`);
      failed = true;
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log("Visible copy QA passed.");
