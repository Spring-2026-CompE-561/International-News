"use client";
import { ModeToggle } from "@/components/mode-toggle";
import UserButton from "@/components/UserButton";
import Logo, { LogoMobile } from "@/components/Logo";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, UserRoundPlus } from "lucide-react";
import { NavBookmarkIcon } from "@/components/NavBookmarkIcon";
import { NavClock } from "@/components/NavClock";
import { isLoggedIn } from "@/lib/auth";

export function Navbar() {
	const [loggedIn, setLoggedIn] = useState(false);

	useEffect(() => {
		setLoggedIn(isLoggedIn());
		const handler = () => setLoggedIn(isLoggedIn());
		window.addEventListener("auth-changed", handler);
		return () => window.removeEventListener("auth-changed", handler);
	}, []);

	return (
		<>
			<DesktopNavbar loggedIn={loggedIn} />
			<MobileNavbar />
		</>
	);
}

function MobileNavbar() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="sticky top-0 z-50 block border-separate bg-gradient-to-b from-[#0e1f33] to-[#122947] dark:to-[#183153] md:hidden">
			<nav className="container flex items-center justify-between px-8">
				<Sheet open={isOpen} onOpenChange={setIsOpen}>
					<SheetTrigger asChild>
						<Button variant="ghost" size="icon" className="text-white/70 hover:text-horizon hover:bg-horizon/20">
							<Menu />
						</Button>
					</SheetTrigger>
					<SheetContent className="w-100 sm:w-135" side={"left"}>
						<Logo />
					</SheetContent>
				</Sheet>
				<div className="flex h-20 min-h-15 items-center gap-x-4">
					<LogoMobile />
				</div>
				<div className="flex items-center gap-2">
					<NavBookmarkIcon />
					<ModeToggle />
					<UserButton />
				</div>
			</nav>
		</div>
	);
}

function DesktopNavbar({ loggedIn }: { loggedIn: boolean }) {
	return (
		<div className="sticky top-0 z-50 hidden border-b border-white/10 bg-gradient-to-b from-[#0e1f33] to-[#122947] dark:to-[#183153] md:block transition-colors">
			<nav className="max-w-7xl mx-auto relative flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
				<div className="flex items-center gap-4">
					<LogoMobile />
					<NavClock />
				</div>
				<Link href="/" className="absolute left-1/2 -translate-x-1/2">
					<h1 className="text-3xl font-serif font-bold text-white whitespace-nowrap hover:text-horizon transition-colors">
						On The Horizon
					</h1>
				</Link>
				<div className="flex items-center gap-3">
					{!loggedIn && (
						<Link
							href="/signup"
							aria-label="Sign up"
							className="group inline-flex items-center h-8 px-2 rounded-lg text-sm font-medium text-white/70 hover:bg-horizon/20 hover:text-horizon transition-colors overflow-hidden"
						>
							<UserRoundPlus className="size-4 shrink-0" />
							<span className="max-w-0 overflow-hidden whitespace-nowrap pl-0 opacity-0 group-hover:max-w-[55px] group-hover:pl-1.5 group-hover:opacity-100 transition-all duration-200">
								Sign Up
							</span>
						</Link>
					)}
					<NavBookmarkIcon />
					<ModeToggle />
					<UserButton />
				</div>
			</nav>
		</div>
	);
}
