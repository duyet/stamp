import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "*.r2.cloudflarestorage.com",
			},
		],
	},
};

export default nextConfig;

// Enable Cloudflare bindings in local dev
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();
