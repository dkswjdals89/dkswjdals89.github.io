import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readPage = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const koreaDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

const getCompletedCareerYearsInKorea = (date = new Date()) => {
  const current = Object.fromEntries(
    koreaDateFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
  const hasNotReachedAnniversary = current.month < 7
    || (current.month === 7 && current.day < 1);

  return current.year - 2013 - (hasNotReachedAnniversary ? 1 : 0);
};

test("builds Korean and English resume routes with reciprocal locale metadata", () => {
  const korean = readPage("../dist/index.html");
  const english = readPage("../dist/en/index.html");

  assert.match(korean, /<html lang="ko">/);
  assert.match(english, /<html lang="en">/);
  assert.match(korean, /rel="alternate" hreflang="en" href="https:\/\/lukeahn89\.github\.io\/en\/"/);
  assert.match(english, /rel="alternate" hreflang="ko" href="https:\/\/lukeahn89\.github\.io\/"/);
  assert.match(korean, /href="\/en\/"[^>]*>\s*EN\s*</);
  assert.match(english, /href="\/"[^>]*>\s*KO\s*</);
});

test("renders localized leadership, accessible contact actions, and matching PDFs", () => {
  const korean = readPage("../dist/index.html");
  const english = readPage("../dist/en/index.html");
  const completedCareerYears = getCompletedCareerYearsInKorea();

  assert.match(korean, /Backend Developer \/ 접수·예약 개발 파트 리드/);
  assert.match(english, /Backend Developer \/ Reception &amp; Appointment Development Lead/);
  assert.match(korean, /data-contact-icon="github"/);
  assert.match(korean, /data-contact-icon="email"/);
  assert.match(english, /data-contact-icon="github"/);
  assert.match(english, /data-contact-icon="email"/);
  assert.match(korean, /href="\/resume\.pdf"/);
  assert.match(english, /href="\/resume-en\.pdf"/);
  assert.match(english, new RegExp(`Software engineer with ${completedCareerYears} years of experience`));
});

test("keeps the mobile header within the viewport", () => {
  const korean = readPage("../dist/index.html");

  assert.match(korean, /<nav class="no-print flex flex-col min-w-0/);
  assert.doesNotMatch(korean, /<nav class="[^"]*\bpr-28\b/);
});

test("omits the header principles grid and the contact note in both locales", () => {
  const korean = readPage("../dist/index.html");
  const english = readPage("../dist/en/index.html");

  assert.doesNotMatch(korean, /header-principles/);
  assert.doesNotMatch(english, /header-principles/);
  assert.doesNotMatch(korean, /테스트 코드와 코드 리뷰를 통한 품질 개선/);
  assert.doesNotMatch(english, /Improving quality through automated tests and code reviews/);
  assert.doesNotMatch(korean, /LLM Agent 시스템, 생성형 콘텐츠 워크플로우/);
  assert.doesNotMatch(english, /LLM agent systems, generative content workflows/);
});

test("omits the highlights band in both locales", () => {
  const korean = readPage("../dist/index.html");
  const english = readPage("../dist/en/index.html");

  assert.doesNotMatch(korean, /screen-highlights/);
  assert.doesNotMatch(english, /screen-highlights/);
  assert.doesNotMatch(korean, /소프트웨어 엔지니어 경력/);
  assert.doesNotMatch(english, /Years of software engineering/);
  assert.doesNotMatch(korean, /Elasticsearch, Redis 기반 성능 개선/);
});
