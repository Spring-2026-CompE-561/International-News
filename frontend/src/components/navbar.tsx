"use client";
import { ModeToggle } from "@/components/mode-toggle";
import UserButton from "@/components/UserButton";
import Logo, { LogoMobile } from "@/components/Logo";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LogIn, Menu, UserRoundPlus } from "lucide-react";

export function Navbar() {
	return (
		<>
			<DesktopNavbar />
			<MobileNavbar />
		</>
	);
}

function MobileNavbar() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="block border-separate bg-background md:hidden">
			<nav className="container flex items-center justify-between px-8">
				<Sheet open={isOpen} onOpenChange={setIsOpen}>
					<SheetTrigger asChild>
						<Button variant="ghost" size="icon">
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
					<ModeToggle />
					<UserButton />
				</div>
			</nav>
		</div>
	);
}

function DesktopNavbar() {
	return (
		<div className="hidden border-separate border-b bg-background md:block">
			<nav className="container relative flex h-20 min-h-15 items-center px-8">
				<LogoMobile />
				<Link href="/" className="absolute left-1/2 -translate-x-1/2">
					<h1 className="text-3xl font-serif font-bold text-black dark:text-white whitespace-nowrap hover:text-[#F59E0B] transition-colors">
						Horizon News
					</h1>
				</Link>
				<div className="ml-auto flex items-center gap-2">
					<Link
						href="/signin"
						aria-label="Sign in"
						className={buttonVariants({ variant: "ghost", size: "icon" })}
					>
						<LogIn />
					</Link>
					<Link
						href="/signup"
						aria-label="Sign up"
						className={buttonVariants({ variant: "ghost", size: "icon" })}
					>
						<UserRoundPlus />
					</Link>
					<ModeToggle />
					<UserButton />
				</div>
			</nav>
		</div>
	);
}
