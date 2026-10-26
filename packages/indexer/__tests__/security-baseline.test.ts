/**
 * Security baseline for the web package (Oct 2026 advisories).
 *
 * - Next.js < 16.4.1: unauthenticated RCE in the Image Optimization API
 *   (AVIF via libheif, SVG via librsvg), RCE in `use cache`, SSRF in image
 *   optimization and rewrites, middleware bypasses.
 * - react-server-dom < 19.2.8: DoS in Server Functions.
 * - sharp < 0.35.5: vulnerable libheif/librsvg used by the image optimizer.
 * - axios < 1.20.0: prototype-pollution gadgets, header injection, proxy bypass.
 * - Node.js 22 < 22.23.4: Brotli decoder RCE, TLS/DNS hostname bypasses,
 *   eMudhra CA distrust.
 *
 * The image optimizer was also an open proxy (`remotePatterns: "**"`) and was
 * actively probed for SSRF in production, so it must stay disabled.
 */
import * as fs from "fs";
import * as path from "path";

const WEB = path.resolve(__dirname, "../../web");
const DOCKERFILE = path.resolve(__dirname, "../../../docker/web.Dockerfile");

function parseVersion(v: string): number[] {
  const m = v.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!m) throw new Error(`Cannot parse version: ${v}`);
  return m.slice(1).map(Number);
}

function gte(actual: string, min: string): boolean {
  const a = parseVersion(actual);
  const b = parseVersion(min);
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return true;
}

/** All resolved versions of a package in pnpm-lock.yaml (`  name@x.y.z:` keys). */
function lockedVersions(name: string): string[] {
  const lock = fs.readFileSync(path.join(WEB, "pnpm-lock.yaml"), "utf8");
  const escaped = name.replace(/[/@]/g, (c) => `\\${c}`);
  const re = new RegExp(`^  '?${escaped}@(\\d+\\.\\d+\\.\\d+)[^:]*'?:`, "gm");
  return [...new Set([...lock.matchAll(re)].map((m) => m[1]))];
}

describe("web dependency versions", () => {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(WEB, "package.json"), "utf8")
  );

  const minimums: Record<string, string> = {
    next: "16.4.1",
    react: "19.2.8",
    "react-dom": "19.2.8",
    sharp: "0.35.5",
    axios: "1.20.0",
  };

  it.each(Object.entries(minimums))(
    "every locked %s is >= %s",
    (name, min) => {
      const versions = lockedVersions(name);
      expect(versions.length).toBeGreaterThan(0);
      for (const v of versions) {
        expect({ name, v, ok: gte(v, min) }).toEqual({ name, v, ok: true });
      }
    }
  );

  it("package.json pins next to a patched version", () => {
    expect(gte(pkg.dependencies.next, "16.4.1")).toBe(true);
  });
});

describe("next.config image optimizer", () => {
  const config = fs.readFileSync(path.join(WEB, "next.config.ts"), "utf8");

  it("disables server-side image optimization", () => {
    expect(config).toMatch(/unoptimized:\s*true/);
  });

  it("does not allow remote images from any host", () => {
    expect(config).not.toMatch(/hostname:\s*["']\*\*["']/);
    expect(config).not.toMatch(/remotePatterns/);
  });

  it("does not enable AVIF output", () => {
    expect(config).not.toMatch(/image\/avif/);
  });
});

describe("web Dockerfile", () => {
  const dockerfile = fs.readFileSync(DOCKERFILE, "utf8");

  it("uses a patched Node.js 22 base image", () => {
    const m = dockerfile.match(/^FROM node:(\d+\.\d+\.\d+)-alpine/m);
    expect(m).not.toBeNull();
    expect(gte(m![1], "22.23.4")).toBe(true);
  });
});

describe("debug log endpoint", () => {
  it("is not exposed as a public API route", () => {
    expect(
      fs.existsSync(path.join(WEB, "src/app/api/debug-log/route.ts"))
    ).toBe(false);
  });

  it("client auth debug logger does not POST to the server", () => {
    const debug = fs.readFileSync(
      path.join(WEB, "src/lib/auth/debug.ts"),
      "utf8"
    );
    expect(debug).not.toMatch(/fetch\(/);
    expect(debug).not.toMatch(/debug-log/);
  });
});
