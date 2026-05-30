"use client";

import { useState } from "react";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, UserPlus, Loader2 } from "lucide-react";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function ParticipantSelector({ participants, onParticipantsChange }) {
	const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	// Search for users
	const { data: searchResults, isLoading } = useConvexQuery(
		api.users.searchUsers,
		{ query: searchQuery },
	);

	const uniqueSearchResults = [];
	const seenEmails = new Set();

	if (searchResults) {
		for (const user of searchResults) {
			// If the user has an email we haven't seen yet, add them to our unique list
			if (user.email && !seenEmails.has(user.email)) {
				seenEmails.add(user.email);
				uniqueSearchResults.push(user);
			}
		}
	}

	// Filter out the current user AND already added participants using BOTH ID and Email
	const availableUsers = uniqueSearchResults.filter((user) => {
		const userId = user._id || user.id;
		const currentUserEmail = currentUser?.email;
		const currentUserId = currentUser?._id;

		// Block if it's the current user's ID OR the current user's email (blocks ghosts)
		const isCurrentUser =
			userId === currentUserId || user.email === currentUserEmail;

		// Block if they are already in the selected participants list
		const isAlreadyAdded = participants.some(
			(p) => p.id === userId || p.email === user.email,
		);

		return !isCurrentUser && !isAlreadyAdded;
	});

	// Add a participant safely ensuring the object shape matches ExpenseForm
	const addParticipant = (user) => {
		const userId = user._id || user.id;

		// Check if already added
		if (participants.some((p) => p.id === userId)) {
			return;
		}

		// Add to list with normalized shape
		onParticipantsChange([
			...participants,
			{
				id: userId,
				name: user.name,
				email: user.email,
				imageUrl: user.imageUrl,
			},
		]);

		setOpen(false);
		setSearchQuery("");
	};

	// Remove a participant
	const removeParticipant = (userId) => {
		// Don't allow removing yourself
		if (userId === currentUser?._id) {
			return;
		}

		onParticipantsChange(participants.filter((p) => p.id !== userId));
	};

	return (
		<div className="space-y-3 w-full">
			<div className="flex flex-wrap items-center gap-2.5">
				{participants.map((participant) => {
					const isCurrentUser = participant.id === currentUser?._id;

					return (
						<div
							key={participant.id}
							className={cn(
								"flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border text-sm font-medium transition-all shadow-sm",
								isCurrentUser
									? "bg-primary/10 border-primary/20 text-primary dark:bg-primary/20"
									: "bg-background border-slate-200 dark:border-slate-800 dark:bg-slate-900/60 text-foreground",
							)}>
							<Avatar className="h-6 w-6 border border-background shadow-sm">
								<AvatarImage src={participant.imageUrl} />
								<AvatarFallback className="text-[10px] bg-muted">
									{participant.name?.charAt(0) || "?"}
								</AvatarFallback>
							</Avatar>

							<span>
								{isCurrentUser
									? "You"
									: participant.name || participant.email}
							</span>

							{!isCurrentUser && (
								<button
									type="button"
									onClick={() =>
										removeParticipant(participant.id)
									}
									className="ml-0.5 p-0.5 rounded-full text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-foreground transition-colors">
									<X className="h-3.5 w-3.5" />
								</button>
							)}
						</div>
					);
				})}

				{/* 1:1 limit means we only show the Add button if there's less than 2 people */}
				{participants.length < 2 && (
					<Popover open={open} onOpenChange={setOpen}>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className="h-10 rounded-full border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 dark:border-slate-700 dark:hover:border-primary/50 transition-colors gap-2 px-4 text-muted-foreground hover:text-primary"
								type="button">
								<UserPlus className="h-4 w-4" />
								Add person
							</Button>
						</PopoverTrigger>
						<PopoverContent
							className="p-0 w-[300px] border-slate-200 dark:border-slate-800 shadow-xl rounded-xl dark:bg-slate-900 overflow-hidden"
							align="start">
							<Command className="bg-transparent">
								<CommandInput
									placeholder="Search by name or email..."
									value={searchQuery}
									onValueChange={setSearchQuery}
									className="border-none focus:ring-0"
								/>
								<CommandList>
									<CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
										{searchQuery.length < 2 ? (
											"Type at least 2 characters to search"
										) : isLoading ? (
											<div className="flex flex-col items-center justify-center gap-2">
												<Loader2 className="h-4 w-4 animate-spin text-primary/60" />
												<span>Searching...</span>
											</div>
										) : (
											"No users found"
										)}
									</CommandEmpty>

									{availableUsers &&
										availableUsers.length > 0 && (
											<CommandGroup
												heading="Available Users"
												className="px-1.5 text-muted-foreground">
												{availableUsers.map((user) => (
													<CommandItem
														key={
															user._id || user.id
														}
														value={
															user.name +
															user.email
														}
														onSelect={() =>
															addParticipant(user)
														}
														className="cursor-pointer focus:bg-primary/5 dark:focus:bg-primary/10 focus:text-primary transition-colors py-2.5 my-0.5 rounded-lg">
														<div className="flex items-center gap-3 w-full">
															<Avatar className="h-7 w-7 border shadow-sm">
																<AvatarImage
																	src={
																		user.imageUrl
																	}
																/>
																<AvatarFallback className="text-[10px]">
																	{user.name?.charAt(
																		0,
																	) || "?"}
																</AvatarFallback>
															</Avatar>
															<div className="flex flex-col flex-1 min-w-0">
																<span className="text-sm font-medium truncate text-foreground/90">
																	{user.name}
																</span>
																<span className="text-xs text-muted-foreground truncate">
																	{user.email}
																</span>
															</div>
														</div>
													</CommandItem>
												))}
											</CommandGroup>
										)}
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>
				)}
			</div>
		</div>
	);
}
