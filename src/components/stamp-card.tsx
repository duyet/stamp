import type { Stamp } from "@/db/schema";

interface StampCardProps {
	stamp: Stamp;
	onClick?: () => void;
}

export function StampCard({ stamp, onClick }: StampCardProps) {
	const content = (
		<>
			<div className="stamp-border transition-transform duration-300 group-hover:scale-105">
				<img
					src={stamp.imageUrl}
					alt={stamp.prompt}
					className="w-full aspect-square object-cover"
					loading="lazy"
				/>
			</div>
			<p className="mt-3 text-sm text-stone-600 text-center italic truncate">
				{stamp.prompt}
			</p>
		</>
	);

	if (onClick) {
		return (
			<button
				type="button"
				className="group relative text-left cursor-pointer"
				onClick={onClick}
			>
				{content}
			</button>
		);
	}

	return <div className="group relative">{content}</div>;
}
