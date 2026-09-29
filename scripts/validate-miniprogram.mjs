import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = resolve(scriptDir, "..");
const miniRoot = join(projectRoot, "miniprogram");

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(miniRoot, relativePath), "utf8"));
}

const appConfig = readJson("app.json");
const projectConfig = readJson("project.config.json");
readJson("sitemap.json");
readJson("pages/today/index.json");

if (appConfig.pages.length !== 1 || appConfig.pages[0] !== "pages/today/index") {
  throw new Error("app.json must route to the Today page only.");
}
if (projectConfig.compileType !== "miniprogram" || projectConfig.appid !== "touristappid") {
  throw new Error("Unexpected development project configuration.");
}
if (!/^\d+\.\d+\.\d+$/.test(projectConfig.libVersion)) {
  throw new Error("project.config.json must select a concrete stable base-library version.");
}

const apiConfig = readFileSync(join(miniRoot, "config.js"), "utf8");
if (!/http:\/\/(?:127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}):8011\/api\/v1/.test(apiConfig)) {
  throw new Error("API_BASE_URL must target localhost or a private WLAN development address.");
}
if (/https?:\/\/(?!127\.0\.0\.1|192\.168\.)/.test(apiConfig)) {
  throw new Error("External API destinations are not allowed in the local mini-program config.");
}

const pageFiles = ["js", "json", "wxml", "wxss"].map((extension) =>
  join(miniRoot, "pages", "today", `index.${extension}`),
);
for (const file of pageFiles) readFileSync(file, "utf8");

const jsFiles = [];
function collectJs(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) collectJs(path);
    else if (entry.name.endsWith(".js")) jsFiles.push(path);
  }
}
collectJs(miniRoot);

for (const file of jsFiles) {
  const check = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (check.status !== 0) {
    throw new Error(`${file}\n${check.stderr || check.stdout}`);
  }
}

console.log("Mini-program self-check passed:");
console.log(`- app routes to ${appConfig.pages[0]}`);
console.log(`- project config parses (${projectConfig.appid})`);
console.log(`- ${jsFiles.length} JavaScript files pass syntax checks`);
console.log("- API target is localhost or a private WLAN address on port 8011");
