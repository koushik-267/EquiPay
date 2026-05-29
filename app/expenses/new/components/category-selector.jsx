"use client";

import { useState, useEffect } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { getCategoryIcon } from "@/lib/expense-categories";
import { Tag } from "lucide-react"; // Fallback icon

export function CategorySelector({ categories, value, onChange }) {
	// Support both controlled (value passed from parent) and uncontrolled states
	const [internalValue, setInternalValue] = useState("");
	const selectedCategory = value !== undefined ? value : internalValue;

	// Safely handle default selection without causing render loops
	useEffect(() => {
		if (categories?.length > 0 && !selectedCategory) {
			const defaultCategory =
				categories.find((cat) => cat.isDefault) || categories[0];
			setInternalValue(defaultCategory.id);

			if (onChange) {
				onChange(defaultCategory.id);
			}
		}
	}, [categories, selectedCategory, onChange]);

	const handleCategoryChange = (categoryId) => {
		setInternalValue(categoryId);

		if (onChange && categoryId !== selectedCategory) {
			onChange(categoryId);
		}
	};

	if (!categories || categories.length === 0) {
		return (
			<div className="flex items-center justify-center h-12 w-full text-sm text-muted-foreground bg-muted/30 dark:bg-slate-800/20 rounded-md border border-dashed dark:border-slate-800">
				No categories available
			</div>
		);
	}

	return (
		<Select value={selectedCategory} onValueChange={handleCategoryChange}>
			<SelectTrigger className="w-full h-12 bg-background hover:bg-muted/30 dark:bg-slate-900/40 dark:border-slate-800 transition-colors focus:ring-primary/30">
				<SelectValue placeholder="Select a category" />
			</SelectTrigger>
			<SelectContent className="dark:bg-slate-900 dark:border-slate-800 shadow-xl rounded-xl">
				{categories.map((category) => {
					// Attempt to get the matching icon, use Tag as a fallback
					const Icon = getCategoryIcon
						? getCategoryIcon(category.id)
						: Tag;

					return (
						<SelectItem
							key={category.id}
							value={category.id}
							className="cursor-pointer focus:bg-primary/5 dark:focus:bg-primary/10 focus:text-primary transition-colors py-2.5 my-0.5 rounded-lg">
							<div className="flex items-center gap-3">
								<div className="bg-primary/10 dark:bg-primary/20 p-1.5 rounded-md text-primary shrink-0">
									<Icon className="h-4 w-4" />
								</div>
								<span className="font-medium text-foreground/90">
									{category.name}
								</span>
							</div>
						</SelectItem>
					);
				})}
			</SelectContent>
		</Select>
	);
}
