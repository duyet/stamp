"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "./icons";

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	const [isAnimating, setIsAnimating] = useState(false);

	// Prevent hydration mismatch
	useEffect(() => {
		setMounted(true);
	}, []);

	const handleThemeChange = () => {
		setIsAnimating(true);
		setTheme(theme === "dark" ? "light" : "dark");
		// Reset animation after it completes
		setTimeout(() => setIsAnimating(false), 400);
	};

	if (!mounted) {
		return (
			<button
				type="button"
				className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-all duration-300 hover:scale-110"
				aria-label="Toggle theme"
			>
				<span className="w-5 h-5 block" />
			</button>
		);
	}

	const isDark = theme === "dark";

	return (
		<button
			type="button"
			onClick={handleThemeChange}
			className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-all duration-300 hover:scale-110 active:scale-95 relative overflow-hidden"
			aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
		>
			<div
				className={`transition-all duration-300 ${isAnimating ? "theme-icon-animate" : ""}`}
			>
				{isDark ? (
					<Sun className="w-5 h-5 text-stone-600 dark:text-stone-400" />
				) : (
					<Moon className="w-5 h-5 text-stone-600 dark:text-stone-400" />
				)}
			</div>
		</button>
	);
}
