import { useEffect, useState } from "react";

const FAVORITES_KEY = "stamp-favorites";

export function useFavorites() {
	const [favorites, setFavorites] = useState<Set<string>>(new Set());
	const [isInitialized, setIsInitialized] = useState(false);

	// Load favorites from localStorage on mount
	useEffect(() => {
		try {
			const stored = localStorage.getItem(FAVORITES_KEY);
			if (stored) {
				const parsed = JSON.parse(stored) as string[];
				setFavorites(new Set(parsed));
			}
		} catch {
			// Ignore localStorage errors (e.g., in private browsing)
		} finally {
			setIsInitialized(true);
		}
	}, []);

	// Save favorites to localStorage whenever they change
	useEffect(() => {
		if (isInitialized) {
			try {
				localStorage.setItem(
					FAVORITES_KEY,
					JSON.stringify(Array.from(favorites)),
				);
			} catch {
				// Ignore localStorage errors
			}
		}
	}, [favorites, isInitialized]);

	const toggleFavorite = (stampId: string) => {
		setFavorites((prev) => {
			const next = new Set(prev);
			if (next.has(stampId)) {
				next.delete(stampId);
			} else {
				next.add(stampId);
			}
			return next;
		});
	};

	const isFavorite = (stampId: string) => favorites.has(stampId);

	return {
		favorites,
		isFavorite,
		toggleFavorite,
		isInitialized,
	};
}
