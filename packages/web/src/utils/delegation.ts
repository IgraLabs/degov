export type DelegationStatus =
  | { type: "none" }
  | { type: "self" | "other"; to: string };

interface DelegateMappingLike {
  to: string;
}

interface DelegateRowLike {
  fromDelegate: string;
  toDelegate: string;
  power: string;
}

/**
 * Where `address` currently delegates its votes.
 *
 * Token delegations produce DelegateChanged mappings (latest first). Staking
 * power on IgraVotingPower has no DelegateChanged event; the indexer records it
 * only as a self row (from == to) in `delegates`, so fall back to that.
 */
export function getDelegationStatus(
  address: string,
  mappings: DelegateMappingLike[] | undefined,
  delegates: DelegateRowLike[] | undefined
): DelegationStatus {
  const me = address.toLowerCase();
  const latest = mappings?.[0];
  if (latest) {
    const to = latest.to;
    return { type: to.toLowerCase() === me ? "self" : "other", to };
  }

  const selfRow = delegates?.find(
    (d) =>
      d.fromDelegate.toLowerCase() === me &&
      d.toDelegate.toLowerCase() === me &&
      BigInt(d.power || "0") > 0n
  );
  return selfRow ? { type: "self", to: selfRow.toDelegate } : { type: "none" };
}

/** Percentage of total voting power (indexer `powerSum`) held by `votes`. */
export function votingPowerShare(
  votes: bigint | undefined,
  powerSum: string | bigint | undefined
): number {
  if (!votes || !powerSum) return 0;
  const total = BigInt(powerSum);
  return total > 0n ? Number((votes * 10000n) / total) / 100 : 0;
}
