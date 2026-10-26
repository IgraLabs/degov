interface GovernanceContracts {
  governorToken?: { address?: string; standard?: string };
  igraToken?: string;
}

/**
 * Address to use for ERC20 calls (symbol, decimals, totalSupply, balanceOf)
 * and for delegate().
 *
 * The IgraVotingPower adapter only exposes getVotes/getPastVotes; its ERC20
 * calls revert and delegate() reverts with "delegate on IGRA token directly",
 * so those go to the underlying igraToken.
 */
export function resolveErc20TokenAddress(
  contracts: GovernanceContracts | undefined
): `0x${string}` | undefined {
  const isIgraVotingPower =
    contracts?.governorToken?.standard?.toUpperCase() === "IGRAVOTINGPOWER";
  const address =
    isIgraVotingPower && contracts?.igraToken
      ? contracts.igraToken
      : contracts?.governorToken?.address;
  return address as `0x${string}` | undefined;
}
