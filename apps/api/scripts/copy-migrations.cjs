const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "src", "db", "migrations");
const dest = path.join(__dirname, "..", "dist", "db", "migrations");

if (!fs.existsSync(src)) {
  console.log("No migrations folder to copy.");
  process.exit(0);
}

fs.mkdirSync(dest, { recursive: true });
for (const file of fs.readdirSync(src)) {
  if (file.endsWith(".sql")) {
    fs.copyFileSync(path.join(src, file), path.join(dest, file));
    console.log("Copied", file);
  }
}
