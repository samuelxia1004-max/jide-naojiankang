import { copyFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const distDir = "dist";

await copyFile(join(distDir, "index.html"), join(distDir, "404.html"));
await writeFile(join(distDir, "CNAME"), "www.jide-naojiankang.cn\n");
await writeFile(join(distDir, ".nojekyll"), "");

