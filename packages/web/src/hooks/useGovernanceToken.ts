import { useReadContracts } from "wagmi";

import { abi as tokenAbi } from "@/config/abi/token";
import { QUERY_CONFIGS } from "@/utils/query-config";

import { useDaoConfig } from "./useDaoConfig";

import type { Address } from "viem";

interface GovernanceTokenMetadata {
  symbol: string;
  name: string;
  decimals: number;
}

interface UseGovernanceTokenReturn {
  data: GovernanceTokenMetadata | null;
  isLoading: boolean;
  error: Error | null;
}

interface UseGovernanceTokenOptions {
  enabled?: boolean;
}

/**
 * Hook to fetch governance token metadata
 * @param tokenAddress - The address of the governance token contract
 */
export function useGovernanceToken(
  options: UseGovernanceTokenOptions = {}
): UseGovernanceTokenReturn {
  const { enabled = true } = options;
  const daoConfig = useDaoConfig();
  const standard = daoConfig?.contracts?.governorToken?.standard;
  // For IgraVotingPower, the adapter contract doesn't implement ERC20 metadata.
  // Use the underlying igraToken address instead.
  // Note: processStandardProperties() uppercases all "standard" values at runtime.
  const isIgraVotingPower = standard?.toUpperCase() === "IGRAVOTINGPOWER";
  const tokenAddress = (
    isIgraVotingPower && daoConfig?.contracts?.igraToken
      ? daoConfig.contracts.igraToken
      : daoConfig?.contracts?.governorToken?.address
  ) as Address;
  const { data, isLoading, error } = useReadContracts({
    contracts:
      standard === "ERC20" || isIgraVotingPower
        ? [
            {
              address: tokenAddress,
              abi: tokenAbi,
              functionName: "symbol",
              chainId: daoConfig?.chain?.id,
            },
            {
              address: tokenAddress,
              abi: tokenAbi,
              functionName: "name",
              chainId: daoConfig?.chain?.id,
            },
            {
              address: tokenAddress,
              abi: tokenAbi,
              functionName: "decimals",
              chainId: daoConfig?.chain?.id,
            },
          ]
        : [
            {
              address: tokenAddress,
              abi: tokenAbi,
              functionName: "symbol",
              chainId: daoConfig?.chain?.id,
            },
            {
              address: tokenAddress,
              abi: tokenAbi,
              functionName: "name",
              chainId: daoConfig?.chain?.id,
            },
          ],
    query: {
      ...QUERY_CONFIGS.STATIC,
      enabled:
        enabled && Boolean(tokenAddress) && Boolean(daoConfig?.chain?.id),
    },
  });

  const formattedData: GovernanceTokenMetadata | null = data
    ? {
        symbol: (data[0].result as string) ?? "TOKEN",
        name: (data[1].result as string) ?? "Governance Token",
        decimals:
          standard === "ERC20" || isIgraVotingPower
            ? data?.[2]?.result
              ? Number(data[2].result)
              : 18
            : standard === "ERC721"
              ? 0
              : 18,
      }
    : null;

  return {
    data: formattedData,
    isLoading,
    error: error as Error | null,
  };
}
