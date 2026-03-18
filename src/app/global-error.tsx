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
				<div
					style={{
						textAlign: "center",
						padding: "2rem",
						maxWidth: "28rem",
					}}
				>
					<div
						style={{
							width: "5rem",
							height: "5rem",
							margin: "0 auto 1.5rem",
							background: "#f5f5f4",
							borderRadius: "9999px",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth={1.5}
							style={{ width: "2.5rem", height: "2.5rem", color: "#a8a29e" }}
							aria-hidden="true"
						>
							<rect x="3" y="3" width="18" height="18" rx="2" />
							<circle cx="8" cy="8" r="1.5" />
							<circle cx="16" cy="8" r="1.5" />
							<circle cx="8" cy="16" r="1.5" />
							<circle cx="16" cy="16" r="1.5" />
							<circle cx="12" cy="8" r="1.5" />
							<circle cx="12" cy="16" r="1.5" />
							<circle cx="8" cy="12" r="1.5" />
							<circle cx="16" cy="12" r="1.5" />
						</svg>
					</div>
					<h2
						style={{
							fontSize: "1.5rem",
							fontWeight: "600",
							marginBottom: "0.75rem",
							color: "#0a0a0a",
						}}
					>
						Something went wrong
					</h2>
					<p
						style={{
							color: "#737373",
							fontSize: "1rem",
							marginBottom: "1.5rem",
							lineHeight: "1.5",
						}}
					>
						{error.message || "An unexpected error occurred."}
					</p>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "0.75rem",
							alignItems: "center",
						}}
					>
						<button
							type="button"
							onClick={reset}
							style={{
								padding: "0.625rem 1.25rem",
								background: "#0a0a0a",
								color: "#fff",
								border: "none",
								borderRadius: "0.5rem",
								cursor: "pointer",
								fontSize: "0.9375rem",
								fontWeight: "500",
								minWidth: "120px",
							}}
						>
							Try again
						</button>
						<a
							href="/"
							style={{
								color: "#57534e",
								textDecoration: "underline",
								fontSize: "0.9375rem",
							}}
						>
							Go home
						</a>
					</div>
					{error.digest && (
						<p
							style={{
								color: "#a3a3a3a",
								fontSize: "0.75rem",
								marginTop: "1rem",
							}}
						>
							Error code: {error.digest}
						</p>
					)}
				</div>
			</body>
		</html>
	);
}
