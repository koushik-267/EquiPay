"use client";

import { useConvexQuery } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowUpCircle, ArrowDownCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { formatRupee } from "@/lib/utils";

/**
 * Expected `balances` shape (one object per member):
 * {
 * id:           string;           // user id
 * name:         string;
 * imageUrl?:    string;
 * totalBalance: number;           // + ve ⇒ they are owed, – ve ⇒ they owe
 * owes:   { to: string;   amount: number }[];  // this member → others
 * owedBy: { from: string; amount: number }[];  // others → this member
 * }
 */
export function GroupBalances({ balances }) {
	const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);

	/* ───── guards ────────────────────────────────────────────────────────── */
	if (!balances?.length || !currentUser) {
		return (
			<div className="text-center py-8 text-muted-foreground animate-in fade-in">
				No balance information available
			</div>
		);
	}

	/* ───── helpers ───────────────────────────────────────────────────────── */
	const me = balances.find((b) => b.id === currentUser._id);
	if (!me) {
		return (
			<div className="text-center py-8 text-muted-foreground animate-in fade-in">
				You're not part of this group
			</div>
		);
	}

	const userMap = Object.fromEntries(balances.map((b) => [b.id, b]));

	// Who owes me?
	const owedByMembers = me.owedBy
		.map(({ from, amount }) => ({ ...userMap[from], amount }))
		.sort((a, b) => b.amount - a.amount);

	// Whom do I owe?
	const owingToMembers = me.owes
		.map(({ to, amount }) => ({ ...userMap[to], amount }))
		.sort((a, b) => b.amount - a.amount);

	const isAllSettledUp =
		me.totalBalance === 0 &&
		owedByMembers.length === 0 &&
		owingToMembers.length === 0;

	/* ───── UI ────────────────────────────────────────────────────────────── */
	return (
		<div className="space-y-6 animate-in fade-in duration-500">
			{/* Current user's total balance */}
			<div className="text-center pb-6 border-b dark:border-slate-800/60">
				<p className="text-sm font-medium text-muted-foreground mb-2">
					Your Group Balance
				</p>
				<p
					className={`text-4xl font-bold tracking-tight ${
						me.totalBalance > 0
							? "text-green-600 dark:text-green-500"
							: me.totalBalance < 0
								? "text-red-600 dark:text-red-500"
								: "text-foreground"
					}`}>
					{me.totalBalance > 0 ? "+" : me.totalBalance < 0 ? "-" : ""}
					{formatRupee(Math.abs(me.totalBalance))}
				</p>
				<p className="text-sm font-medium text-muted-foreground mt-2">
					{me.totalBalance > 0
						? "You are owed money"
						: me.totalBalance < 0
							? "You owe money"
							: "You are all settled up"}
				</p>
			</div>

			{isAllSettledUp ? (
				<div className="text-center py-8 px-4 bg-muted/30 dark:bg-slate-800/20 rounded-xl border border-dashed dark:border-slate-800 flex flex-col items-center transition-all">
					<div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full mb-3">
						<CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-500" />
					</div>
					<p className="text-foreground/90 font-medium">
						Everyone is settled up!
					</p>
					<p className="text-xs text-muted-foreground mt-1">
						No outstanding balances in this group.
					</p>
				</div>
			) : (
				<div className="space-y-6">
					{/* People who owe the current user */}
					{owedByMembers.length > 0 && (
						<div>
							<h3 className="text-sm font-semibold flex items-center mb-3 text-foreground/90">
								<ArrowUpCircle className="h-4 w-4 text-green-500 mr-2" />
								Owed to you
							</h3>
							<div className="space-y-1.5">
								{owedByMembers.map((member) => (
									<Link
										href={`/person/${member.id}`}
										key={member.id}
										className="group flex items-center justify-between p-2.5 rounded-lg border border-transparent hover:border-border dark:hover:border-slate-800 hover:bg-muted/50 dark:hover:bg-slate-800/50 transition-all duration-200 active:scale-[0.98]">
										<div className="flex items-center gap-3">
											<Avatar className="h-9 w-9 border border-background/20 shadow-sm group-hover:scale-105 transition-transform duration-200">
												<AvatarImage
													src={member.imageUrl}
													className="object-cover"
												/>
												<AvatarFallback className="bg-primary/10 text-primary font-medium">
													{member.name?.charAt(0) ??
														"?"}
												</AvatarFallback>
											</Avatar>
											<span className="text-sm font-medium group-hover:text-primary transition-colors">
												{member.name}
											</span>
										</div>
										<span className="font-bold text-green-600 dark:text-green-500">
											{formatRupee(member.amount)}
										</span>
									</Link>
								))}
							</div>
						</div>
					)}

					{/* Visual Divider if both sections exist */}
					{owedByMembers.length > 0 && owingToMembers.length > 0 && (
						<div className="h-px w-full bg-border/50 dark:bg-slate-800" />
					)}

					{/* People the current user owes */}
					{owingToMembers.length > 0 && (
						<div>
							<h3 className="text-sm font-semibold flex items-center mb-3 text-foreground/90">
								<ArrowDownCircle className="h-4 w-4 text-red-500 mr-2" />
								You owe
							</h3>
							<div className="space-y-1.5">
								{owingToMembers.map((member) => (
									<Link
										href={`/person/${member.id}`}
										key={member.id}
										className="group flex items-center justify-between p-2.5 rounded-lg border border-transparent hover:border-border dark:hover:border-slate-800 hover:bg-muted/50 dark:hover:bg-slate-800/50 transition-all duration-200 active:scale-[0.98]">
										<div className="flex items-center gap-3">
											<Avatar className="h-9 w-9 border border-background/20 shadow-sm group-hover:scale-105 transition-transform duration-200">
												<AvatarImage
													src={member.imageUrl}
													className="object-cover"
												/>
												<AvatarFallback className="bg-destructive/10 text-destructive font-medium">
													{member.name?.charAt(0) ??
														"?"}
												</AvatarFallback>
											</Avatar>
											<span className="text-sm font-medium group-hover:text-destructive transition-colors">
												{member.name}
											</span>
										</div>
										<span className="font-bold text-red-600 dark:text-red-500">
											{formatRupee(member.amount)}
										</span>
									</Link>
								))}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
