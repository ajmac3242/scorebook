import dayjs from "dayjs";

/**
 * Formats a stored time string for display in the user's locale.
 * Current storage is plain HH:mm strings; those are displayed as local wall time in h:mm A.
 * Future-safe: if an ISO/UTC datetime string is provided, it will still format correctly.
 */
export const formatDisplayTime = (value?: string | null): string => {
  if (!value) return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    return dayjs(`2000-01-01T${trimmed}`).format("h:mm A");
  }

  const parsed = dayjs(trimmed);
  return parsed.isValid() ? parsed.format("h:mm A") : trimmed;
};
