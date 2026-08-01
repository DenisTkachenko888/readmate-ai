import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const backlogPath = path.join(
  process.cwd(),
  ".vibecraft",
  "docs",
  "backlog.yaml"
);

if (!fs.existsSync(backlogPath)) {
  console.log("backlog.yaml not found, skipping YAML validation.");
  process.exit(0);
}

try {
  const source = fs.readFileSync(backlogPath, "utf8");
  yaml.load(source, { filename: backlogPath });
} catch (error) {
  console.error("Invalid YAML in .vibecraft/docs/backlog.yaml.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
