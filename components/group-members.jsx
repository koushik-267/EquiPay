"use client";

import { useConvexQuery } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, ShieldCheck, ChevronRight } from "lucide-react";
import Link from "next/link";

export function GroupMembers({ members }) {
	const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);

	if (!members || members.length === 0) {
		return (
			<div className="text-center py-8 px-4 bg-muted/30 dark:bg-slate-800/20 rounded-xl border border-dashed dark:border-slate-800 flex flex-col items-center transition-all animate-in fade-in duration-500">
				<div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-full mb-3 opacity-80">
					<Users className="h-6 w-6 text-primary" />
				</div>
				<p className="text-foreground/90 font-medium">
					No members found
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-1.5 animate-in fade-in duration-500">
			{members.map((member) => {
				const isCurrentUser = member.id === currentUser?._id;
				const isAdmin = member.role === "admin";

				// Abstracted inner content
				const innerContent = (
					<>
						<div className="flex items-center gap-3">
							{/* Removed restriction so avatar always scales on hover */}
							<Avatar className="h-9 w-9 border border-background/20 shadow-sm transition-transform duration-200 group-hover:scale-105">
								<AvatarImage
									src={member.imageUrl}
									className="object-cover"
								/>
								<AvatarFallback className="bg-primary/10 text-primary font-medium">
									{member.name.charAt(0)}
								</AvatarFallback>
							</Avatar>

							<div className="flex flex-col">
								<div className="flex items-center gap-2">
									{/* Removed restriction so text always turns primary on hover */}
									<span className="text-sm font-medium transition-colors group-hover:text-primary">
										{isCurrentUser ? "You" : member.name}
									</span>
								</div>
							</div>
						</div>

						<div className="flex items-center gap-3">
							{isAdmin && (
								<div className="flex items-center text-xs font-medium text-muted-foreground bg-muted dark:bg-slate-800/80 px-2 py-1 rounded-md">
									<ShieldCheck className="h-3 w-3 mr-1 text-primary opacity-80" />
									Admin
								</div>
							)}

							{/* Only show the chevron arrow if it's NOT the current user */}
							{!isCurrentUser && (
								<ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
							)}
						</div>
					</>
				);

				// Current User: Give it the 'group' class and hover backgrounds, but no click/scale effects
				if (isCurrentUser) {
					return (
						<div
							key={member.id}
							className="group flex items-center justify-between p-2.5 rounded-lg border border-transparent hover:border-border dark:hover:border-slate-800 hover:bg-muted/50 dark:hover:bg-slate-800/50 transition-all duration-200">
							{innerContent}
						</div>
					);
				}

				// Other Users: Interactive Link WITH click effects (active:scale-[0.98])
				return (
					<Link
						href={`/person/${member.id}`}
						key={member.id}
						className="group flex items-center justify-between p-2.5 rounded-lg border border-transparent hover:border-border dark:hover:border-slate-800 hover:bg-muted/50 dark:hover:bg-slate-800/50 transition-all duration-200 active:scale-[0.98]">
						{innerContent}
					</Link>
				);
			})}
		</div>
	);
}
