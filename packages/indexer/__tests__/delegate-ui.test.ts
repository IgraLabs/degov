/**
 * Delegate UI regressions found while testing as a delegate on production.
 */
import * as fs from "fs";
import * as path from "path";

import {
  getDelegationStatus,
  votingPowerShare,
} from "../../web/src/utils/delegation";

const WEB = path.resolve(__dirname, "../../web");
const read = (p: string) => fs.readFileSync(path.join(WEB, p), "utf8");

const ME = "0x8337078b72e1e1ebc5e9d96fc228d2850ded49a5";
const OTHER = "0x29d4cc85788af3e09181e67bb7d72061c8233c78";

describe("getDelegationStatus", () => {
  it("is 'none' with no mappings and no self power", () => {
    expect(getDelegationStatus(ME, [], []).type).toBe("none");
  });

  it("is 'self' when the only power is staking self-delegation (no DelegateChanged mapping)", () => {
    const status = getDelegationStatus(
      ME,
      [],
      [{ fromDelegate: ME, toDelegate: ME, power: "30008197104132750000000000" }]
    );
    expect(status).toEqual({ type: "self", to: ME });
  });

  it("ignores self rows with zero power", () => {
    expect(
      getDelegationStatus(ME, [], [{ fromDelegate: ME, toDelegate: ME, power: "0" }]).type
    ).toBe("none");
  });

  it("matches addresses case-insensitively", () => {
    const upper = ME.toUpperCase().replace("0X", "0x");
    expect(
      getDelegationStatus(upper, [], [{ fromDelegate: ME, toDelegate: ME, power: "1" }]).type
    ).toBe("self");
  });

  it("prefers the latest token delegation mapping", () => {
    expect(
      getDelegationStatus(ME, [{ to: OTHER }], [
        { fromDelegate: ME, toDelegate: ME, power: "1" },
      ])
    ).toEqual({ type: "other", to: OTHER });
  });

  it("is 'self' for a mapping to oneself", () => {
    expect(getDelegationStatus(ME, [{ to: ME }], [])).toEqual({ type: "self", to: ME });
  });
});

describe("votingPowerShare", () => {
  it("is the share of total voting power, not token supply", () => {
    // 30.01M of 123.46M total voting power -> 24.30%, as on the profile page
    expect(
      votingPowerShare(30008197104132750000000000n, "123460000000000000000000000")
    ).toBeCloseTo(24.3, 1);
  });

  it("is 0 when total power is missing or zero", () => {
    expect(votingPowerShare(1n, undefined)).toBe(0);
    expect(votingPowerShare(1n, "0")).toBe(0);
    expect(votingPowerShare(undefined, "100")).toBe(0);
  });
});

describe("account menu", () => {
  it("uses total voting power (indexer powerSum) for the percentage", () => {
    const src = read("src/components/connect-button/connected.tsx");
    expect(src).toMatch(/votingPowerShare\(/);
    expect(src).not.toMatch(/functionName: "totalSupply"/);
  });
});

describe("delegate transactions surface errors", () => {
  it.each([
    "src/components/delegate-selector.tsx",
    "src/app/profile/_components/change-delegate.tsx",
  ])("%s catches a rejected/failed delegate()", (file) => {
    const src = read(file);
    expect(src).toMatch(/catch \(error\)/);
    expect(src).toMatch(/toast\.error\(/);
  });
});

describe("delegates table", () => {
  it("uses relative column widths so it fits the content area", () => {
    const src = read("src/components/members-table/index.tsx");
    const widths = [...src.matchAll(/width: "([^"]+)"/g)].map((m) => m[1]);
    expect(widths.length).toBeGreaterThan(0);
    for (const w of widths) expect(w).toMatch(/%$/);
  });
});

describe("wagmi transports", () => {
  it("sets an explicit browser-usable mainnet RPC for ENS (not viem's default)", () => {
    const src = read("src/config/wagmi.ts");
    expect(src).toMatch(/transports:/);
    expect(src).toMatch(/\[mainnet\.id\]:/);
  });
});
