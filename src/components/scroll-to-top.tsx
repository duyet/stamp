"use client";

import { useEffect, useState } from "react";
import { ArrowUpIcon } from "./icons";

export function ScrollToTop() {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const toggleVisibility = () => {
			if (window.scrollY > 500) {
				setIsVisible(true);
			} else {
				setIsVisible(false);
			}
		};

		window.addEventListener("scroll", toggleVisibility);
		return () => window.removeEventListener("scroll", toggleVisibility);
	}, []);

	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	return (
		<>
			{isVisible && (
				<button
					type="button"
					onClick={scrollToTop}
					className="fixed bottom-6 right-6 z-40 p-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 hover:scale-105 active:scale-95 transition-all duration-300 group flex items-center justify-center"
					aria-label="Scroll to top"
				>
					<span className="group-hover:animate-bounce">
						<ArrowUpIcon />
					</span>
				</button>
			)}
		</>
	);
}
