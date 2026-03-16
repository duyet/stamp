"use client";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html lang="en">
			<body
				style={{
					fontFamily: "system-ui, sans-serif",
					background: "#fff",
					color: "#0a0a0a",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					minHeight: "100vh",
					margin: 0,
				}}
			>
				<div style={{ textAlign: "center", padding: "2rem" }}>
					<h2 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
						Something went wrong
					</h2>
					<p
						style={{
							color: "#737373",
							fontSize: "0.875rem",
							marginBottom: "1.5rem",
						}}
					>
						{error.message || "An unexpected error occurred."}
					</p>
					<button
						type="button"
						onClick={reset}
						style={{
							padding: "0.5rem 1.25rem",
							background: "#0a0a0a",
							color: "#fff",
							border: "none",
							borderRadius: "0.5rem",
							cursor: "pointer",
							fontSize: "0.875rem",
						}}
					>
						Try again
					</button>
				</div>
			</body>
		</html>
	);
}
