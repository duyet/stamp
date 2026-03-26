import type { Stamp } from "@/db/schema";

interface StampCardProps {
	stamp: Stamp;
	onClick?: () => void;
}

export function StampCard({ stamp, onClick }: StampCardProps) {
	const content = (
		<>
			<div className="stamp-border group-hover:scale-105 transition-transform duration-200">
				<div className="relative aspect-square">
					<img
						src={stamp.imageUrl}
						alt={stamp.prompt}
						loading="lazy"
						width={300}
						height={300}
						className="object-cover w-full h-full absolute inset-0"
					/>
				</div>
			</div>
			<div className="p-3">
				<p className="text-sm text-gray-700 truncate">
					{stamp.description || stamp.prompt}
				</p>
				<div className="mt-2 flex items-center justify-between">
					<span className="text-xs text-gray-500 capitalize">
						{stamp.style}
					</span>
					<a
						href={stamp.imageUrl}
						download={`stamp-${stamp.id}.png`}
						onClick={(e) => e.stopPropagation()}
						className="text-xs text-gray-500 hover:text-gray-800 transition"
					>
						Download
					</a>
				</div>
			</div>
		</>
	);

	if (onClick) {
		return (
			<button
				type="button"
				className="group relative text-left cursor-pointer rounded-xl overflow-hidden transition w-full"
				onClick={onClick}
			>
				{content}
			</button>
		);
	}

	return (
		<div className="group relative rounded-xl overflow-hidden transition">
			{content}
		</div>
	);
}
