"use client";

import { useState } from "react";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight } from "lucide-react";
import { formatRupee } from "@/lib/utils";

export function SettlementList({
	settlements,
	isGroupSettlement = false,
	userLookupMap,
}) {
	const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);

	if (!settlements || !settlements.length) {
		return (
			<div className="text-center py-10 px-4 bg-muted/30 dark:bg-slate-800/20 rounded-xl border border-dashed dark:border-slate-800 flex flex-col items-center transition-all animate-in fade-in duration-500">
				<div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-full mb-3 opacity-80">
					<ArrowLeftRight className="h-6 w-6 text-primary" />
				</div>
				<p className="text-foreground/90 font-medium">
					No settlements yet
				</p>
				<p className="text-xs text-muted-foreground mt-1">
					When you settle balances, they will appear here.
				</p>
			</div>
		);
	}

	// Helper to get user details from cache or look up
	const getUserDetails = (userId) => {
		return {
			name:
				userId === currentUser?._id
					? "You"
					: userLookupMap[userId]?.name || "Other User",
			imageUrl: null,
			id: userId,
		};
	};

	return (
		<div className="flex flex-col gap-3 animate-in fade-in duration-500">
			{settlements.map((settlement) => {
				const payer = getUserDetails(settlement.paidByUserId);
				const receiver = getUserDetails(settlement.receivedByUserId);
				const isCurrentUserPayer =
					settlement.paidByUserId === currentUser?._id;
				const isCurrentUserReceiver =
					settlement.receivedByUserId === currentUser?._id;

				return (
					<Card
						className="group overflow-hidden border bg-card dark:bg-slate-900/40 dark:border-slate-800 hover:-translate-y-0.5 hover:shadow-sm hover:border-primary/30 dark:hover:border-primary/50 transition-all duration-200"
						key={settlement._id}>
						<CardContent className="p-4 sm:p-5">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
								{/* Left Side: Icon & Details */}
								<div className="flex items-center gap-3.5">
									<div className="bg-primary/10 dark:bg-primary/20 p-2.5 rounded-full group-hover:scale-105 group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-all duration-200">
										<ArrowLeftRight className="h-5 w-5 text-primary" />
									</div>

									<div>
										<h3 className="font-semibold text-foreground/90 group-hover:text-foreground transition-colors">
											{isCurrentUserPayer
												? `You paid ${receiver.name}`
												: isCurrentUserReceiver
													? `${payer.name} paid you`
													: `${payer.name} paid ${receiver.name}`}
										</h3>
										<div className="flex items-center text-xs text-muted-foreground mt-0.5 gap-2">
											<span className="font-medium text-muted-foreground/80">
												{format(
													new Date(settlement.date),
													"MMM d, yyyy",
												)}
											</span>
											{settlement.note && (
												<>
													<span className="w-1 h-1 rounded-full bg-border" />
													<span className="truncate max-w-[150px] sm:max-w-[200px]">
														{settlement.note}
													</span>
												</>
											)}
										</div>
									</div>
								</div>

								{/* Right Side: Amount & Badge */}
								<div className="sm:text-right flex flex-row-reverse sm:flex-col justify-between sm:justify-start items-center sm:items-end">
									<div className="font-bold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">
										{formatRupee(settlement.amount)}
									</div>

									{isGroupSettlement ? (
										<Badge
											variant="secondary"
											className="mt-1 dark:bg-slate-800">
											Group settlement
										</Badge>
									) : (
										<div className="text-xs font-medium mt-1">
											{isCurrentUserPayer ? (
												<span className="text-amber-600 dark:text-amber-500">
													You paid
												</span>
											) : isCurrentUserReceiver ? (
												<span className="text-green-600 dark:text-green-500">
													You received
												</span>
											) : (
												<span className="text-muted-foreground">
													Payment
												</span>
											)}
										</div>
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
