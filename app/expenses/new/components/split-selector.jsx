"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function SplitSelector({
	type,
	amount,
	participants,
	paidByUserId,
	onSplitsChange,
}) {
	const { user } = useUser();
	const [splits, setSplits] = useState([]);
	const [totalPercentage, setTotalPercentage] = useState(0);
	const [totalAmount, setTotalAmount] = useState(0);

	// Calculate initial splits when inputs change
	useEffect(() => {
		if (!amount || amount <= 0 || participants.length === 0) {
			return;
		}

		let newSplits = [];

		if (type === "equal") {
			// FIXED: The Penny Drop Algorithm
			// Calculate base share rounded to 2 decimals
			const baseShare =
				Math.floor((amount / participants.length) * 100) / 100;
			const remainder =
				Math.round((amount - baseShare * participants.length) * 100) /
				100;

			newSplits = participants.map((participant, index) => {
				// Give the remainder pennies to the first person
				const actualAmount =
					index === 0 ? baseShare + remainder : baseShare;

				return {
					userId: participant.id,
					name: participant.name,
					email: participant.email,
					imageUrl: participant.imageUrl,
					amount: actualAmount,
					percentage: (actualAmount / amount) * 100,
					paid: participant.id === paidByUserId,
				};
			});
		} else if (type === "percentage") {
			const evenPercentage = 100 / participants.length;
			newSplits = participants.map((participant) => ({
				userId: participant.id,
				name: participant.name,
				email: participant.email,
				imageUrl: participant.imageUrl,
				amount: (amount * evenPercentage) / 100,
				percentage: evenPercentage,
				paid: participant.id === paidByUserId,
			}));
		} else if (type === "exact") {
			// FIXED: Apply Penny Drop to exact auto-fill too
			const baseShare =
				Math.floor((amount / participants.length) * 100) / 100;
			const remainder =
				Math.round((amount - baseShare * participants.length) * 100) /
				100;

			newSplits = participants.map((participant, index) => {
				const actualAmount =
					index === 0 ? baseShare + remainder : baseShare;
				return {
					userId: participant.id,
					name: participant.name,
					email: participant.email,
					imageUrl: participant.imageUrl,
					amount: actualAmount,
					percentage: (actualAmount / amount) * 100,
					paid: participant.id === paidByUserId,
				};
			});
		}

		setSplits(newSplits);

		// Let the parent dictate the total visually when in equal mode to prevent jitter
		setTotalAmount(
			type === "equal"
				? amount
				: newSplits.reduce((acc, curr) => acc + curr.amount, 0),
		);
		setTotalPercentage(100);

		if (onSplitsChange) {
			onSplitsChange(newSplits);
		}
	}, [type, amount, participants, paidByUserId]); // Removed onSplitsChange to prevent circular re-renders

	// WATERFALL AUTO-BALANCING: Update percentage splits
	const updatePercentageSplit = (userId, newPercentage) => {
		let updatedSplits = [...splits];
		const targetIndex = updatedSplits.findIndex((s) => s.userId === userId);

		const lockedSplits = updatedSplits.slice(0, targetIndex);
		const lockedSum = lockedSplits.reduce(
			(sum, s) => sum + s.percentage,
			0,
		);

		const clampedPercentage = Math.max(
			0,
			Math.min(100 - lockedSum, newPercentage),
		);

		updatedSplits[targetIndex] = {
			...updatedSplits[targetIndex],
			percentage: clampedPercentage,
			amount: (amount * clampedPercentage) / 100,
		};

		const remainderToDistribute = 100 - lockedSum - clampedPercentage;

		if (targetIndex < updatedSplits.length - 1) {
			const bottomSplits = updatedSplits.slice(targetIndex + 1);
			const sumBottom = bottomSplits.reduce(
				(sum, s) => sum + s.percentage,
				0,
			);

			for (let i = targetIndex + 1; i < updatedSplits.length; i++) {
				let newOtherPct = 0;
				if (sumBottom === 0) {
					newOtherPct = remainderToDistribute / bottomSplits.length;
				} else {
					newOtherPct =
						updatedSplits[i].percentage *
						(remainderToDistribute / sumBottom);
				}
				updatedSplits[i] = {
					...updatedSplits[i],
					percentage: newOtherPct,
					amount: (amount * newOtherPct) / 100,
				};
			}
		} else if (targetIndex > 0) {
			const aboveIndex = targetIndex - 1;
			const newAbovePct =
				updatedSplits[aboveIndex].percentage + remainderToDistribute;

			updatedSplits[aboveIndex] = {
				...updatedSplits[aboveIndex],
				percentage: newAbovePct,
				amount: (amount * newAbovePct) / 100,
			};
		}

		setSplits(updatedSplits);

		const newTotalAmount = updatedSplits.reduce(
			(sum, split) => sum + split.amount,
			0,
		);
		const newTotalPercentage = updatedSplits.reduce(
			(sum, split) => sum + split.percentage,
			0,
		);

		setTotalAmount(newTotalAmount);
		setTotalPercentage(newTotalPercentage);

		if (onSplitsChange) {
			onSplitsChange(updatedSplits);
		}
	};

	// WATERFALL AUTO-BALANCING: Update exact amount splits
	const updateExactSplit = (userId, newAmountStr) => {
		const parsedAmount =
			newAmountStr === "" ? 0 : parseFloat(newAmountStr) || 0;

		let updatedSplits = [...splits];
		const targetIndex = updatedSplits.findIndex((s) => s.userId === userId);

		const lockedSplits = updatedSplits.slice(0, targetIndex);
		const lockedSum = lockedSplits.reduce((sum, s) => sum + s.amount, 0);

		const clampedAmount = Math.max(
			0,
			Math.min(amount - lockedSum, parsedAmount),
		);

		updatedSplits[targetIndex] = {
			...updatedSplits[targetIndex],
			amount: clampedAmount,
			percentage: amount > 0 ? (clampedAmount / amount) * 100 : 0,
		};

		const remainderToDistribute = amount - lockedSum - clampedAmount;

		if (targetIndex < updatedSplits.length - 1) {
			const bottomSplits = updatedSplits.slice(targetIndex + 1);
			const sumBottom = bottomSplits.reduce(
				(sum, s) => sum + s.amount,
				0,
			);

			for (let i = targetIndex + 1; i < updatedSplits.length; i++) {
				let newOtherAmt = 0;
				if (sumBottom === 0) {
					newOtherAmt = remainderToDistribute / bottomSplits.length;
				} else {
					newOtherAmt =
						updatedSplits[i].amount *
						(remainderToDistribute / sumBottom);
				}
				updatedSplits[i] = {
					...updatedSplits[i],
					amount: newOtherAmt,
					percentage: amount > 0 ? (newOtherAmt / amount) * 100 : 0,
				};
			}
		} else if (targetIndex > 0) {
			const aboveIndex = targetIndex - 1;
			const newAboveAmt =
				updatedSplits[aboveIndex].amount + remainderToDistribute;

			updatedSplits[aboveIndex] = {
				...updatedSplits[aboveIndex],
				amount: newAboveAmt,
				percentage: amount > 0 ? (newAboveAmt / amount) * 100 : 0,
			};
		}

		setSplits(updatedSplits);

		const newTotalAmount = updatedSplits.reduce(
			(sum, split) => sum + split.amount,
			0,
		);
		const newTotalPercentage = updatedSplits.reduce(
			(sum, split) => sum + split.percentage,
			0,
		);

		setTotalAmount(newTotalAmount);
		setTotalPercentage(newTotalPercentage);

		if (onSplitsChange) {
			onSplitsChange(updatedSplits);
		}
	};

	const isPercentageValid = Math.abs(totalPercentage - 100) < 0.01;
	const isAmountValid = Math.abs(totalAmount - amount) < 0.01;

	// EARLY RETURN: Hide component if amount is 0 or empty
	if (!amount || amount <= 0 || participants.length === 0) {
		return null;
	}

	const inputClasses =
		"h-10 bg-background hover:bg-muted/30 dark:bg-slate-900/40 dark:border-slate-800 transition-colors focus-visible:ring-primary/30";

	return (
		<div className="space-y-3 mt-4">
			{splits.map((split) => (
				<div
					key={split.userId}
					className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-transparent bg-muted/20 dark:bg-slate-900/30">
					<div className="flex items-center gap-3 w-40 sm:w-48 shrink-0 truncate">
						<Avatar className="h-8 w-8 border shadow-sm shrink-0">
							<AvatarImage src={split.imageUrl} />
							<AvatarFallback className="bg-muted text-xs">
								{split.name?.charAt(0) || "?"}
							</AvatarFallback>
						</Avatar>
						<span className="text-sm font-medium text-foreground/90 truncate">
							{split.userId === user?.id ? "You" : split.name}
						</span>
					</div>

					{type === "equal" && (
						<div className="text-right text-sm font-medium text-foreground/80 bg-background dark:bg-slate-900/50 px-3 py-1.5 rounded-md border shadow-sm">
							₹{split.amount.toFixed(2)}{" "}
							<span className="text-muted-foreground ml-1 font-normal">
								({split.percentage.toFixed(1)}%)
							</span>
						</div>
					)}

					{type === "percentage" && (
						<div className="flex items-center gap-4 flex-1 w-full">
							<Slider
								value={[split.percentage]}
								min={0}
								max={100}
								step={0.1}
								onValueChange={(values) =>
									updatePercentageSplit(
										split.userId,
										values[0],
									)
								}
								className="flex-1 hidden sm:flex"
							/>
							<div className="flex gap-2 items-center justify-end w-full sm:w-auto shrink-0">
								<div className="relative">
									<Input
										type="number"
										min="0"
										max="100"
										step="0.1"
										value={
											split.percentage === 0
												? ""
												: Number(
														split.percentage.toFixed(
															1,
														),
													)
										}
										onChange={(e) =>
											updatePercentageSplit(
												split.userId,
												parseFloat(e.target.value) || 0,
											)
										}
										className={cn(
											inputClasses,
											"w-24 pr-7 text-right font-medium",
										)}
									/>
									<span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
										%
									</span>
								</div>
								<span className="text-sm font-medium text-muted-foreground w-16 text-right shrink-0">
									₹{split.amount.toFixed(2)}
								</span>
							</div>
						</div>
					)}

					{type === "exact" && (
						<div className="flex items-center gap-2 flex-1 justify-end">
							<div className="flex gap-2 items-center shrink-0">
								<div className="relative">
									<span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
										₹
									</span>
									<Input
										type="number"
										min="0"
										max={amount}
										step="0.01"
										value={
											split.amount === 0
												? ""
												: Number(
														split.amount.toFixed(2),
													)
										}
										onChange={(e) =>
											updateExactSplit(
												split.userId,
												e.target.value,
											)
										}
										className={cn(
											inputClasses,
											"w-28 pl-7 font-medium",
										)}
									/>
								</div>
								<span className="text-sm text-muted-foreground w-14 text-right shrink-0">
									({split.percentage.toFixed(1)}%)
								</span>
							</div>
						</div>
					)}
				</div>
			))}

			{/* Total row */}
			<div className="flex justify-between items-center border-t dark:border-slate-800 pt-4 mt-4 px-2">
				<span className="font-semibold text-foreground/80">Total</span>
				<div className="text-right flex items-center gap-2">
					<span
						className={cn(
							"font-bold text-lg",
							!isAmountValid
								? "text-amber-600 dark:text-amber-500"
								: "text-foreground",
						)}>
						₹{totalAmount.toFixed(2)}
					</span>
					{type !== "equal" && (
						<span
							className={cn(
								"text-sm font-medium",
								!isPercentageValid
									? "text-amber-600 dark:text-amber-500"
									: "text-muted-foreground",
							)}>
							({totalPercentage.toFixed(1)}%)
						</span>
					)}
				</div>
			</div>

			{type === "percentage" && !isPercentageValid && (
				<div className="flex items-center gap-2 p-3 mt-4 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-md border border-dashed border-amber-200 dark:border-amber-800/50">
					<AlertCircle className="h-4 w-4 shrink-0" />
					<span>The percentages should add up to 100%.</span>
				</div>
			)}

			{type === "exact" && !isAmountValid && (
				<div className="flex items-center gap-2 p-3 mt-4 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-md border border-dashed border-amber-200 dark:border-amber-800/50">
					<AlertCircle className="h-4 w-4 shrink-0" />
					<span>
						The sum of all splits (₹{totalAmount.toFixed(2)}) should
						equal the total amount (₹{amount.toFixed(2)}).
					</span>
				</div>
			)}
		</div>
	);
}
