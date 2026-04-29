import { useAuth } from "@clerk/tanstack-react-start";
import { useEffect, useState } from "react";
import { CREDITS_CHANGED_EVENT } from "@/lib/credit-events";

interface CreditInfo {
	dailyRemaining: number;
	purchasedCredits: number;
	totalRemaining: number;
}

function isCreditInfo(value: unknown): value is CreditInfo {
	if (!value || typeof value !== "object") return false;
	const credits = value as Record<string, unknown>;
	return (
		typeof credits.dailyRemaining === "number" &&
		typeof credits.purchasedCredits === "number" &&
		typeof credits.totalRemaining === "number"
	);
}

export function CreditBalance() {
	const { isSignedIn } = useAuth();
	const [credits, setCredits] = useState<CreditInfo | null>(null);
	const [error, setError] = useState(false);

	useEffect(() => {
		if (isSignedIn !== true) {
			setCredits(null);
			setError(false);
			return;
		}

		const controller = new AbortController();

		async function loadCredits() {
			try {
				const response = await fetch("/api/credits", {
					cache: "no-store",
					signal: controller.signal,
				});
				if (!response.ok) {
					throw new Error("Failed to load credits");
				}
				const data: unknown = await response.json();
				if (!isCreditInfo(data)) {
					throw new Error("Invalid credit response");
				}
				setCredits(data);
				setError(false);
			} catch (err) {
				if (err instanceof DOMException && err.name === "AbortError") return;
				setError(true);
			}
		}

		loadCredits();
		window.addEventListener(CREDITS_CHANGED_EVENT, loadCredits);

		return () => {
			controller.abort();
			window.removeEventListener(CREDITS_CHANGED_EVENT, loadCredits);
		};
	}, [isSignedIn]);

	if (isSignedIn !== true || error) return null;

	return (
		<div
			aria-live="polite"
			className="inline-flex min-h-9 max-w-[8.5rem] items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2.5 text-xs font-medium text-stone-700 shadow-[0_10px_24px_-20px_rgba(41,37,36,0.7)] sm:max-w-none sm:px-3"
			title={
				credits
					? `${credits.dailyRemaining} daily credits and ${credits.purchasedCredits} purchased credits left`
					: "Loading credits"
			}
		>
			<span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
			{credits ? (
				<>
					<span>{credits.totalRemaining.toLocaleString()}</span>
					<span className="text-stone-500 sm:hidden">cr</span>
					<span className="hidden text-stone-500 sm:inline">credits</span>
				</>
			) : (
				<>
					<span className="sr-only">Loading credit balance</span>
					<span className="h-3 w-12 animate-pulse rounded-full bg-stone-200" />
				</>
			)}
		</div>
	);
}
