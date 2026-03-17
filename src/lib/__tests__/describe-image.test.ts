import { describe, expect, it, vi } from "vitest";
import { describeImage, VISION_PROMPT } from "../describe-image";

function createMockAi(
	llamaResponse: { response?: string } | Error,
	llavaResponse: { description?: string } | Error,
) {
	return {
		run: vi.fn().mockImplementation((model: string) => {
			if (model.includes("llama-3.2")) {
				if (llamaResponse instanceof Error) {
					return Promise.reject(llamaResponse);
				}
				return Promise.resolve(llamaResponse);
			}
			if (model.includes("llava")) {
				if (llavaResponse instanceof Error) {
					return Promise.reject(llavaResponse);
				}
				return Promise.resolve(llavaResponse);
			}
			return Promise.reject(new Error(`Unknown model: ${model}`));
		}),
	} as unknown as Ai;
}

const testImage = new Uint8Array([1, 2, 3, 4]);

describe("describeImage", () => {
	it("returns description from primary Llama Vision model", async () => {
		const mockAi = createMockAi(
			{ response: "A golden retriever on a beach" },
			{ description: "should not be used" },
		);

		const result = await describeImage(mockAi, testImage, "image/jpeg");

		expect(result).toBe("A golden retriever on a beach");
		expect(mockAi.run).toHaveBeenCalledTimes(1);
		expect(mockAi.run).toHaveBeenCalledWith(
			"@cf/meta/llama-3.2-11b-vision-instruct",
			expect.objectContaining({
				messages: [{ role: "user", content: VISION_PROMPT }],
				image: [1, 2, 3, 4],
				max_tokens: 300,
				temperature: 0.3,
			}),
		);
	});

	it("falls back to LLaVA when Llama Vision throws", async () => {
		const mockAi = createMockAi(new Error("Llama unavailable"), {
			description: "A cat sitting on a fence",
		});

		const result = await describeImage(mockAi, testImage, "image/png");

		expect(result).toBe("A cat sitting on a fence");
		expect(mockAi.run).toHaveBeenCalledTimes(2);
	});

	it("falls back to LLaVA when Llama Vision returns empty response", async () => {
		const mockAi = createMockAi(
			{ response: "" },
			{ description: "A mountain landscape" },
		);

		const result = await describeImage(mockAi, testImage, "image/webp");

		expect(result).toBe("A mountain landscape");
		expect(mockAi.run).toHaveBeenCalledTimes(2);
	});

	it("falls back to LLaVA when Llama Vision returns undefined response", async () => {
		const mockAi = createMockAi(
			{ response: undefined },
			{ description: "A red flower" },
		);

		const result = await describeImage(mockAi, testImage, "image/jpeg");

		expect(result).toBe("A red flower");
	});

	it("throws when both models fail", async () => {
		const mockAi = createMockAi(
			new Error("Llama unavailable"),
			new Error("LLaVA unavailable"),
		);

		await expect(
			describeImage(mockAi, testImage, "image/jpeg"),
		).rejects.toThrow("Could not analyze image");
	});

	it("throws when both models return empty", async () => {
		const mockAi = createMockAi({ response: "" }, { description: "" });

		await expect(
			describeImage(mockAi, testImage, "image/jpeg"),
		).rejects.toThrow("Could not analyze image");
	});

	it("calls LLaVA with correct params", async () => {
		const mockAi = createMockAi(new Error("Llama unavailable"), {
			description: "A sunset",
		});

		await describeImage(mockAi, testImage, "image/jpeg");

		expect(mockAi.run).toHaveBeenCalledWith(
			"@cf/llava-hf/llava-1.5-7b-hf",
			expect.objectContaining({
				image: [1, 2, 3, 4],
				prompt: VISION_PROMPT,
				max_tokens: 300,
			}),
		);
	});

	it("converts imageData to number array", async () => {
		const mockAi = createMockAi(
			{ response: "description" },
			{ description: "unused" },
		);

		await describeImage(mockAi, new Uint8Array([10, 20, 30]), "image/png");

		const call = vi.mocked(mockAi.run).mock.calls[0];
		expect(call[1]).toHaveProperty("image", [10, 20, 30]);
	});
});
