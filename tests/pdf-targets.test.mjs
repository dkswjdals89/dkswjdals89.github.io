import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { pdfTargets } from "../scripts/pdf-targets.mjs";

test("defines one PDF target per locale route", () => {
  assert.deepEqual(pdfTargets, [
    { path: "/", output: "resume.pdf" },
    { path: "/en/", output: "resume-en.pdf" },
  ]);
});

test("passes the installed Chrome path to the PDF build", () => {
  const workflow = readFileSync(new URL("../.github/workflows/deploy.yml", import.meta.url), "utf8");

  assert.match(workflow, /id: setup-chrome/);
  assert.match(workflow, /CHROME_PATH: \$\{\{ steps\.setup-chrome\.outputs\.chrome-path \}\}/);
});

test("uses Chrome's no-sandbox mode only for the GitHub Actions PDF build", () => {
  const workflow = readFileSync(new URL("../.github/workflows/deploy.yml", import.meta.url), "utf8");
  const pdfGenerator = readFileSync(new URL("../scripts/generate-pdfs.mjs", import.meta.url), "utf8");

  assert.match(workflow, /CHROME_NO_SANDBOX: "true"/);
  assert.match(pdfGenerator, /process\.env\.CHROME_NO_SANDBOX === "true"/);
  assert.match(pdfGenerator, /"--no-sandbox"/);
});

test("makes standard builds produce localized PDFs and development print locally", () => {
  const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const printButton = readFileSync(new URL("../src/components/PrintButton.astro", import.meta.url), "utf8");

  assert.equal(packageJson.scripts.build, "astro build && node scripts/generate-pdfs.mjs");
  assert.match(printButton, /import\.meta\.env\.DEV/);
  assert.match(printButton, /window\.print\(\)/);
});

test("installs Korean fonts before the GitHub Actions PDF build", () => {
  const workflow = readFileSync(new URL("../.github/workflows/deploy.yml", import.meta.url), "utf8");
  const fontStep = workflow.indexOf("fonts-noto-cjk");
  const buildStep = workflow.indexOf("run: pnpm run build");

  assert.notEqual(fontStep, -1, "deploy.yml must install a Korean-capable font");
  assert.ok(fontStep < buildStep, "fonts must be installed before the PDF build runs");
});

test("declares a Korean-capable font stack so print output never falls back to DejaVu Sans", () => {
  const globalCss = readFileSync(new URL("../src/styles/global.css", import.meta.url), "utf8");

  assert.match(globalCss, /"Apple SD Gothic Neo"/);
  assert.match(globalCss, /"Noto Sans CJK KR"/);
});
