"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

const groupSchema = z.object({
	name: z.string().min(1, "Group name is required"),
	description: z.string().optional(),
});

export function CreateGroupModal({ isOpen, onClose, onSuccess }) {
	const [selectedMembers, setSelectedMembers] = useState([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [commandOpen, setCommandOpen] = useState(false);

	const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);
	const createGroup = useConvexMutation(api.contacts.createGroup);
	const { data: searchResults, isLoading: isSearching } = useConvexQuery(
		api.users.searchUsers,
		{ query: searchQuery },
	);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		reset,
	} = useForm({
		resolver: zodResolver(groupSchema),
		defaultValues: {
			name: "",
			description: "",
		},
	});

	const addMember = (user) => {
		if (!selectedMembers.some((m) => m.id === user.id)) {
			setSelectedMembers([...selectedMembers, user]);
		}
		setCommandOpen(false);
	};

	const removeMember = (userId) => {
		setSelectedMembers(selectedMembers.filter((m) => m.id !== userId));
	};

	const onSubmit = async (data) => {
		try {
			const memberIds = selectedMembers.map((member) => member.id);

			const groupId = await createGroup.mutate({
				name: data.name,
				description: data.description,
				members: memberIds,
			});

			toast.success("Group created successfully!");
			reset();
			setSelectedMembers([]);
			onClose();

			if (onSuccess) {
				onSuccess(groupId);
			}
		} catch (error) {
			toast.error("Failed to create group: " + error.message);
		}
	};

	const handleClose = () => {
		reset();
		setSelectedMembers([]);
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			{/* Added dark mode background and border styling to match parent page */}
			<DialogContent className="sm:max-w-md dark:bg-slate-900 dark:border-slate-800">
				<DialogHeader>
					<DialogTitle className="text-xl font-bold tracking-tight">
						Create New Group
					</DialogTitle>
				</DialogHeader>

				<form
					onSubmit={handleSubmit(onSubmit)}
					className="space-y-5 mt-2">
					<div className="space-y-2">
						<Label htmlFor="name" className="text-foreground/90">
							Group Name
						</Label>
						<Input
							id="name"
							placeholder="Enter group name"
							className="transition-all focus-visible:ring-primary/50 dark:bg-slate-950/50"
							{...register("name")}
						/>
						{errors.name && (
							<p className="text-sm text-destructive dark:text-red-400">
								{errors.name.message}
							</p>
						)}
					</div>

					<div className="space-y-2">
						<Label
							htmlFor="description"
							className="text-foreground/90">
							Description (Optional)
						</Label>
						<Textarea
							id="description"
							placeholder="Enter group description"
							className="resize-none transition-all focus-visible:ring-primary/50 dark:bg-slate-950/50"
							{...register("description")}
						/>
					</div>

					<div className="space-y-3">
						<Label className="text-foreground/90">Members</Label>
						<div className="flex flex-wrap gap-2 mb-2">
							{/* Current user */}
							{currentUser && (
								<Badge
									variant="secondary"
									className="px-3 py-1.5 shadow-sm dark:bg-slate-800">
									<Avatar className="h-5 w-5 mr-2 border border-background/20">
										<AvatarImage
											src={currentUser.imageUrl}
										/>
										<AvatarFallback>
											{currentUser.name?.charAt(0) || "?"}
										</AvatarFallback>
									</Avatar>
									<span className="font-medium">
										{currentUser.name} (You)
									</span>
								</Badge>
							)}

							{/* Selected members with Pop-in Animation */}
							{selectedMembers.map((member) => (
								<Badge
									key={member.id}
									variant="secondary"
									className="px-3 py-1.5 shadow-sm animate-in zoom-in-95 fade-in duration-200 dark:bg-slate-800">
									<Avatar className="h-5 w-5 mr-2 border border-background/20">
										<AvatarImage src={member.imageUrl} />
										<AvatarFallback>
											{member.name?.charAt(0) || "?"}
										</AvatarFallback>
									</Avatar>
									<span className="font-medium">
										{member.name}
									</span>
									<button
										type="button"
										onClick={() => removeMember(member.id)}
										className="ml-2 text-muted-foreground hover:text-destructive hover:scale-110 transition-all rounded-full p-0.5">
										<X className="h-3 w-3" />
									</button>
								</Badge>
							))}

							<Popover
								open={commandOpen}
								onOpenChange={setCommandOpen}>
								<PopoverTrigger asChild>
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="h-8 gap-1 text-xs border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 active:scale-95 transition-all">
										<UserPlus className="h-3.5 w-3.5" />
										Add member
									</Button>
								</PopoverTrigger>
								<PopoverContent
									className="p-0 border shadow-lg dark:border-slate-800 dark:bg-slate-900"
									align="start"
									side="bottom">
									<Command className="dark:bg-transparent">
										<CommandInput
											placeholder="Search by name or email..."
											value={searchQuery}
											onValueChange={setSearchQuery}
											className="dark:border-slate-800"
										/>
										<CommandList>
											<CommandEmpty>
												{searchQuery.length < 2 ? (
													<p className="py-4 px-4 text-sm text-center text-muted-foreground">
														Type at least 2
														characters to search
													</p>
												) : isSearching ? (
													<p className="py-4 px-4 text-sm text-center text-muted-foreground animate-pulse">
														Searching...
													</p>
												) : (
													<p className="py-4 px-4 text-sm text-center text-muted-foreground">
														No users found
													</p>
												)}
											</CommandEmpty>
											<CommandGroup heading="Users">
												{searchResults?.map((user) => (
													<CommandItem
														key={user.id}
														value={
															user.name +
															user.email
														}
														onSelect={() =>
															addMember(user)
														}
														className="cursor-pointer aria-selected:bg-primary/10 transition-colors">
														<div className="flex items-center gap-3 w-full py-1">
															<Avatar className="h-7 w-7">
																<AvatarImage
																	src={
																		user.imageUrl
																	}
																/>
																<AvatarFallback className="bg-primary/10 text-primary">
																	{user.name?.charAt(
																		0,
																	) || "?"}
																</AvatarFallback>
															</Avatar>
															<div className="flex flex-col">
																<span className="text-sm font-medium">
																	{user.name}
																</span>
																<span className="text-xs text-muted-foreground">
																	{user.email}
																</span>
															</div>
														</div>
													</CommandItem>
												))}
											</CommandGroup>
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>
						</div>
						{selectedMembers.length === 0 && (
							<p className="text-sm text-amber-600 dark:text-amber-500 animate-in fade-in">
								Add at least one other person to the group
							</p>
						)}
					</div>

					<DialogFooter className="pt-4 border-t dark:border-slate-800">
						<Button
							type="button"
							variant="outline"
							onClick={handleClose}
							className="active:scale-95 transition-transform">
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={
								isSubmitting || selectedMembers.length === 0
							}
							className="active:scale-95 transition-transform shadow-sm">
							{isSubmitting ? "Creating..." : "Create Group"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
