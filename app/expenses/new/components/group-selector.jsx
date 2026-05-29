"use client";

import { useState, useEffect } from "react";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { Users, AlertCircle, Loader2 } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export function GroupSelector({ onChange }) {
	const [selectedGroupId, setSelectedGroupId] = useState("");

	// Single query to get all data we need
	const { data, isLoading } = useConvexQuery(
		api.groups.getGroupOrMembers,
		selectedGroupId ? { groupId: selectedGroupId } : {},
	);

	// When group data changes, notify parent
	useEffect(() => {
		if (data?.selectedGroup && onChange) {
			onChange(data.selectedGroup);
		}
	}, [data, onChange]);

	const handleGroupChange = (groupId) => {
		setSelectedGroupId(groupId);
	};

	// Sleek skeleton loader that matches the input shape
	if (isLoading && !data) {
		return (
			<div className="flex items-center h-12 w-full animate-pulse bg-muted/40 dark:bg-slate-800/40 rounded-md border border-dashed border-slate-200 dark:border-slate-700 px-3">
				<div className="h-4 w-1/3 bg-muted-foreground/20 rounded"></div>
			</div>
		);
	}

	// Polished empty state
	if (!data?.groups || data.groups.length === 0) {
		return (
			<div className="flex items-center gap-3 h-12 w-full text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-md border border-dashed border-amber-200 dark:border-amber-800/50 px-3">
				<AlertCircle className="h-4 w-4 shrink-0" />
				<span>You need to create a group first.</span>
			</div>
		);
	}

	return (
		<div className="relative">
			<Select value={selectedGroupId} onValueChange={handleGroupChange}>
				<SelectTrigger className="w-full h-12 bg-background hover:bg-muted/30 dark:bg-slate-900/40 dark:border-slate-800 transition-colors focus:ring-primary/30">
					<SelectValue placeholder="Select a group" />
				</SelectTrigger>
				<SelectContent className="dark:bg-slate-900 dark:border-slate-800 shadow-xl rounded-xl">
					{data.groups.map((group) => (
						<SelectItem
							key={group.id}
							value={group.id}
							className="cursor-pointer focus:bg-primary/5 dark:focus:bg-primary/10 focus:text-primary transition-colors py-2.5 my-0.5 rounded-lg">
							<div className="flex items-center gap-3">
								<div className="bg-primary/10 dark:bg-primary/20 p-1.5 rounded-md shrink-0">
									<Users className="h-4 w-4 text-primary" />
								</div>
								<div className="flex flex-col items-start leading-none">
									<span className="font-medium text-foreground/90">
										{group.name}
									</span>
									<span className="text-[11px] text-muted-foreground mt-1">
										{group.memberCount} member
										{group.memberCount !== 1 && "s"}
									</span>
								</div>
							</div>
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			{/* Subtle background loader if fetching new members for a selected group */}
			{isLoading && selectedGroupId && (
				<div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none">
					<Loader2 className="h-4 w-4 animate-spin text-muted-foreground/50" />
				</div>
			)}
		</div>
	);
}
