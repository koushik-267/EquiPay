"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2, Handshake } from "lucide-react";

// Form schema validation
const settlementSchema = z.object({
	amount: z
		.string()
		.min(1, "Amount is required")
		.refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
			message: "Amount must be a positive number",
		}),
	note: z.string().optional(),
	paymentType: z.enum(["youPaid", "theyPaid"]),
});

export default function SettlementForm({ entityType, entityData, onSuccess }) {
	const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);
	const createSettlement = useConvexMutation(
		api.settlements.createSettlement,
	);

	// Set up form with validation
	const {
		register,
		handleSubmit,
		watch,
		formState: { errors, isSubmitting },
	} = useForm({
		resolver: zodResolver(settlementSchema),
		defaultValues: {
			amount: "",
			note: "",
			paymentType: "youPaid",
		},
	});

	// Get selected payment direction
	const paymentType = watch("paymentType");

	// Single user settlement
	const handleUserSettlement = async (data) => {
		const amount = parseFloat(data.amount);

		try {
			// Determine payer and receiver based on the selected payment type
			const paidByUserId =
				data.paymentType === "youPaid"
					? currentUser._id
					: entityData.counterpart.userId;

			const receivedByUserId =
				data.paymentType === "youPaid"
					? entityData.counterpart.userId
					: currentUser._id;

			await createSettlement.mutate({
				amount,
				note: data.note,
				paidByUserId,
				receivedByUserId,
				// No groupId for user settlements
			});

			toast.success("Settlement recorded successfully!");
			if (onSuccess) onSuccess();
		} catch (error) {
			toast.error("Failed to record settlement: " + error.message);
		}
	};

	// Group settlement
	const handleGroupSettlement = async (data, selectedUserId) => {
		if (!selectedUserId) {
			toast.error("Please select a group member to settle with");
			return;
		}

		const amount = parseFloat(data.amount);

		try {
			// Get the selected user from the group balances
			const selectedUser = entityData.balances.find(
				(balance) => balance.userId === selectedUserId,
			);

			if (!selectedUser) {
				toast.error("Selected user not found in group");
				return;
			}

			// Determine payer and receiver based on the selected payment type and balances
			const paidByUserId =
				data.paymentType === "youPaid"
					? currentUser._id
					: selectedUser.userId;

			const receivedByUserId =
				data.paymentType === "youPaid"
					? selectedUser.userId
					: currentUser._id;

			await createSettlement.mutate({
				amount,
				note: data.note,
				paidByUserId,
				receivedByUserId,
				groupId: entityData.group.id,
			});

			toast.success("Settlement recorded successfully!");
			if (onSuccess) onSuccess();
		} catch (error) {
			toast.error("Failed to record settlement: " + error.message);
		}
	};

	// Handle form submission
	const onSubmit = async (data) => {
		if (entityType === "user") {
			await handleUserSettlement(data);
		} else if (entityType === "group" && selectedGroupMemberId) {
			await handleGroupSettlement(data, selectedGroupMemberId);
		}
	};

	// For group settlements, we need to select a member
	const [selectedGroupMemberId, setSelectedGroupMemberId] = useState(null);

	// ➔ THE FIX: Added !entityData to the early return guard
	if (!currentUser || !entityData) return null;

	const inputClasses =
		"bg-background hover:bg-muted/30 dark:bg-slate-900/40 dark:border-slate-800 transition-colors focus-visible:ring-primary/30";

	// Render the form for individual settlement
	if (entityType === "user") {
		const otherUser = entityData.counterpart;
		const netBalance = entityData.netBalance;

		return (
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
				{/* Balance information */}
				<div
					className={cn(
						"p-5 rounded-xl border flex flex-col justify-center items-center text-center gap-1.5 shadow-sm",
						netBalance === 0
							? "bg-muted/40 border-slate-200 dark:border-slate-800"
							: netBalance > 0
								? "bg-emerald-500/10 border-emerald-500/20"
								: "bg-rose-500/10 border-rose-500/20",
					)}>
					{netBalance === 0 ? (
						<div className="flex flex-col items-center gap-2">
							<Handshake className="h-6 w-6 text-muted-foreground mb-1" />
							<p className="font-medium text-foreground/80">
								You are all settled up with {otherUser.name}
							</p>
						</div>
					) : netBalance > 0 ? (
						<>
							<p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
								{otherUser.name} owes you
							</p>
							<span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
								₹{netBalance.toFixed(2)}
							</span>
						</>
					) : (
						<>
							<p className="text-sm font-medium text-rose-700 dark:text-rose-400">
								You owe {otherUser.name}
							</p>
							<span className="text-3xl font-bold text-rose-600 dark:text-rose-400">
								₹{Math.abs(netBalance).toFixed(2)}
							</span>
						</>
					)}
				</div>

				{/* Payment direction */}
				<div className="space-y-3">
					<Label className="text-foreground/90 font-medium">
						Who paid?
					</Label>
					<RadioGroup
						defaultValue="youPaid"
						{...register("paymentType")}
						className="grid grid-cols-1 gap-3"
						onValueChange={(value) => {
							register("paymentType").onChange({
								target: { name: "paymentType", value },
							});
						}}>
						<Label
							htmlFor="youPaid"
							className={cn(
								"flex items-center space-x-3 border rounded-xl p-4 cursor-pointer transition-all hover:border-primary/50",
								paymentType === "youPaid"
									? "border-primary bg-primary/5 ring-1 ring-primary/20"
									: "border-slate-200 dark:border-slate-800 bg-background dark:bg-slate-900/40",
							)}>
							<RadioGroupItem value="youPaid" id="youPaid" />
							<div className="flex items-center gap-3">
								<Avatar className="h-8 w-8 border shadow-sm">
									<AvatarImage src={currentUser.imageUrl} />
									<AvatarFallback className="bg-muted text-xs">
										{currentUser.name.charAt(0)}
									</AvatarFallback>
								</Avatar>
								<span className="font-medium">
									You paid {otherUser.name}
								</span>
							</div>
						</Label>

						<Label
							htmlFor="theyPaid"
							className={cn(
								"flex items-center space-x-3 border rounded-xl p-4 cursor-pointer transition-all hover:border-primary/50",
								paymentType === "theyPaid"
									? "border-primary bg-primary/5 ring-1 ring-primary/20"
									: "border-slate-200 dark:border-slate-800 bg-background dark:bg-slate-900/40",
							)}>
							<RadioGroupItem value="theyPaid" id="theyPaid" />
							<div className="flex items-center gap-3">
								<Avatar className="h-8 w-8 border shadow-sm">
									<AvatarImage src={otherUser.imageUrl} />
									<AvatarFallback className="bg-muted text-xs">
										{otherUser.name.charAt(0)}
									</AvatarFallback>
								</Avatar>
								<span className="font-medium">
									{otherUser.name} paid you
								</span>
							</div>
						</Label>
					</RadioGroup>
				</div>

				{/* Amount */}
				<div className="space-y-3">
					<Label
						htmlFor="amount"
						className="text-foreground/90 font-medium">
						Amount
					</Label>
					<div className="relative">
						<span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
							₹
						</span>
						<Input
							id="amount"
							placeholder="0.00"
							type="number"
							step="0.01"
							min="0.01"
							className={cn(inputClasses, "pl-8 h-12")}
							{...register("amount")}
						/>
					</div>
					{errors.amount && (
						<p className="text-xs font-medium text-red-500 mt-1">
							{errors.amount.message}
						</p>
					)}
				</div>

				{/* Note */}
				<div className="space-y-3">
					<Label
						htmlFor="note"
						className="text-foreground/90 font-medium">
						Note (optional)
					</Label>
					<Textarea
						id="note"
						placeholder="Dinner, rent, etc."
						className={cn(
							inputClasses,
							"min-h-[100px] resize-none",
						)}
						{...register("note")}
					/>
				</div>

				<div className="pt-2">
					<Button
						type="submit"
						size="lg"
						className="w-full h-12 text-md shadow-md transition-all hover:shadow-lg"
						disabled={isSubmitting}>
						{isSubmitting ? (
							<>
								<Loader2 className="mr-2 h-5 w-5 animate-spin" />
								Recording...
							</>
						) : (
							<>
								<CheckCircle2 className="mr-2 h-5 w-5" />
								Record Settlement
							</>
						)}
					</Button>
				</div>
			</form>
		);
	}

	// Render form for group settlement
	if (entityType === "group") {
		const groupMembers = entityData.balances;

		return (
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
				{/* Select group member */}
				<div className="space-y-3">
					<Label className="text-foreground/90 font-medium">
						Who are you settling with?
					</Label>
					<div className="grid grid-cols-1 gap-2.5">
						{groupMembers.map((member) => {
							const isSelected =
								selectedGroupMemberId === member.userId;
							const isOwing = member.netBalance < 0;
							const isOwed = member.netBalance > 0;

							return (
								<div
									key={member.userId}
									className={cn(
										"border rounded-xl p-3.5 cursor-pointer transition-all hover:border-primary/50 shadow-sm",
										isSelected
											? "border-primary bg-primary/5 ring-1 ring-primary/20"
											: "border-slate-200 dark:border-slate-800 bg-background dark:bg-slate-900/40",
									)}
									onClick={() =>
										setSelectedGroupMemberId(member.userId)
									}>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<Avatar className="h-9 w-9 border shadow-sm">
												<AvatarImage
													src={member.imageUrl}
												/>
												<AvatarFallback className="bg-muted text-xs">
													{member.name.charAt(0)}
												</AvatarFallback>
											</Avatar>
											<span className="font-medium text-foreground/90">
												{member.name}
											</span>
										</div>
										<div
											className={cn(
												"font-semibold text-sm",
												isOwing
													? "text-emerald-600 dark:text-emerald-400"
													: isOwed
														? "text-rose-600 dark:text-rose-400"
														: "text-muted-foreground font-medium",
											)}>
											{isOwing
												? `They owe you ₹${Math.abs(member.netBalance).toFixed(2)}`
												: isOwed
													? `You owe ₹${Math.abs(member.netBalance).toFixed(2)}`
													: "Settled up"}
										</div>
									</div>
								</div>
							);
						})}
					</div>
					{!selectedGroupMemberId && (
						<p className="text-xs font-medium text-amber-600 dark:text-amber-500 mt-1">
							Please select a member to settle with
						</p>
					)}
				</div>

				{selectedGroupMemberId && (
					<div className="space-y-7 animate-in fade-in slide-in-from-top-2 duration-300">
						{/* Payment direction */}
						<div className="space-y-3 pt-2 border-t dark:border-slate-800">
							<Label className="text-foreground/90 font-medium">
								Who paid?
							</Label>
							<RadioGroup
								defaultValue="youPaid"
								{...register("paymentType")}
								className="grid grid-cols-1 gap-3"
								onValueChange={(value) => {
									register("paymentType").onChange({
										target: { name: "paymentType", value },
									});
								}}>
								<Label
									htmlFor="youPaid"
									className={cn(
										"flex items-center space-x-3 border rounded-xl p-4 cursor-pointer transition-all hover:border-primary/50 shadow-sm",
										paymentType === "youPaid"
											? "border-primary bg-primary/5 ring-1 ring-primary/20"
											: "border-slate-200 dark:border-slate-800 bg-background dark:bg-slate-900/40",
									)}>
									<RadioGroupItem
										value="youPaid"
										id="youPaid"
									/>
									<div className="flex items-center gap-3">
										<Avatar className="h-8 w-8 border shadow-sm">
											<AvatarImage
												src={currentUser.imageUrl}
											/>
											<AvatarFallback className="bg-muted text-xs">
												{currentUser.name.charAt(0)}
											</AvatarFallback>
										</Avatar>
										<span className="font-medium text-foreground/90">
											You paid{" "}
											{
												groupMembers.find(
													(m) =>
														m.userId ===
														selectedGroupMemberId,
												)?.name
											}
										</span>
									</div>
								</Label>

								<Label
									htmlFor="theyPaid"
									className={cn(
										"flex items-center space-x-3 border rounded-xl p-4 cursor-pointer transition-all hover:border-primary/50 shadow-sm",
										paymentType === "theyPaid"
											? "border-primary bg-primary/5 ring-1 ring-primary/20"
											: "border-slate-200 dark:border-slate-800 bg-background dark:bg-slate-900/40",
									)}>
									<RadioGroupItem
										value="theyPaid"
										id="theyPaid"
									/>
									<div className="flex items-center gap-3">
										<Avatar className="h-8 w-8 border shadow-sm">
											<AvatarImage
												src={
													groupMembers.find(
														(m) =>
															m.userId ===
															selectedGroupMemberId,
													)?.imageUrl
												}
											/>
											<AvatarFallback className="bg-muted text-xs">
												{groupMembers
													.find(
														(m) =>
															m.userId ===
															selectedGroupMemberId,
													)
													?.name.charAt(0)}
											</AvatarFallback>
										</Avatar>
										<span className="font-medium text-foreground/90">
											{
												groupMembers.find(
													(m) =>
														m.userId ===
														selectedGroupMemberId,
												)?.name
											}{" "}
											paid you
										</span>
									</div>
								</Label>
							</RadioGroup>
						</div>

						{/* Amount */}
						<div className="space-y-3">
							<Label
								htmlFor="amount"
								className="text-foreground/90 font-medium">
								Amount
							</Label>
							<div className="relative">
								<span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
									₹
								</span>
								<Input
									id="amount"
									placeholder="0.00"
									type="number"
									step="0.01"
									min="0.01"
									className={cn(inputClasses, "pl-8 h-12")}
									{...register("amount")}
								/>
							</div>
							{errors.amount && (
								<p className="text-xs font-medium text-red-500 mt-1">
									{errors.amount.message}
								</p>
							)}
						</div>

						{/* Note */}
						<div className="space-y-3">
							<Label
								htmlFor="note"
								className="text-foreground/90 font-medium">
								Note (optional)
							</Label>
							<Textarea
								id="note"
								placeholder="Dinner, rent, etc."
								className={cn(
									inputClasses,
									"min-h-[100px] resize-none",
								)}
								{...register("note")}
							/>
						</div>
					</div>
				)}

				<div className="pt-2">
					<Button
						type="submit"
						size="lg"
						className="w-full h-12 text-md shadow-md transition-all hover:shadow-lg"
						disabled={isSubmitting || !selectedGroupMemberId}>
						{isSubmitting ? (
							<>
								<Loader2 className="mr-2 h-5 w-5 animate-spin" />
								Recording...
							</>
						) : (
							<>
								<CheckCircle2 className="mr-2 h-5 w-5" />
								Record Settlement
							</>
						)}
					</Button>
				</div>
			</form>
		);
	}

	return null;
}
