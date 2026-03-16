// biome-ignore lint/correctness/noNodejsModules: required for cloudflare dev
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		unoptimized: true,
	},
};

export default nextConfig;
