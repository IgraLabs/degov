import { useCallback } from "react";
import { useWriteContract } from "wagmi";

import { abi as tokenAbi } from "@/config/abi/token";
import { resolveErc20TokenAddress } from "@/utils/governance-token";

import { useContractGuard } from "./useContractGuard";
import { useDaoConfig } from "./useDaoConfig";

import type { Address } from "viem";

export const useDelegate = () => {
  const daoConfig = useDaoConfig();
  const { writeContractAsync, isPending } = useWriteContract();
  const { validateBeforeExecution } = useContractGuard();

  const delegateTokenAddress = resolveErc20TokenAddress(
    daoConfig?.contracts
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
