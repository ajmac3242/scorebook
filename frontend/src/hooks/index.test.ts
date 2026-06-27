import { describe, it, expect } from "vitest";
import * as hooks from "./index";

describe("hooks index", () => {
  it("exports all expected hooks", () => {
    expect(hooks.useGames).toBeDefined();
    expect(hooks.usePlayers).toBeDefined();
    expect(hooks.useTeams).toBeDefined();
    expect(hooks.useLineup).toBeDefined();
    expect(hooks.useSync).toBeDefined();
    expect(hooks.useGameClock).toBeDefined();
    expect(hooks.useStatWriter).toBeDefined();
    expect(hooks.useGameAggregator).toBeDefined();
    expect(hooks.useVoiceRecognition).toBeDefined();
    expect(hooks.usePageSnackbar).toBeDefined();
    expect(hooks.useRosterAggregates).toBeDefined();
  });
});
