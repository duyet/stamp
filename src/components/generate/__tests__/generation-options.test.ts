import { describe, expect, it } from "vitest";
import { getGenerationOptionsState } from "../generation-options";

describe("getGenerationOptionsState", () => {
	it("locks anonymous users to public non-HD mode", () => {
		const state = getGenerationOptionsState(false, false, true);

		expect(state.effectiveIsPublic).toBe(true);
		expect(state.effectiveHd).toBe(false);
		expect(state.publicDisabled).toBe(true);
		expect(state.hdDisabled).toBe(true);
		expect(state.description).toContain("Anonymous mode");
	});

	it("keeps signed-in user selection unchanged", () => {
		const state = getGenerationOptionsState(true, false, true);

		expect(state.effectiveIsPublic).toBe(false);
		expect(state.effectiveHd).toBe(true);
		expect(state.publicDisabled).toBe(false);
		expect(state.hdDisabled).toBe(false);
		expect(state.description).toContain("Public editions can appear");
	});
});
