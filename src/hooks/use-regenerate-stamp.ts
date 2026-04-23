import { useState } from "react";
import type { PublicStamp } from "@/db/schema";

interface RegenerateStampOptions {
	onSuccess?: (newStamp: PublicStamp) => void;
	onError?: (error: string) => void;
}

/**
 * Hook to regenerate a stamp with the same prompt and style.
 * Handles loading state, API call, and success/error callbacks.
 */
export function useRegenerateStamp() {
	const [regenerating, setRegenerating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function regenerate(
		stamp: PublicStamp,
		options: RegenerateStampOptions = {},
	) {
		setRegenerating(true);
		setError(null);

		try {
			const res = await fetch("/api/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt: stamp.prompt,
					style: stamp.style,
					isPublic: stamp.isPublic,
					timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
				}),
			});

			const data = (await res.json()) as {
				id?: string;
				imageUrl?: string;
				error?: string;
			};

			if (!res.ok) {
				throw new Error(data.error ?? "Regeneration failed");
			}

			if (!data.id || !data.imageUrl) {
				throw new Error("Invalid response from server");
			}

			const newStamp: PublicStamp = {
				...stamp,
				id: data.id,
				imageUrl: data.imageUrl,
				createdAt: new Date(),
			};

			options.onSuccess?.(newStamp);
			return newStamp;
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to regenerate stamp";
			setError(errorMessage);
			options.onError?.(errorMessage);
			throw err;
		} finally {
			setRegenerating(false);
		}
	}

	return { regenerate, regenerating, error };
}
