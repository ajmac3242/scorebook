import { useState, useCallback, useEffect } from "react";

/**
 * useLineup hook for managing on-court player selections and substitutions.
 *
 * WHY: Lineup management is a critical live-game behavior. This hook consolidates
 * the logic for tracking who is on court, preparing substitutions (drafting),
 * and validating the 5-player rule.
 */
export const useLineup = (onCourtIds: Set<string>) => {
  const [draftOnCourtIds, setDraftOnCourtIds] = useState<Set<string>>(
    new Set(onCourtIds),
  );
  const [selectedSwapId, setSelectedSwapId] = useState<string | null>(null);
  const [isSubDialogOpen, setIsSubDialogOpen] = useState(false);
  const [subOutPlayerId, setSubOutPlayerId] = useState<string | null>(null);

  // Keep draft in sync with real-time on-court state when dialog is closed
  useEffect(() => {
    if (!isSubDialogOpen) {
      setDraftOnCourtIds(new Set(onCourtIds));
    }
  }, [onCourtIds, isSubDialogOpen]);

  // When dialog opens, prepare the draft state
  useEffect(() => {
    if (isSubDialogOpen) {
      setDraftOnCourtIds(new Set(onCourtIds));
      setSelectedSwapId(subOutPlayerId);
    }
    // Only re-initialize when the dialog opens or the target player to sub out changes.
    // We explicitly exclude onCourtIds to prevent background updates from wiping out active edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubDialogOpen, subOutPlayerId]);

  /**
   * handleSwapClick logic for substitution UI.
   * If an on-court player is selected followed by a bench player (or vice versa), they are swapped.
   */
  const handleSwapClick = useCallback(
    (id: string) => {
      if (!selectedSwapId || selectedSwapId === id) {
        setSelectedSwapId(selectedSwapId === id ? null : id);
        return;
      }

      const isAOnCourt =
        draftOnCourtIds.has(selectedSwapId) ||
        selectedSwapId.startsWith("EMPTY");
      const isBOnCourt = draftOnCourtIds.has(id) || id.startsWith("EMPTY");

      // If both selected are on court or both are on bench, just update selection
      if (isAOnCourt === isBOnCourt) {
        setSelectedSwapId(id);
        return;
      }

      setDraftOnCourtIds((prev) => {
        const next = new Set(prev);
        const [onCourt, bench] = isAOnCourt
          ? [selectedSwapId, id]
          : [id, selectedSwapId];

        if (!onCourt.startsWith("EMPTY")) next.delete(onCourt);
        if (!bench.startsWith("EMPTY")) next.add(bench);

        return next;
      });
      setSelectedSwapId(null);
    },
    [selectedSwapId, draftOnCourtIds],
  );

  const isLineupIllegal = onCourtIds.size !== 5;
  const isDraftIllegal = draftOnCourtIds.size !== 5;

  return {
    draftOnCourtIds,
    setDraftOnCourtIds,
    selectedSwapId,
    setSelectedSwapId,
    handleSwapClick,
    isSubDialogOpen,
    setIsSubDialogOpen,
    subOutPlayerId,
    setSubOutPlayerId,
    isLineupIllegal,
    isDraftIllegal,
  };
};
