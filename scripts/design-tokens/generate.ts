import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import process from "node:process";

type TokenMap = Record<string, string>;

type SurfaceMode = {
  root: TokenMap;
  theme?: TokenMap;
};

type SurfaceSource = {
  light: SurfaceMode;
  dark?: SurfaceMode;
};

type AndroidMapping = {
  name: string;
  token: string;
};

type TokenSource = {
  artifact_version: string;
  created_at: string;
  updated_at: string;
  notes: string;
  tokens: {
    semantic: SurfaceSource;
    windows: SurfaceSource;
    site: SurfaceSource;
    android: SurfaceSource;
  };
  android_mappings: {
    color: AndroidMapping[];
    dimension: AndroidMapping[];
    fraction: AndroidMapping[];
    integer: AndroidMapping[];
    string: AndroidMapping[];
  };
};

type GeneratorMode = "generate" | "check" | "bootstrap" | "validate";

const ROOT_DIR = resolve(process.cwd());
const TOKENS_DIR = resolve(ROOT_DIR, "design", "tokens");
const SOURCE_REFERENCE = resolve(TOKENS_DIR, "reference.json");
const SCHEMA_PATH = resolve(TOKENS_DIR, "schema.json");
const WINDOWS_SOURCE_CSS = resolve(
  ROOT_DIR,
  "src",
  "ui",
  "setup",
  "pages",
  "CommunityGlows",
  "assets",
  "main.css",
);
const SITE_SOURCE_CSS = resolve(ROOT_DIR, "site", "src", "styles", "global.css");
const WINDOWS_OUTPUT = resolve(
  ROOT_DIR,
  "src",
  "ui",
  "setup",
  "pages",
  "CommunityGlows",
  "assets",
  "generated",
  "tokens.css",
);
const SITE_OUTPUT = resolve(ROOT_DIR, "site", "src", "styles", "generated", "tokens.css");
const ANDROID_RES_VALUES = resolve(
  ROOT_DIR,
  "src-tauri",
  "plugins",
  "android-webview",
  "android",
  "src",
  "main",
  "res",
  "values",
  "communityglows_tokens.xml",
);
const ANDROID_RES_VALUES_NIGHT = resolve(
  ROOT_DIR,
  "src-tauri",
  "plugins",
  "android-webview",
  "android",
  "src",
  "main",
  "res",
  "values-night",
  "communityglows_tokens.xml",
);
const ANDROID_MAPPINGS_PATH = resolve(TOKENS_DIR, "android-mappings.json");
const WINDOWS_SOURCE_NAME = basename(WINDOWS_SOURCE_CSS);
const SITE_SOURCE_NAME = basename(SITE_SOURCE_CSS);
// Generated output must remain byte-for-byte stable across the Node versions
// supported locally and in CI.
const GENERATOR_ID = "communityglows-design-tokens-generator@1.0.0";

type ParsedCssTokens = {
  root: TokenMap;
  dark: TokenMap;
  theme?: TokenMap;
  darkTheme?: TokenMap;
};

function usage(): never {
  console.error(
    "Usage: pnpm exec tsx scripts/design-tokens/generate.ts <generate|check|bootstrap|validate>",
  );
  process.exit(1);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function extractBlock(source: string, selector: RegExp): string | null {
  const match = source.match(selector);
  return match && match[1] ? match[1] : null;
}

function parseCustomProperties(source: string): TokenMap {
  const output: TokenMap = {};
  const variableRegex = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;
  let match: RegExpExecArray | null = null;
  while ((match = variableRegex.exec(source)) !== null) {
    const name = match[1]?.trim();
    const value = match[2]?.trim();
    if (!name || !value) continue;
    output[name] = value;
  }
  return output;
}

function parseCssModes(source: string): ParsedCssTokens {
  const root = parseCustomProperties(extractBlock(source, /:root\s*\{([\s\S]*?)\n\}/m) || "");
  const dark = parseCustomProperties(extractBlock(source, /:root\.dark\s*\{([\s\S]*?)\n\}/m) || "");
  return { root, dark };
}

function parseSiteCssModes(source: string): ParsedCssTokens {
  const root = parseCustomProperties(extractBlock(source, /:root\s*\{([\s\S]*?)\n\}/m) || "");
  const theme = parseCustomProperties(extractBlock(source, /@theme\s+inline\s*\{([\s\S]*?)\n\}/m) || "");
  const darkRoot = parseCustomProperties(
    extractBlock(source, /:root\.dark\s*\{([\s\S]*?)\n\}/m) || "",
  );
  const darkTheme = parseCustomProperties(
    extractBlock(
      source,
      /@media\s*\(prefers-color-scheme:\s*dark\)[\s\S]*?@theme\s+inline\s*\{([\s\S]*?)\n\}/m,
    ) || "",
  );

  return {
    root,
    dark: darkRoot,
    theme,
    darkTheme,
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isTokenMap(value: unknown): value is TokenMap {
  if (!isPlainObject(value)) return false;
  return Object.entries(value).every(
    ([name, rawValue]) => name.startsWith("--") && typeof rawValue === "string" && rawValue.trim().length > 0,
  );
}

function relativeLuminance(hex: string): number {
  assert(/^#[0-9a-f]{6}$/i.test(hex), `contrast token must be a six-digit hex color: ${hex}`);
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string): number {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function assertSemanticContrast(mode: "light" | "dark", tokens: TokenMap): void {
  const pairs = [
    ["--sg-color-text", "--sg-color-background"],
    ["--sg-color-text", "--sg-color-surface-raised"],
    ["--sg-color-text-muted", "--sg-color-surface-raised"],
    ["--sg-color-text-on-action", "--sg-color-action"],
  ] as const;

  for (const [foregroundToken, backgroundToken] of pairs) {
    const foreground = tokens[foregroundToken];
    const background = tokens[backgroundToken];
    assert(foreground && background, `${mode} contrast tokens missing: ${foregroundToken}, ${backgroundToken}`);
    const ratio = contrastRatio(foreground, background);
    assert(
      ratio >= 4.5,
      `${mode} contrast ${foregroundToken} on ${backgroundToken} is ${ratio.toFixed(2)}:1; expected at least 4.5:1`,
    );
  }
}

function asTokenSource(raw: unknown): TokenSource {
  assert(typeof raw === "object" && raw !== null, "invalid source JSON");
  const source = raw as TokenSource;

  assert(source.artifact_version === "1.0.0", "artifact_version must be 1.0.0");
  assert(typeof source.created_at === "string" && source.created_at.length > 0, "created_at invalid");
  assert(typeof source.updated_at === "string" && source.updated_at.length > 0, "updated_at invalid");
  assert(typeof source.notes === "string", "notes must be a string");
  assert(isPlainObject(source.tokens), "tokens missing");

  const required = ["semantic", "windows", "site", "android"] as const;
  for (const surface of required) {
    const surfaceSource = source.tokens[surface];
    assert(!!surfaceSource, `tokens.${surface} missing`);
    assert(isPlainObject(surfaceSource.light), `tokens.${surface}.light missing`);
    assert(isTokenMap(surfaceSource.light.root), `tokens.${surface}.light.root invalid`);
    if (surfaceSource.light.theme !== undefined) {
      assert(isTokenMap(surfaceSource.light.theme), `tokens.${surface}.light.theme invalid`);
    }
    if (surfaceSource.dark !== undefined) {
      assert(isTokenMap(surfaceSource.dark.root), `tokens.${surface}.dark.root invalid`);
      if (surfaceSource.dark.theme !== undefined) {
        assert(isTokenMap(surfaceSource.dark.theme), `tokens.${surface}.dark.theme invalid`);
      }
    }
  }

  assert(Array.isArray(source.android_mappings?.color), "android_mappings.color invalid");
  assert(Array.isArray(source.android_mappings?.dimension), "android_mappings.dimension invalid");
  assert(Array.isArray(source.android_mappings?.fraction), "android_mappings.fraction invalid");
  assert(Array.isArray(source.android_mappings?.integer), "android_mappings.integer invalid");
  assert(Array.isArray(source.android_mappings?.string), "android_mappings.string invalid");

  const resourceNames = [
    ...source.android_mappings.color.map(({ name }) => name),
    ...source.android_mappings.dimension.map(({ name }) => name),
    ...source.android_mappings.fraction.map(({ name }) => name),
    ...source.android_mappings.integer.map(({ name }) => name),
    ...source.android_mappings.string.map(({ name }) => name),
  ];
  assert(new Set(resourceNames).size === resourceNames.length, "duplicate Android resource name");

  const androidTokens = {
    ...source.tokens.semantic.light.root,
    ...source.tokens.android.light.root,
    ...(source.tokens.semantic.dark?.root || {}),
    ...(source.tokens.android.dark?.root || {}),
  };

  for (const [kind, mappings] of Object.entries(source.android_mappings)) {
    for (const mapping of mappings) {
      assert(typeof mapping?.name === "string" && mapping.name.length > 0, `android ${kind} mapping name invalid`);
      assert(typeof mapping?.token === "string" && mapping.token in androidTokens, `android ${kind} mapping token missing: ${mapping.token}`);
    }
  }

  assertSemanticContrast("light", source.tokens.semantic.light.root);
  assert(source.tokens.semantic.dark, "tokens.semantic.dark missing");
  assertSemanticContrast("dark", source.tokens.semantic.dark.root);

  return source;
}

function serializeCssMode(mode?: SurfaceMode): string {
  const lines: string[] = [];
  if (!mode || Object.keys(mode.root).length === 0) return lines.join("\n");

  lines.push(":root {");
  Object.entries(mode.root)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([token, value]) => {
      lines.push(`  ${token}: ${value};`);
    });
  lines.push("}");

  return lines.join("\n");
}

function formatGenerationHeader(sourceName: string, generatedAt: string): string[] {
  return [
    "/*",
    " * @generated by design token pipeline",
    ` * source: ${sourceName}`,
    ` * generated_at: ${generatedAt}`,
    ` * generator: ${GENERATOR_ID}`,
    " */",
    "",
  ];
}

function mergeMode(base: SurfaceMode, aliases?: SurfaceMode): SurfaceMode {
  return {
    root: { ...base.root, ...(aliases?.root || {}) },
    theme: aliases?.theme,
  };
}

function serializeWindowsCss(semantic: SurfaceSource, source: SurfaceSource, generatedAt: string): string {
  const light = mergeMode(semantic.light, source.light);
  const dark = semantic.dark ? mergeMode(semantic.dark, source.dark) : source.dark;
  const lines: string[] = [
    ...formatGenerationHeader(WINDOWS_SOURCE_NAME, generatedAt),
    serializeCssMode(light),
  ];

  if (dark && Object.keys(dark.root).length > 0) {
    lines.push(":root.dark {");
    Object.entries(dark.root)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([token, value]) => {
        lines.push(`  ${token}: ${value};`);
      });
    lines.push("}", "");
  }

  lines.push("");
  return lines.join("\n");
}

function serializeSiteCss(semantic: SurfaceSource, source: SurfaceSource, generatedAt: string): string {
  const referenceMode = semantic.dark || semantic.light;
  const root = { ...source.light.root, ...referenceMode.root };
  const lines: string[] = [
    ...formatGenerationHeader(SITE_SOURCE_NAME, generatedAt),
    ":root {",
  ];

  Object.entries(root)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([token, value]) => {
      lines.push(`  ${token}: ${value};`);
    });
  lines.push("}");

  if (source.light.theme && Object.keys(source.light.theme).length > 0) {
    lines.push("", "@theme inline {");
    Object.entries(source.light.theme)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([token, value]) => {
        lines.push(`  ${token}: ${value};`);
      });
    lines.push("}");
  }

  if (source.dark?.root && Object.keys(source.dark.root).length > 0) {
    lines.push("", ":root.dark {");
    Object.entries(source.dark.root)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([token, value]) => {
        lines.push(`  ${token}: ${value};`);
      });
    lines.push("}");
  }

  if (source.dark?.theme && Object.keys(source.dark.theme).length > 0) {
    lines.push("", "@media (prefers-color-scheme: dark) {");
    lines.push("  @theme inline {");
    Object.entries(source.dark.theme)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([token, value]) => {
        lines.push(`    ${token}: ${value};`);
      });
    lines.push("  }", "}");
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

function normalizeHex(value: string): string | null {
  const trimmed = value.trim();
  if (!/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6,8})$/.test(trimmed)) {
    return null;
  }

  const h = trimmed.slice(1);
  const expand = (hex: string): string => hex
    .split("")
    .map((item) => `${item}${item}`)
    .join("");

  if (h.length === 3 || h.length === 4) {
    const expanded = expand(h);
    return h.length === 3 ? `#${expanded}`.toUpperCase() : `#${expanded}`.toUpperCase();
  }

  if (h.length === 6) return `#${h}`.toUpperCase();
  if (h.length === 8) {
    const a = h.slice(6, 8);
    const rgb = h.slice(0, 6);
    return `#${a}${rgb}`.toUpperCase();
  }

  return null;
}

function parseRgb(value: string): string | null {
  const match = /^rgba?\(([^)]+)\)$/i.exec(value.trim());
  if (!match) return null;
  const parts = match[1].split(",").map((part) => part.trim());
  if (parts.length < 3) return null;

  const toNumber = (part: string): number => {
    if (part.endsWith("%")) return (Number.parseFloat(part) / 100) * 255;
    return Number.parseFloat(part);
  };

  const r = Math.round(Math.max(0, Math.min(255, toNumber(parts[0]!))));
  const g = Math.round(Math.max(0, Math.min(255, toNumber(parts[1]!))));
  const b = Math.round(Math.max(0, Math.min(255, toNumber(parts[2]!))));
  let alpha = 255;

  if (parts.length >= 4) {
    const a = Number.parseFloat(parts[3]!);
    alpha = Math.round(Math.max(0, Math.min(1, Number.isNaN(a) ? 1 : a)) * 255);
  }

  return `#${alpha.toString(16).padStart(2, "0").toUpperCase()}${r
    .toString(16)
    .padStart(2, "0").toUpperCase()}${g.toString(16).padStart(2, "0").toUpperCase()}${b
    .toString(16)
    .padStart(2, "0").toUpperCase()}`;
}

function parseDimen(value: string): string | null {
  const normalized = value.trim();
  if (/^calc\(/.test(normalized)) return null;
  const number = Number.parseFloat(normalized);
  if (Number.isNaN(number)) return null;

  const unitMatch = /^[+-]?(?:\d*\.)?\d+\s*([a-z%]*)$/i.exec(normalized);
  const unit = unitMatch?.[1] ?? "";

  if (unit === "rem") return `${number * 16}dp`;
  if (unit === "px" || unit === "dp" || unit === "sp") return `${number}${unit}`;
  if (!unit) return `${number}dp`;
  return null;
}

function serializeColor(value: string): string | null {
  if (value.startsWith("var(")) return null;
  if (value.startsWith("rgba(") || value.startsWith("rgb(")) return parseRgb(value);
  return normalizeHex(value);
}

function serializeAndroidXml(
  semantic: SurfaceSource,
  android: SurfaceSource,
  mappings: TokenSource["android_mappings"],
  mode: "light" | "dark",
  generatedAt: string,
): string {
  const semanticModeRoot = mode === "dark" && semantic.dark ? semantic.dark.root : semantic.light.root;
  const androidModeRoot = mode === "dark" && android.dark ? android.dark.root : android.light.root;
  const modeRoot = { ...semanticModeRoot, ...androidModeRoot };
  const fallbackRoot = { ...semantic.light.root, ...android.light.root };

  const lines = [
    `<!-- generated by ${GENERATOR_ID} -->`,
    `<!-- source: ${basename(SOURCE_REFERENCE)} (${mode}) -->`,
    `<!-- generated_at: ${generatedAt} -->`,
    '<resources xmlns:tools="http://schemas.android.com/tools">',
  ];

  if (mappings.color.length) {
    lines.push("  <!-- Colors mapped from canonical tokens -->");
    for (const mapping of mappings.color) {
      const sourceValue = (modeRoot[mapping.token] || fallbackRoot[mapping.token])?.trim();
      assert(sourceValue, `Android ${mode} color token missing: ${mapping.token}`);
      const color = serializeColor(sourceValue);
      assert(color, `Android ${mode} color cannot be serialized: ${mapping.token}=${sourceValue}`);
      lines.push(`  <color name="${mapping.name}">${color}</color>`);
    }
  }

  if (mappings.dimension.length) {
    lines.push("", "  <!-- Dimensions mapped from canonical tokens -->");
    for (const mapping of mappings.dimension) {
      const sourceValue = (modeRoot[mapping.token] || fallbackRoot[mapping.token])?.trim();
      assert(sourceValue, `Android ${mode} dimension token missing: ${mapping.token}`);
      const dimen = parseDimen(sourceValue);
      assert(dimen, `Android ${mode} dimension cannot be serialized: ${mapping.token}=${sourceValue}`);
      lines.push(`  <dimen name="${mapping.name}">${dimen}</dimen>`);
    }
  }

  if (mappings.fraction.length) {
    lines.push("  <!-- Fractions mapped from Android-only canonical tokens -->");
    for (const mapping of mappings.fraction) {
      const sourceValue = (modeRoot[mapping.token] || fallbackRoot[mapping.token])?.trim();
      assert(sourceValue && /^(?:\d+(?:\.\d+)?|\.\d+)%$/.test(sourceValue), `Android ${mode} fraction invalid: ${mapping.token}=${sourceValue}`);
      lines.push(`  <fraction name="${mapping.name}">${sourceValue}</fraction>`);
    }
  }

  if (mappings.integer.length) {
    lines.push("  <!-- Integers mapped from Android-only canonical tokens -->");
    for (const mapping of mappings.integer) {
      const sourceValue = (modeRoot[mapping.token] || fallbackRoot[mapping.token])?.trim();
      assert(sourceValue && /^-?\d+$/.test(sourceValue), `Android ${mode} integer invalid: ${mapping.token}=${sourceValue}`);
      lines.push(`  <integer name="${mapping.name}">${sourceValue}</integer>`);
    }
  }

  if (mappings.string.length) {
    lines.push("  <!-- Strings mapped from Android-only canonical tokens -->");
    for (const mapping of mappings.string) {
      const sourceValue = (modeRoot[mapping.token] || fallbackRoot[mapping.token])?.trim();
      assert(sourceValue, `Android ${mode} string token missing: ${mapping.token}`);
      const escaped = sourceValue.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
      lines.push(`  <string name="${mapping.name}" translatable="false">${escaped}</string>`);
    }
  }

  lines.push("</resources>", "");
  return `${lines.join("\n")}\n`;
}

async function readJson<T>(path: string): Promise<T> {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw) as T;
}

async function writeIfChanged(path: string, next: string): Promise<boolean> {
  try {
    const current = await readFile(path, "utf8");
    if (current === next) return false;
  } catch {
    // file missing is always a change
  }

  await mkdir(resolve(path, ".."), { recursive: true });
  await writeFile(path, next, "utf8");
  return true;
}

async function bootstrap(): Promise<void> {
  const windowsCss = await readFile(WINDOWS_SOURCE_CSS, "utf8");
  const siteCss = await readFile(SITE_SOURCE_CSS, "utf8");
  const windowsParsed = parseCssModes(windowsCss);
  const siteParsed = parseSiteCssModes(siteCss);
  const mappings = await readJson<TokenSource["android_mappings"]>(ANDROID_MAPPINGS_PATH);

  const now = new Date().toISOString();
  const source: TokenSource = {
    artifact_version: "1.0.0",
    created_at: now,
    updated_at: now,
    notes: "Bootstrap generated from existing runtime surfaces. No visual changes applied.",
    tokens: {
      semantic: {
        light: { root: windowsParsed.root },
        dark: windowsParsed.dark ? { root: windowsParsed.dark } : undefined,
      },
      windows: {
        light: { root: windowsParsed.root },
        dark: windowsParsed.dark ? { root: windowsParsed.dark } : undefined,
      },
      site: {
        light: {
          root: siteParsed.root,
          theme: siteParsed.theme,
        },
        dark:
          Object.keys(siteParsed.dark).length === 0 && Object.keys(siteParsed.darkTheme || {}).length === 0
            ? undefined
            : {
                root: Object.keys(siteParsed.dark).length ? siteParsed.dark : siteParsed.root,
                theme: Object.keys(siteParsed.darkTheme || {}).length ? siteParsed.darkTheme : siteParsed.theme,
              },
      },
      android: {
        light: { root: {} },
        dark: { root: {} },
      },
    },
    android_mappings: mappings,
  };

  await writeFile(SOURCE_REFERENCE, `${JSON.stringify(asTokenSource(source), null, 2)}\n`, "utf8");
  console.log(`wrote ${SOURCE_REFERENCE}`);
}

async function generate(): Promise<void> {
  const source = asTokenSource(await readJson<TokenSource>(SOURCE_REFERENCE));
  const generatedAt = source.updated_at;
  const windowsOutput = serializeWindowsCss(source.tokens.semantic, source.tokens.windows, generatedAt);
  const siteOutput = serializeSiteCss(source.tokens.semantic, source.tokens.site, generatedAt);
  const androidLightOutput = serializeAndroidXml(source.tokens.semantic, source.tokens.android, source.android_mappings, "light", generatedAt);
  const androidDarkOutput = serializeAndroidXml(source.tokens.semantic, source.tokens.android, source.android_mappings, "dark", generatedAt);

  const changed = [
    await writeIfChanged(WINDOWS_OUTPUT, windowsOutput),
    await writeIfChanged(SITE_OUTPUT, siteOutput),
    await writeIfChanged(ANDROID_RES_VALUES, androidLightOutput),
    await writeIfChanged(ANDROID_RES_VALUES_NIGHT, androidDarkOutput),
  ];

  if (changed.some(Boolean)) {
    console.log("generated files updated");
    return;
  }

  console.log("generated files already up to date");
}

async function check(): Promise<void> {
  const source = asTokenSource(await readJson<TokenSource>(SOURCE_REFERENCE));
  const generatedAt = source.updated_at;
  const windowsOutput = serializeWindowsCss(source.tokens.semantic, source.tokens.windows, generatedAt);
  const siteOutput = serializeSiteCss(source.tokens.semantic, source.tokens.site, generatedAt);
  const androidLightOutput = serializeAndroidXml(source.tokens.semantic, source.tokens.android, source.android_mappings, "light", generatedAt);
  const androidDarkOutput = serializeAndroidXml(source.tokens.semantic, source.tokens.android, source.android_mappings, "dark", generatedAt);

  const expected = [
    [WINDOWS_OUTPUT, windowsOutput],
    [SITE_OUTPUT, siteOutput],
    [ANDROID_RES_VALUES, androidLightOutput],
    [ANDROID_RES_VALUES_NIGHT, androidDarkOutput],
  ] as const;

  let mismatch = false;
  for (const [filePath, expectedContent] of expected) {
    try {
      const current = await readFile(filePath, "utf8");
      if (current !== expectedContent) {
        mismatch = true;
        console.error(`DRIFT: ${filePath}`);
      }
    } catch {
      mismatch = true;
      console.error(`DRIFT: ${filePath} missing`);
    }
  }

  if (mismatch) {
    console.error("run pnpm run design:tokens:generate");
    process.exit(1);
  }

  console.log("tokens are up to date");
}

async function main() {
  const mode = (process.argv[2] as GeneratorMode | undefined) || "validate";
  if (!(["generate", "check", "bootstrap", "validate"].includes(mode))) {
    usage();
  }

  await readFile(SCHEMA_PATH, "utf8");

  switch (mode) {
    case "validate": {
      const source = asTokenSource(await readJson<TokenSource>(SOURCE_REFERENCE));
      console.log(`validated ${SOURCE_REFERENCE} (${source.tokens.windows.light.root["--sg-color-action"] ? "ok" : "ok"})`);
      break;
    }
    case "bootstrap":
      await bootstrap();
      break;
    case "generate":
      await generate();
      break;
    case "check":
      await check();
      break;
    default:
      usage();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
