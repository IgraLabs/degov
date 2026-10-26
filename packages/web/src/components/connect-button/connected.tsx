import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Power } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo } from "react";
import { useReadContract } from "wagmi";

import { ExternalLinkIcon, ProfileIcon } from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { abi as tokenAbi } from "@/config/abi/token";
import { useDaoConfig } from "@/hooks/useDaoConfig";
import { useDisconnectWallet } from "@/hooks/useDisconnectWallet";
import { useFormatGovernanceTokenAmount } from "@/hooks/useFormatGovernanceTokenAmount";
import { useGovernanceToken } from "@/hooks/useGovernanceToken";
import { useCurrentVotingPower } from "@/hooks/useSmartGetVotes";
import { proposalService } from "@/services/graphql";
import { formatShortAddress } from "@/utils";
import { votingPowerShare } from "@/utils/delegation";
import { resolveErc20TokenAddress } from "@/utils/governance-token";

import { AddressAvatar } from "../address-avatar";
import { AddressResolver } from "../address-resolver";
import ClipboardIconButton from "../clipboard-icon-button";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
interface ConnectedProps {
  address: `0x${string}`;
  onMenuToggle?: () => void;
}

export const Connected = ({ address, onMenuToggle }: ConnectedProps) => {
  const { disconnectWallet } = useDisconnectWallet();
  const daoConfig = useDaoConfig();
  const formatTokenAmount = useFormatGovernanceTokenAmount();
  const { data: governanceToken, isLoading: isGovernanceTokenLoading } =
    useGovernanceToken();

  const { data: votingPower, isLoading: isVotingPowerLoading } =
    useCurrentVotingPower(address);

  const erc20TokenAddress = resolveErc20TokenAddress(daoConfig?.contracts);

  // Same denominator as the profile page: total voting power from the indexer.
  const { data: dataMetrics, isLoading: isMetricsLoading } = useQuery({
    queryKey: ["dataMetrics", daoConfig?.indexer?.endpoint],
    queryFn: () =>
      proposalService.getProposalMetrics(daoConfig?.indexer?.endpoint ?? ""),
    enabled: !!daoConfig?.indexer?.endpoint,
  });

  const { data: tokenBalance, isLoading: isBalanceLoading } = useReadContract({
    address: erc20TokenAddress,
    abi: tokenAbi,
    functionName: "balanceOf",
    args: [address],
    chainId: daoConfig?.chain?.id,
    query: {
      enabled:
        Boolean(address) &&
        Boolean(erc20TokenAddress) &&
        Boolean(daoConfig?.chain?.id),
    },
  });

  const formattedVotingPower = useMemo(() => {
    if (!votingPower) return "0";

    return formatTokenAmount(votingPower)?.formatted ?? "0";
  }, [votingPower, formatTokenAmount]);

  const votingPowerPercentage = useMemo(
    () => votingPowerShare(votingPower, dataMetrics?.powerSum),
    [votingPower, dataMetrics?.powerSum]
  );

  const formattedVotingPowerPercentage = useMemo(() => {
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
    }).format(votingPowerPercentage);
  }, [votingPowerPercentage]);

  const formattedBalance = useMemo(() => {
    if (!tokenBalance) return "0";

    return formatTokenAmount(tokenBalance)?.formatted ?? "0";
  }, [tokenBalance, formatTokenAmount]);

  const isVotingPowerSectionLoading =
    isVotingPowerLoading || isGovernanceTokenLoading || isMetricsLoading;

  const isBalanceSectionLoading = isBalanceLoading || isGovernanceTokenLoading;

  const handleDisconnect = useCallback(() => {
    disconnectWallet(address);
  }, [disconnectWallet, address]);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className=" focus-visible:outline-hidden">
        <AddressResolver address={address} showShortAddress>
          {(value) => (
            <div className="flex items-center gap-[10px] rounded-[20px] lg:rounded-[10px] bg-card lg:bg-transparent lg:border lg:border-border px-4 py-2">
              <AddressAvatar
                address={address}
                className="size-[24px] rounded-full"
                size={24}
              />
              <span className="text-[14px]">{value}</span>
              <ChevronDown size={20} className="text-muted-foreground" />
            </div>
          )}
        </AddressResolver>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[327px] rounded-[26px] border-border/20 bg-card p-[20px] shadow-2xl flex flex-col gap-[20px]"
        align="end"
      >
        <div className="flex items-center gap-[8px]">
          <AddressAvatar address={address} className="rounded-full" />
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-[18px] font-semibold text-foreground">
                {formatShortAddress(address)}
              </span>
            </TooltipTrigger>
            <TooltipContent>{address}</TooltipContent>
          </Tooltip>
          <ClipboardIconButton text={address} size={20} />
          <Link
            href={`${daoConfig?.chain?.explorers?.[0]}/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLinkIcon
              width={20}
              height={20}
              className="mt-[2px] shrink-0 text-foreground"
            />
          </Link>
        </div>
        <div className="rounded-[14px] border border-border/20 bg-bg-2 p-[10px] shadow-card">
          <div className="flex items-center justify-between text-[12px] text-foreground/80">
            <span className="font-normal">Voting Power</span>
            {isVotingPowerSectionLoading ? (
              <Skeleton className="h-[16px] w-[120px] bg-border/20" />
            ) : (
              <span className="font-semibold text-foreground">
                {formattedVotingPower ?? "--"}
                {formattedVotingPowerPercentage
                  ? ` (${formattedVotingPowerPercentage}%)`
                  : ""}
              </span>
            )}
          </div>
          <div className="my-[10px] h-px bg-border/20" />
          <div className="flex items-center justify-between text-[12px] text-foreground/80">
            <span className="font-normal">Balance</span>
            {isBalanceSectionLoading ? (
              <Skeleton className="h-[16px] w-[140px] bg-border/20" />
            ) : (
              <span className="font-semibold text-foreground">
                {formattedBalance ?? "--"}
                {governanceToken?.symbol ? ` ${governanceToken.symbol}` : ""}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center gap-[10px]">
          <Button
            asChild
            className="w-full gap-[10px] rounded-[100px] border-foreground bg-card"
            variant="outline"
          >
            <Link
              href="/profile"
              onClick={() => onMenuToggle?.()}
              className="text-foreground"
            >
              <ProfileIcon width={20} height={20} className="text-current" />
              <span className="text-[14px]">Profile</span>
            </Link>
          </Button>
          <Button
            onClick={handleDisconnect}
            className="w-full gap-[10px] rounded-[100px] border-foreground bg-card text-foreground"
            variant="outline"
          >
            <Power size={20} className="text-current" strokeWidth={2} />
            <span className="text-[14px]">Disconnect</span>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
