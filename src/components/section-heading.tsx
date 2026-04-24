interface SectionHeadingProps {
	eyebrow: string;
	title: string;
	description?: string;
	className?: string;
}

export function SectionHeading({
	eyebrow,
	title,
	description,
	className = "",
}: SectionHeadingProps) {
	return (
		<div className={className}>
			<p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
				{eyebrow}
			</p>
			<h2 className="mt-2 font-stamp text-[1.9rem] leading-tight text-stone-950 sm:text-[2.2rem]">
				{title}
			</h2>
			{description ? (
				<p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
					{description}
				</p>
			) : null}
		</div>
	);
}
