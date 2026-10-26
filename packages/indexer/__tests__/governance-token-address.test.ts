/**
 * The IgraVotingPower adapter (governorToken) only exposes getVotes/getPastVotes.
 * ERC20 calls (symbol, decimals, totalSupply, balanceOf) revert, and
 * delegate() reverts with "IgraVotingPower: delegate on IGRA token directly".
 * Those calls must go to the underlying igraToken instead.
 */
import { resolveErc20TokenAddress } from "../../web/src/utils/governance-token";

const ADAPTER = "0x50BAc71D1B32Fa6030007b5E72dbBB4fF48c1B39";
const IGRA = "0x093d77d397F8acCbaee0820345E9E700B1233cD1";

describe("resolveErc20TokenAddress", () => {
  it("uses igraToken for IgraVotingPower governors", () => {
    expect(
      resolveErc20TokenAddress({
        governorToken: { address: ADAPTER, standard: "IgraVotingPower" },
        igraToken: IGRA,
      })
    ).toBe(IGRA);
  });

  it("matches the standard case-insensitively", () => {
    expect(
      resolveErc20TokenAddress({
        governorToken: { address: ADAPTER, standard: "IGRAVOTINGPOWER" },
        igraToken: IGRA,
      })
    ).toBe(IGRA);
  });

  it("falls back to governorToken when igraToken is not configured", () => {
    expect(
      resolveErc20TokenAddress({
        governorToken: { address: ADAPTER, standard: "IgraVotingPower" },
      })
    ).toBe(ADAPTER);
  });

  it("uses governorToken for plain ERC20 governors", () => {
    expect(
      resolveErc20TokenAddress({
        governorToken: { address: ADAPTER, standard: "ERC20" },
        igraToken: IGRA,
      })
    ).toBe(ADAPTER);
  });

  it("returns undefined when nothing is configured", () => {
    expect(resolveErc20TokenAddress(undefined)).toBeUndefined();
  });
});
