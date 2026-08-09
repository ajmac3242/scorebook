import {
  renderWithProviders as render,
  screen,
  assertAccessible,
} from "../../test-utils";
import { describe, it, expect } from "vitest";
import { OpponentBonusChip } from "./OpponentBonusChip";
import { SPECIAL_PLAYER_IDS } from "../../constants/stats";

describe("OpponentBonusChip", () => {
  it("renders null when selectedPlayerId is not an opponent", () => {
    const { container } = render(
      <OpponentBonusChip
        selectedPlayerId="player-1"
        oppFouls={5}
        periodType="QUARTERS"
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders null when selectedPlayerId is opponent but fouls are below threshold", () => {
    const { container } = render(
      <OpponentBonusChip
        selectedPlayerId={SPECIAL_PLAYER_IDS.OPPONENT}
        oppFouls={2}
        periodType="QUARTERS"
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders NEXT: BONUS when fouls is foulsRequired - 1 in QUARTERS", () => {
    render(
      <OpponentBonusChip
        selectedPlayerId={SPECIAL_PLAYER_IDS.OPPONENT}
        oppFouls={4}
        periodType="QUARTERS"
      />,
    );
    expect(screen.getByText("NEXT: BONUS")).toBeInTheDocument();
  });

  it("renders NEXT: BONUS when fouls is foulsRequired - 1 in HALVES", () => {
    render(
      <OpponentBonusChip
        selectedPlayerId={SPECIAL_PLAYER_IDS.OPPONENT}
        oppFouls={6}
        periodType="HALVES"
      />,
    );
    expect(screen.getByText("NEXT: BONUS")).toBeInTheDocument();
  });

  it("renders IN BONUS when fouls is >= foulsRequired in QUARTERS", () => {
    render(
      <OpponentBonusChip
        selectedPlayerId={SPECIAL_PLAYER_IDS.OPPONENT}
        oppFouls={5}
        periodType="QUARTERS"
      />,
    );
    expect(screen.getByText("IN BONUS")).toBeInTheDocument();
  });

  it("renders IN BONUS when fouls is >= foulsRequired in HALVES", () => {
    render(
      <OpponentBonusChip
        selectedPlayerId={SPECIAL_PLAYER_IDS.OPPONENT}
        oppFouls={7}
        periodType="HALVES"
      />,
    );
    expect(screen.getByText("IN BONUS")).toBeInTheDocument();
  });

  it("supports opponent prefixed player IDs", () => {
    render(
      <OpponentBonusChip
        selectedPlayerId={`${SPECIAL_PLAYER_IDS.OPPONENT}:jersey-12`}
        oppFouls={5}
        periodType="QUARTERS"
      />,
    );
    expect(screen.getByText("IN BONUS")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <OpponentBonusChip
        selectedPlayerId={SPECIAL_PLAYER_IDS.OPPONENT}
        oppFouls={5}
        periodType="QUARTERS"
      />,
    );
    await assertAccessible(container);
  });
});
