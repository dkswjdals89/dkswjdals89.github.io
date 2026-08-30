import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("pins PostCSS to a non-vulnerable version", () => {
  const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const lockfile = readFileSync(new URL("../pnpm-lock.yaml", import.meta.url), "utf8");

  assert.equal(packageJson.pnpm?.overrides?.postcss, "8.5.25");
  assert.match(lockfile, /^  postcss@8\.5\.25:/m);
});

const readLockfile = () => readFileSync(new URL("../pnpm-lock.yaml", import.meta.url), "utf8");

const resolvedVersions = (lockfile, name) => {
  const matches = [...lockfile.matchAll(new RegExp(`^  ${name}@(\\d+\\.\\d+\\.\\d+):`, "gm"))];
  assert.ok(matches.length > 0, `${name} is missing from pnpm-lock.yaml`);
  return matches.map((match) => match[1]);
};

const isAtLeast = (version, minimum) => {
  const actual = version.split(".").map(Number);
  const required = minimum.split(".").map(Number);

  for (let index = 0; index < 3; index += 1) {
    if (actual[index] !== required[index]) return actual[index] > required[index];
  }

  return true;
};

test("compares semantic versions before asserting advisory floors", () => {
  assert.equal(isAtLeast("4.3.0", "4.3.1"), false);
  assert.equal(isAtLeast("4.3.1", "4.3.1"), true);
  assert.equal(isAtLeast("4.3.2", "4.3.1"), true);
  assert.equal(isAtLeast("3.3.16", "3.3.18"), false);
  assert.equal(isAtLeast("5.0.0", "3.3.18"), true);
});

test("resolves js-yaml above the omap quadratic CPU advisory", () => {
  for (const version of resolvedVersions(readLockfile(), "js-yaml")) {
    assert.ok(isAtLeast(version, "4.3.1"), `js-yaml resolved to ${version}, below 4.3.1`);
  }
});

test("resolves nanoid above the zero-size infinite-loop advisory", () => {
  for (const version of resolvedVersions(readLockfile(), "nanoid")) {
    assert.ok(isAtLeast(version, "3.3.18"), `nanoid resolved to ${version}, below 3.3.18`);
  }
});
