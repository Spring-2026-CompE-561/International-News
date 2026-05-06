"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ModeToggle() {
	const { setTheme } = useTheme();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="group w-auto px-2 text-white/70 hover:text-white hover:bg-horizon/20 cursor-pointer"
				>
					<span className="relative size-[1.1rem] shrink-0">
						<Sun className="absolute inset-0 size-full rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
						<Moon className="absolute inset-0 size-full rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
					</span>
					<span className="max-w-0 overflow-hidden whitespace-nowrap pl-0 opacity-0 text-sm font-medium group-hover:max-w-[50px] group-hover:pl-1.5 group-hover:opacity-100 transition-all duration-200">
						Theme
					</span>
					<span className="sr-only">Toggle theme</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={() => setTheme("light")}>
					Light
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("dark")}>
					Dark
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("system")}>
					System
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
