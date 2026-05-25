#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_API_PAGE_SIZE = 2000;
const FRIDAY_BASE_URLS = {
  dev: "https://mcphub.inf.dev.sankuai.com",
  prod: "https://friday.sankuai.com",
  test: "https://friday.ai.test.sankuai.com",
};

function asString(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function normalizeKey(value) {
  return asString(value).toLowerCase();
}

function roleName(value) {
  const raw = asString(value);
  if (raw === "2" || raw === "owner" || raw === "OWNER" || raw === "MODERATOR") return "owner";
  if (raw === "1" || raw === "admin" || raw === "ADMIN") return "admin";
  return "member";
}

export function parseJsonFromText(text) {
  const raw = asString(text);
  if (!raw) throw new Error("empty JSON output");

  try {
    return JSON.parse(raw);
  } catch {
    // CLI tools may print login progress before the JSON payload.
  }

  const candidates = [
    { start: raw.indexOf("{"), end: raw.lastIndexOf("}") },
    { start: raw.indexOf("["), end: raw.lastIndexOf("]") },
  ].filter((item) => item.start >= 0 && item.end > item.start);

  for (const item of candidates) {
    try {
      return JSON.parse(raw.slice(item.start, item.end + 1));
    } catch {
      // Try the next possible JSON envelope.
    }
  }

  throw new Error("could not parse JSON from command output");
}

function firstArray(...values) {
  return values.find(Array.isArray) || [];
}

export function parseDaxiangMembers(raw) {
  if (Array.isArray(raw)) return normalizeMembers(raw);

  const members = firstArray(
    raw?.data?.data?.memberList,
    raw?.data?.memberList,
    raw?.memberList,
    raw?.data?.data?.members,
    raw?.data?.members,
    raw?.members,
    raw?.items,
  );

  return normalizeMembers(members);
}

export function normalizeMembers(members) {
  return members
    .map((member) => {
      if (typeof member === "string") {
        return {
          empId: "",
          joinTime: null,
          mis: asString(member),
          name: "",
          role: "member",
          uid: "",
        };
      }

      return {
        empId: asString(member.empId ?? member.employeeId ?? member.id),
        joinTime: member.joinTime ?? member.join_time ?? null,
        mis: asString(member.mis ?? member.login ?? member.username),
        name: asString(member.name ?? member.userName ?? member.displayName),
        role: roleName(member.role),
        uid: asString(member.uid ?? member.userId),
      };
    })
    .filter((member) => member.mis || member.empId || member.uid || member.name);
}

export function parseMisList(value) {
  const raw = asString(value);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("--mis-list JSON must be an array");
    return parsed.map(asString).filter(Boolean);
  } catch (error) {
    if (raw.startsWith("[") || raw.startsWith("{")) throw error;
  }

  return raw
    .split(/[,\n]/)
    .map(asString)
    .filter(Boolean);
}

export function normalizeSkillItems(items) {
  return items
    .map((item) => ({
      creator: asString(item.creator ?? item.author ?? item.owner),
      id: asString(item.id),
      name: asString(item.name ?? item.alias),
      updatedAt: asString(item.updatedAt ?? item.updateTime),
      visibility: asString(item.visibility),
    }))
    .filter((item) => item.id || item.name || item.creator);
}

export function extractSkillItems(raw) {
  if (Array.isArray(raw)) return normalizeSkillItems(raw);
  return normalizeSkillItems(
    firstArray(raw?.items, raw?.data?.items, raw?.data?.data?.items, raw?.result?.items),
  );
}

export function aggregateSkillCounts(members, skills) {
  const memberKeys = new Set();
  for (const member of members) {
    const key = normalizeKey(member.mis);
    if (key) memberKeys.add(key);
  }

  const skillsByCreator = new Map();
  const unmatchedByCreator = new Map();

  for (const skill of skills) {
    const creatorKey = normalizeKey(skill.creator);
    if (!creatorKey) continue;

    if (memberKeys.has(creatorKey)) {
      const bucket = skillsByCreator.get(creatorKey) || [];
      bucket.push(skill);
      skillsByCreator.set(creatorKey, bucket);
    } else {
      unmatchedByCreator.set(creatorKey, (unmatchedByCreator.get(creatorKey) || 0) + 1);
    }
  }

  const rows = members.map((member) => {
    const skillsForMember = skillsByCreator.get(normalizeKey(member.mis)) || [];
    const skillNames = skillsForMember
      .map((skill) => skill.name || skill.id)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    return {
      empId: member.empId,
      mis: member.mis,
      name: member.name,
      role: member.role || "member",
      skillCount: skillsForMember.length,
      skillNames,
      skills: skillsForMember,
      uid: member.uid,
    };
  });

  const unmatchedCreators = Array.from(unmatchedByCreator.entries())
    .map(([creator, count]) => ({ creator, count }))
    .sort((a, b) => b.count - a.count || a.creator.localeCompare(b.creator));

  return {
    matchedSkillCount: rows.reduce((sum, row) => sum + row.skillCount, 0),
    memberCount: rows.length,
    rows,
    scannedSkillCount: skills.length,
    unmatchedCreators,
  };
}

function escapeMarkdownCell(value) {
  const text = asString(value).replace(/\|/g, "\\|");
  return text || "-";
}

export function formatTable(rows) {
  const lines = [
    "| name | mis | empId | role | skills | skill names |",
    "| --- | --- | --- | --- | ---: | --- |",
  ];

  for (const row of rows) {
    lines.push(
      [
        escapeMarkdownCell(row.name),
        escapeMarkdownCell(row.mis),
        escapeMarkdownCell(row.empId),
        escapeMarkdownCell(row.role || "member"),
        String(row.skillCount),
        escapeMarkdownCell(row.skillNames.join("; ")),
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |"),
    );
  }

  return lines.join("\n");
}

function csvCell(value) {
  return `"${asString(value).replace(/"/g, '""')}"`;
}

export function formatCsv(rows) {
  const lines = ["name,mis,empId,role,skillCount,skillNames"];
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.name),
        csvCell(row.mis),
        csvCell(row.empId),
        csvCell(row.role || "member"),
        String(row.skillCount),
        csvCell(row.skillNames.join("; ")),
      ].join(","),
    );
  }
  return lines.join("\n");
}

function parseArgs(argv) {
  const options = {
    env: "prod",
    format: "md",
    apiPageSize: DEFAULT_API_PAGE_SIZE,
    pageSize: DEFAULT_PAGE_SIZE,
    refresh: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const readValue = () => {
      i += 1;
      if (i >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[i];
    };

    if (arg === "--gid") options.gid = readValue();
    else if (arg === "--format") options.format = readValue();
    else if (arg === "--env") options.env = readValue();
    else if (arg === "--api-page-size") options.apiPageSize = Number(readValue());
    else if (arg === "--page-size") options.pageSize = Number(readValue());
    else if (arg === "--max-pages") options.maxPages = Number(readValue());
    else if (arg === "--cache-file") options.cacheFile = readValue();
    else if (arg === "--members-file") options.membersFile = readValue();
    else if (arg === "--mis-file") options.misFile = readValue();
    else if (arg === "--mis-list") options.misList = readValue();
    else if (arg === "--skills-file") options.skillsFile = readValue();
    else if (arg === "--ciba") options.ciba = readValue();
    else if (arg === "--token") options.token = readValue();
    else if (arg === "--operator-mis") options.operatorMis = readValue();
    else if (arg === "--force-ciba") options.forceCiba = true;
    else if (arg === "--refresh") options.refresh = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`unknown argument: ${arg}`);
  }

  if (!Number.isFinite(options.pageSize) || options.pageSize < 1 || options.pageSize > 50) {
    throw new Error("--page-size must be a number from 1 to 50");
  }
  if (
    !Number.isFinite(options.apiPageSize) ||
    options.apiPageSize < 1 ||
    options.apiPageSize > 5000
  ) {
    throw new Error("--api-page-size must be a number from 1 to 5000");
  }
  if (options.maxPages !== undefined && (!Number.isFinite(options.maxPages) || options.maxPages < 1)) {
    throw new Error("--max-pages must be a positive number");
  }
  if (options.format === "table") options.format = "md";
  if (!["md", "json", "csv"].includes(options.format)) {
    throw new Error("--format must be one of: md, json, csv");
  }

  return options;
}

function usage() {
  return [
    "Usage: node scripts/group_skill_stats.mjs (--gid <daxiangGroupId> | --mis-list <json|csv> | --mis-file <path>) [options]",
    "",
    "Options:",
    "  --format md|json|csv        Output format. Default: md",
    "  --env dev|test|prod         Friday environment. Default: prod",
    "  --api-page-size <1-5000>    Direct Friday API page size. Default: 2000",
    "  --page-size <1-50>          mtskills page size. Default: 50",
    "  --max-pages <n>             Limit Friday pages for dry runs",
    "  --cache-file <path>         Cache Friday skill list JSON",
    "  --refresh                   Ignore and rewrite cache",
    "  --members-file <path>       Use saved oa-skills JSON instead of calling Daxiang",
    "  --mis-file <path>           Use a saved JSON array of MIS values",
    "  --mis-list <json|csv>       Use a JSON array or comma-separated MIS values",
    "  --skills-file <path>        Use saved mtskills JSON/list instead of scanning Friday",
    "  --operator-mis <mis>        Pass MIS to oa-skills as the acting user",
    "  --ciba <mis>                Use CIBA for mtskills and force CIBA for oa-skills",
    "  --token <access-token>      Use an explicit Friday access token",
    "  --force-ciba               Force oa-skills CIBA when using --operator-mis",
  ].join("\n");
}

function runCommand(command, args) {
  try {
    return execFileSync(command, args, {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const stdout = error.stdout ? String(error.stdout) : "";
    const stderr = error.stderr ? String(error.stderr) : "";
    throw new Error(
      [`${command} ${args.join(" ")} failed`, stdout.trim(), stderr.trim()].filter(Boolean).join("\n"),
    );
  }
}

function readJsonFile(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function defaultCacheFile(env) {
  return join(tmpdir(), "group-skill-stats", `friday-skills-${env}.json`);
}

function ssoEnvForFridayEnv(env) {
  return env === "prod" ? "product" : "test";
}

function cibaEnvForFridayEnv(env) {
  return env === "prod" ? "prod" : "test";
}

function mtskillsTokenDir() {
  return process.env.MTSKILLS_SSO_TOKEN_DIR || join(homedir(), ".mtskills_sso_config");
}

function defaultMtskillsTokenFile(env) {
  const clientId = env === "prod" ? "0968168675" : "e39169b175";
  const hash = createHash("sha1").update(`${clientId}_@_cli`).digest("hex");
  return join(mtskillsTokenDir(), ssoEnvForFridayEnv(env), `${hash}_tokens.json`);
}

function cibaTokenFile(mis, env) {
  return join(mtskillsTokenDir(), "ciba", cibaEnvForFridayEnv(env), `${mis}_tokens.json`);
}

function readAccessTokenFromFile(filePath) {
  if (!existsSync(filePath)) return "";
  const token = JSON.parse(readFileSync(filePath, "utf8"));
  return asString(token.access_token);
}

function readFridayAccessToken(options) {
  if (options.token) return options.token;
  if (options.ciba) return readAccessTokenFromFile(cibaTokenFile(options.ciba, options.env));
  return readAccessTokenFromFile(defaultMtskillsTokenFile(options.env));
}

function ensureCibaToken(options) {
  if (!options.ciba || readFridayAccessToken(options)) return;
  runCommand("mtskills", [
    "search",
    "--json",
    "--env",
    options.env,
    "--page-size",
    "1",
    "--page",
    "1",
    "--ciba",
    options.ciba,
  ]);
}

function loadMembers(options) {
  if (options.misList) {
    return normalizeMembers(parseMisList(options.misList));
  }
  if (options.misFile) {
    const raw = readJsonFile(options.misFile);
    if (!Array.isArray(raw)) throw new Error("--mis-file must contain a JSON array");
    return normalizeMembers(raw);
  }
  if (options.membersFile) {
    return parseDaxiangMembers(readJsonFile(options.membersFile));
  }
  if (!options.gid) {
    throw new Error("--gid is required unless --members-file, --mis-file, or --mis-list is provided");
  }

  const args = ["daxiang", "group", "list-members", "--user", "--gid", options.gid, "--raw"];
  if (options.ciba) {
    args.push("--mis", options.ciba, "--force-ciba");
  } else if (options.operatorMis) {
    args.push("--mis", options.operatorMis);
    if (options.forceCiba) args.push("--force-ciba");
  }

  return parseDaxiangMembers(parseJsonFromText(runCommand("oa-skills", args)));
}

async function fetchFridaySkillsViaApi(options) {
  ensureCibaToken(options);
  const accessToken = readFridayAccessToken(options);
  if (!accessToken) {
    throw new Error("No cached Friday access token found. Retry with --ciba <mis> or --token <access-token>.");
  }

  const baseUrl = FRIDAY_BASE_URLS[options.env];
  if (!baseUrl) throw new Error(`unsupported Friday environment: ${options.env}`);

  const allItems = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const url = new URL(`${baseUrl}/mcphub-api/skill/list`);
    url.searchParams.set("page", String(page));
    url.searchParams.set("pageSize", String(options.apiPageSize));

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "X-MTSKILLS-SSO-Env": ssoEnvForFridayEnv(options.env),
        "access-token": accessToken,
      },
    });
    if (!response.ok) {
      throw new Error(`Friday API failed: HTTP ${response.status}`);
    }

    const pageResult = await response.json();
    const items = extractSkillItems(pageResult);
    allItems.push(...items);

    const total = Number(pageResult?.result?.total ?? pageResult?.total ?? allItems.length);
    totalPages = Math.max(1, Math.ceil(total / options.apiPageSize));

    if (options.maxPages && page >= options.maxPages) break;
    page += 1;
  }

  return allItems;
}

function fetchFridaySkillsViaCli(options) {
  const allItems = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const args = [
      "search",
      "--json",
      "--env",
      options.env,
      "--page-size",
      String(options.pageSize),
      "--page",
      String(page),
    ];
    if (options.ciba) args.push("--ciba", options.ciba);

    const pageResult = parseJsonFromText(runCommand("mtskills", args));
    allItems.push(...extractSkillItems(pageResult));
    totalPages = Number(pageResult.totalPages || totalPages);

    if (options.maxPages && page >= options.maxPages) break;
    page += 1;
  }

  return allItems;
}

async function fetchFridaySkills(options) {
  try {
    return await fetchFridaySkillsViaApi(options);
  } catch (error) {
    if (options.maxPages) throw error;
    return fetchFridaySkillsViaCli(options);
  }
}

async function loadSkills(options) {
  if (options.skillsFile) {
    return extractSkillItems(readJsonFile(options.skillsFile));
  }

  const cacheFile = resolve(options.cacheFile || defaultCacheFile(options.env));
  if (!options.refresh && existsSync(cacheFile)) {
    return extractSkillItems(readJsonFile(cacheFile));
  }

  const skills = await fetchFridaySkills(options);
  mkdirSync(dirname(cacheFile), { recursive: true });
  writeFileSync(cacheFile, JSON.stringify(skills, null, 2));
  return skills;
}

export function formatResult(result, options) {
  const payload = {
    generatedAt: new Date().toISOString(),
    gid: options.gid || null,
    matchedSkillCount: result.matchedSkillCount,
    memberCount: result.memberCount,
    rows: result.rows,
    scannedSkillCount: result.scannedSkillCount,
    unmatchedCreators: result.unmatchedCreators,
  };

  if (options.format === "json") return JSON.stringify(payload, null, 2);
  if (options.format === "csv") return formatCsv(result.rows);
  return formatTable(result.rows);
}

export function runWithData(membersRaw, skillsRaw) {
  const members = Array.isArray(membersRaw) ? normalizeMembers(membersRaw) : parseDaxiangMembers(membersRaw);
  const skills = Array.isArray(skillsRaw) ? normalizeSkillItems(skillsRaw) : extractSkillItems(skillsRaw);
  return aggregateSkillCounts(members, skills);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }

  const members = loadMembers(options);
  const skills = await loadSkills(options);
  const result = aggregateSkillCounts(members, skills);
  console.log(formatResult(result, options));
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === currentFile) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
