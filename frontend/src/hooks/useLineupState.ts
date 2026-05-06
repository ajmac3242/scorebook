import { useState, useEffect } from "react";

export const useLineupState = (onCourtIds: Set<string>) => {
  const [isSubDialogOpen, setIsSubDialogOpen] = useState(false);
  const [subOutPlayerId, setSubOutPlayerId] = useState<string | null>(null);
  const [draftOnCourtIds, setDraftOnCourtIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedSwapId, setSelectedSwapId] = useState<string | null>(null);

  useEffect(() => {
    if (isSubDialogOpen) {
      setDraftOnCourtIds(new Set(onCourtIds));
      setSelectedSwapId(subOutPlayerId);
    }
  }, [isSubDialogOpen, onCourtIds, subOutPlayerId]);

  return {
    isSubDialogOpen,
    setIsSubDialogOpen,
    subOutPlayerId,
    setSubOutPlayerId,
    draftOnCourtIds,
    setDraftOnCourtIds,
    selectedSwapId,
    setSelectedSwapId,
  };
};
