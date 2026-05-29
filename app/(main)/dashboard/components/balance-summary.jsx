import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowUpCircle, ArrowDownCircle, CheckCircle2 } from "lucide-react";
import { formatRupee } from "@/lib/utils";

export function BalanceSummary({ balances }) {
	if (!balances) return null;

	const { oweDetails } = balances;
	const hasOwed = oweDetails.youAreOwedBy.length > 0;
	const hasOwing = oweDetails.youOwe.length > 0;

	return (
		<div className="space-y-6 animate-in fade-in duration-500">
			{/* Empty State */}
			{!hasOwed && !hasOwing && (
				<div className="text-center py-8 px-4 bg-muted/30 dark:bg-slate-800/20 rounded-xl border border-dashed dark:border-slate-800 flex flex-col items-center transition-all">
					<div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full mb-3">
						<CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-500" />
					</div>
					<p className="text-foreground/90 font-medium">
						You're all settled up!
					</p>
					<p className="text-xs text-muted-foreground mt-1">
						No outstanding balances with anyone.
					</p>
				</div>
			)}

			{/* Owed to you Section */}
			{hasOwed && (
				<div>
					<h3 className="text-sm font-semibold flex items-center mb-3 text-foreground/90">
						<ArrowUpCircle className="h-4 w-4 text-green-500 mr-2" />
						Owed to you
					</h3>
					<div className="space-y-1.5">
						{oweDetails.youAreOwedBy.map((item) => (
							<Link
								href={`/person/${item.userId}`}
								key={item.userId}
								className="group flex items-center justify-between p-2.5 rounded-lg border border-transparent hover:border-border dark:hover:border-slate-800 hover:bg-muted/50 dark:hover:bg-slate-800/50 transition-all duration-200 active:scale-[0.98]">
								<div className="flex items-center gap-3">
									<Avatar className="h-9 w-9 border border-background/20 shadow-sm group-hover:scale-105 transition-transform duration-200">
										<AvatarImage
											src={item.imageUrl}
											className="object-cover"
										/>
										<AvatarFallback className="bg-primary/10 text-primary font-medium">
											{item.name.charAt(0)}
										</AvatarFallback>
									</Avatar>
									<span className="text-sm font-medium group-hover:text-primary transition-colors">
										{item.name}
									</span>
								</div>
								<span className="font-bold text-green-600 dark:text-green-500">
									{formatRupee(item.amount)}
								</span>
							</Link>
						))}
					</div>
				</div>
			)}

			{/* Visual Divider if both sections exist */}
			{hasOwed && hasOwing && (
				<div className="h-px w-full bg-border/50 dark:bg-slate-800" />
			)}

			{/* You owe Section */}
			{hasOwing && (
				<div>
					<h3 className="text-sm font-semibold flex items-center mb-3 text-foreground/90">
						<ArrowDownCircle className="h-4 w-4 text-red-500 mr-2" />
						You owe
					</h3>
					<div className="space-y-1.5">
						{oweDetails.youOwe.map((item) => (
							<Link
								href={`/person/${item.userId}`}
								key={item.userId}
								className="group flex items-center justify-between p-2.5 rounded-lg border border-transparent hover:border-border dark:hover:border-slate-800 hover:bg-muted/50 dark:hover:bg-slate-800/50 transition-all duration-200 active:scale-[0.98]">
								<div className="flex items-center gap-3">
									<Avatar className="h-9 w-9 border border-background/20 shadow-sm group-hover:scale-105 transition-transform duration-200">
										<AvatarImage
											src={item.imageUrl}
											className="object-cover"
										/>
										<AvatarFallback className="bg-destructive/10 text-destructive font-medium">
											{item.name.charAt(0)}
										</AvatarFallback>
									</Avatar>
									<span className="text-sm font-medium group-hover:text-destructive transition-colors">
										{item.name}
									</span>
								</div>
								<span className="font-bold text-red-600 dark:text-red-500">
									{formatRupee(item.amount)}
								</span>
							</Link>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
