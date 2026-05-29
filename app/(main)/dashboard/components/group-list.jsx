import Link from "next/link";
import { Users, ChevronRight } from "lucide-react";
import { formatRupee } from "@/lib/utils";

export function GroupList({ groups }) {
	if (!groups || groups.length === 0) {
		return (
			<div className="text-center py-8 px-4 bg-muted/30 dark:bg-slate-800/20 rounded-xl border border-dashed dark:border-slate-800 flex flex-col items-center transition-all animate-in fade-in duration-500">
				<div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full mb-3 opacity-80">
					<Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
				</div>
				<p className="text-foreground/90 font-medium">No groups yet</p>
				<p className="text-xs text-muted-foreground mt-1">
					Create a group to start tracking shared expenses
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-1.5 animate-in fade-in duration-500">
			{groups.map((group) => {
				// Calculate total balance in the group
				const balance = group.balance || 0;
				const hasBalance = balance !== 0;

				return (
					<Link
						href={`/groups/${group.id}`}
						key={group.id}
						className="group flex items-center justify-between p-2.5 rounded-lg border border-transparent hover:border-border dark:hover:border-slate-800 hover:bg-muted/50 dark:hover:bg-slate-800/50 transition-all duration-200 active:scale-[0.98]">
						<div className="flex items-center gap-3">
							<div className="bg-purple-100 dark:bg-purple-900/30 p-2.5 rounded-lg group-hover:scale-105 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-all duration-200">
								<Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
							</div>
							<div>
								<p className="font-medium text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
									{group.name}
								</p>
								<p className="text-xs text-muted-foreground flex items-center mt-0.5">
									<span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 mr-1.5 group-hover:bg-purple-400 transition-colors" />
									{group.members.length} members
								</p>
							</div>
						</div>

						<div className="flex items-center gap-3">
							{hasBalance && (
								<span
									className={`text-sm font-bold tracking-tight ${
										balance > 0
											? "text-green-600 dark:text-green-500"
											: "text-red-600 dark:text-red-500"
									}`}>
									{balance > 0 ? "+" : "-"}
									{formatRupee(Math.abs(balance))}
								</span>
							)}
							<ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
						</div>
					</Link>
				);
			})}
		</div>
	);
}
