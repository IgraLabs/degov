import { useCallback } from "react";
import { useWriteContract } from "wagmi";

import { abi as tokenAbi } from "@/config/abi/token";

import { useContractGuard } from "./useContractGuard";
import { useDaoConfig } from "./useDaoConfig";

import type { Address } from "viem";

export const useDelegate = () => {
  const daoConfig = useDaoConfig();
  const { writeContractAsync, isPending } = useWriteContract();
  const { validateBeforeExecution } = useContractGuard();

  // For IgraVotingPower, delegate on the underlying igraToken (ERC20) since the adapter doesn't support it
  const isIgraVotingPower =
    daoConfig?.contracts?.governorToken?.standard?.toUpperCase() ===
    "IGRAVOTINGPOWER";
  const delegateTokenAddress = (
    isIgraVotingPower && daoConfig?.contracts?.igraToken
      ? daoConfig.contracts.igraToken
      : daoConfig?.contracts?.governorToken?.address
  ) as Address;

  const delegate = useCallback(
    async (delegatee: Address) => {
      const isValid = validateBeforeExecution();
      if (!isValid) return;
      const hash = await writeContractAsync({
        address: delegateTokenAddress,
        abi: tokenAbi,
        functionName: "delegate",
        args: [delegatee],
      });

      return hash;
    },
    [writeContractAsync, delegateTokenAddress, validateBeforeExecution]
  );

  return {
    delegate,
    isPending,
  };
};
