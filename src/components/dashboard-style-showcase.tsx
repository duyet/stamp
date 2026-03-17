"use client";

import Image from "next/image";
import Link from "next/link";

interface StyleShowcaseProps {
	styles: Array<{
		style: string;
		count: number;
		featuredStamp?: {
			id: string;
			imageUrl: string;
			prompt: string;
			description: string | null;
		};
	}>;
}

function capitalize(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1);
}

export function StyleShowcase({ styles }: StyleShowcaseProps) {
	if (styles.length === 0) {
		return null;
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{styles.map(({ style, count, featuredStamp }) => (
				<div
					key={style}
					className="bg-white rounded-xl border border-stone-200 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
				>
					<div className="relative aspect-square bg-stone-100">
						{featuredStamp ? (
							<Image
								src={featuredStamp.imageUrl}
								alt={featuredStamp.description ?? featuredStamp.prompt}
								fill
								sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
								className="object-cover"
								unoptimized
							/>
						) : (
							<div className="absolute inset-0 flex items-center justify-center">
								<span className="text-stone-400 text-sm font-medium capitalize">
									{capitalize(style)}
								</span>
							</div>
						)}
					</div>

					<div className="p-4 flex items-center justify-between">
						<div className="min-w-0">
							<p className="font-medium text-stone-900 capitalize truncate">
								{capitalize(style)}
							</p>
							<p className="text-xs text-stone-500 mt-0.5">
								{count} {count === 1 ? "stamp" : "stamps"}
							</p>
						</div>
						<Link
							href={`/generate?style=${encodeURIComponent(style)}`}
							className="shrink-0 ml-3 text-sm text-stone-600 hover:text-stamp-navy transition-colors"
						>
							Create {capitalize(style)} &rarr;
						</Link>
					</div>
				</div>
			))}
		</div>
	);
}
