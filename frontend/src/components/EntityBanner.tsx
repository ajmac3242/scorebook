import React from "react";
import {
  Box,
  Typography,
  Grid,
  Avatar,
  IconButton,
  Stack,
  Button,
  TextField,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  CheckCircle as CheckIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import KpiStat from "./data-display/KpiStat";
import { getInitials } from "../utils/stats";
import { Refresh as RefreshIcon } from "@mui/icons-material";
import { pulse } from "../styles/animations";

interface EntityBannerProps {
  title: string;
  subtitle?: string;
  avatarSrc?: string;
  avatarColor?: string;
  icon?: React.ReactNode;
  backTo?: string;
  /** Human-readable label for the back button tooltip, e.g. "Teams". Defaults to path segment. */
  backToLabel?: string;
  primaryColor?: string;
  stats?: Array<{ label: string; value: string | number }>;
  actions?: React.ReactNode;
  onSync?: () => void;
  isSyncing?: boolean;
  jerseyNumber?: string;
  searchTerm?: string;
  onSearchChange?: (_value: string) => void;
  extraActions?: React.ReactNode;
  /** Called when the user clicks the edit icon button in the banner action rail. */
  onEdit?: () => void;
  /** Tooltip / aria-label for the edit button. Defaults to "Edit". */
  editLabel?: string;
  /** Number of games played — used to show — for stats when 0. */
  gamesPlayed?: number;
  /** When true, removes the banner's own borderRadius (parent handles clipping). */
  square?: boolean;
}

/**
 * Standardized banner component for entities (Teams, Players).
 * Includes an avatar or icon, title, subtitle, stats summary, and action buttons.
 *
 * @param {EntityBannerProps} props - Component props.
 * @returns {React.ReactElement}
 */
const EntityBanner: React.FC<EntityBannerProps> = ({
  title,
  subtitle,
  avatarSrc,
  avatarColor,
  icon,
  backTo,
  backToLabel,
  primaryColor = "#154C56",
  stats = [],
  actions,
  onSync,
  isSyncing = false,
  jerseyNumber,
  searchTerm,
  onSearchChange,
  extraActions,
  onEdit,
  editLabel = "Edit",
  gamesPlayed,
  square = false,
}) => {
  const navigate = useNavigate();
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = React.useState(false);
  const searchButtonRef = React.useRef<HTMLButtonElement>(null);

  const showSearch = onSearchChange !== undefined;

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSearchExpanded) {
        setIsSearchExpanded(false);
        searchButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchExpanded]);

  const handleSyncClick = () => {
    if (onSync) {
      onSync();
      setShowSyncSuccess(true);
      setTimeout(() => setShowSyncSuccess(false), 3000);
    }
  };

  return (
    <Box
      sx={{
        p: {
          xs: "var(--cs-semantic-spacing-lg)",
          sm: "var(--cs-semantic-spacing-xl)",
        },
        pt: {
          xs: "var(--cs-semantic-spacing-lg)",
          sm: "var(--cs-semantic-spacing-xl)",
        },
        pb: {
          xs: "var(--cs-semantic-spacing-xl)",
          sm: "var(--cs-semantic-spacing-xl)",
        },
        mb: 0,
        borderRadius: square ? 0 : "var(--cs-semantic-shape-radius-md)",
        bgcolor: primaryColor,
        color: "var(--cs-semantic-color-text-inverse)",
        position: "relative",
        overflow: "hidden",
        transition: `background-color var(--cs-motion-duration-slow) var(--cs-motion-easing-productive)`,
      }}
    >
      {backTo ? (
        <Tooltip
          title={`Back to ${backToLabel || backTo.split("/").pop() || "Previous Page"}`}
        >
          <IconButton
            aria-label={`Back to ${backToLabel || backTo.split("/").pop() || "previous page"}`}
            onClick={() => navigate(backTo)}
            sx={{
              position: "absolute",
              top: "var(--cs-semantic-spacing-md)",
              left: "var(--cs-semantic-spacing-md)",
              color: "var(--cs-semantic-color-text-inverse)",
              bgcolor: "transparent",
              zIndex: 20,
              "&:hover": { bgcolor: "rgba(255,255,255,0.18)" },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
      ) : null}

      <Box
        sx={{
          position: "absolute",
          top: "var(--cs-semantic-spacing-md)",
          right: "var(--cs-semantic-spacing-md)",
          display: "flex",
          alignItems: "center",
          gap: "var(--cs-semantic-spacing-xs)",
          zIndex: 10,
        }}
      >
        {showSearch && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              transition: "all 0.3s ease",
              width: isSearchExpanded ? { xs: "160px", sm: "240px" } : "40px",
              overflow: "hidden",
              bgcolor: isSearchExpanded
                ? "rgba(255,255,255,0.15)"
                : "transparent",
              borderRadius: "20px",
              pr: isSearchExpanded ? 1 : 0,
            }}
          >
            <Tooltip title={isSearchExpanded ? "Close search" : "Search"}>
              <IconButton
                ref={searchButtonRef}
                aria-label={isSearchExpanded ? "close search" : "search"}
                aria-expanded={isSearchExpanded}
                aria-controls="entity-search-field"
                onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                sx={{
                  color: "var(--cs-semantic-color-text-inverse)",
                  flexShrink: 0,
                }}
              >
                {isSearchExpanded && !searchTerm ? (
                  <CloseIcon fontSize="small" />
                ) : (
                  <SearchIcon />
                )}
              </IconButton>
            </Tooltip>
            {isSearchExpanded && (
              <TextField
                id="entity-search-field"
                autoFocus
                variant="standard"
                placeholder="Search..."
                aria-label={`Search ${title}`}
                value={searchTerm || ""}
                onChange={(e) => onSearchChange(e.target.value)}
                slotProps={{
                  input: {
                    disableUnderline: true,
                    sx: {
                      color: "var(--cs-semantic-color-text-inverse)",
                      fontSize: "var(--cs-typography-fontSize-sm)",
                      width: "100%",
                    },
                    endAdornment: searchTerm ? (
                      <InputAdornment position="end">
                        <Tooltip title="Clear search">
                          <IconButton
                            aria-label="clear search"
                            size="small"
                            onClick={() => onSearchChange("")}
                            sx={{ color: "rgba(255,255,255,0.7)" }}
                          >
                            <CloseIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ) : null,
                  },
                }}
                sx={{ width: "100%" }}
              />
            )}
          </Box>
        )}
        {onEdit && !isSearchExpanded && (
          <Tooltip title={editLabel} placement="bottom">
            <IconButton
              size="small"
              aria-label={editLabel}
              onClick={onEdit}
              sx={{
                color: "var(--cs-semantic-color-text-inverse)",
                bgcolor: "rgba(255,255,255,0.12)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
                transition: "background 180ms ease",
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {extraActions && !isSearchExpanded && <Box>{extraActions}</Box>}
        {onSync && !isSearchExpanded && (
          <Tooltip
            title={
              isSyncing
                ? "Synchronizing data..."
                : showSyncSuccess
                  ? "Data Synced!"
                  : "Sync data"
            }
          >
            <span aria-live="polite">
              <Button
                variant="outlined"
                size="small"
                startIcon={
                  isSyncing ? (
                    <RefreshIcon className="spin" />
                  ) : showSyncSuccess ? (
                    <CheckIcon sx={{ color: "#4CAF50" }} />
                  ) : (
                    <RefreshIcon />
                  )
                }
                onClick={handleSyncClick}
                disabled={isSyncing}
                aria-busy={isSyncing}
                className="hover-grow"
                sx={{
                  color: showSyncSuccess
                    ? "var(--cs-semantic-color-feedback-success-main)"
                    : "var(--cs-semantic-color-text-inverse)",
                  borderColor: showSyncSuccess
                    ? "var(--cs-semantic-color-feedback-success-main)"
                    : "rgba(255,255,255,0.5)",
                  "&:hover": {
                    borderColor: showSyncSuccess
                      ? "var(--cs-semantic-color-feedback-success-main)"
                      : "var(--cs-semantic-color-text-inverse)",
                    bgcolor: "rgba(255,255,255,0.1)",
                  },
                  display: { xs: "none", sm: "flex" },
                  transition: "all 0.3s ease",
                  animation: isSyncing ? `${pulse} 2s infinite` : "none",
                }}
              >
                {isSyncing ? "Syncing..." : showSyncSuccess ? "Synced" : "Sync"}
              </Button>
            </span>
          </Tooltip>
        )}
        {!isSearchExpanded && actions}
      </Box>

      <Grid
        container
        spacing={{ xs: 2, sm: 4 }}
        sx={{
          mt: backTo ? { xs: 5, sm: 1 } : { xs: 0, sm: 1 },
          pl: backTo ? { xs: 0, sm: 6 } : 0,
          alignItems: "center",
        }}
      >
        <Grid
          size={{ xs: 12, sm: "auto" }}
          sx={{ textAlign: { xs: "center", sm: "left" } }}
        >
          <Box
            sx={{
              position: "relative",
              display: "inline-block",
            }}
          >
            {avatarSrc ? (
              <Box
                component="img"
                src={avatarSrc}
                sx={{
                  width: { xs: 80, md: 120 },
                  height: "auto",
                  filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
                }}
              />
            ) : icon ? (
              <Avatar
                sx={{
                  width: { xs: 80, md: 120 },
                  height: { xs: 80, md: 120 },
                  bgcolor: avatarColor || "rgba(255,255,255,0.2)",
                  border: "4px solid rgba(255,255,255,0.3)",
                  mx: "auto",
                  "& svg": {
                    fontSize: { xs: "2.5rem", md: "4rem" },
                  },
                }}
              >
                {icon}
              </Avatar>
            ) : (
              <Avatar
                sx={{
                  width: { xs: 80, md: 120 },
                  height: { xs: 80, md: 120 },
                  bgcolor: avatarColor || "rgba(255,255,255,0.2)",
                  fontSize: { xs: "2rem", md: "3rem" },
                  border: "4px solid rgba(255,255,255,0.3)",
                  mx: "auto",
                  fontWeight: "var(--cs-typography-fontWeight-bold)",
                }}
              >
                {getInitials(title)}
              </Avatar>
            )}
            {jerseyNumber && (
              <Box
                sx={{
                  position: "absolute",
                  bottom: -5,
                  right: -5,
                  bgcolor: "var(--cs-palette-warningScale-500)",
                  color: "var(--cs-semantic-color-brand-primary-dark)",
                  borderRadius: "var(--cs-semantic-shape-radius-full)",
                  width: { xs: 28, sm: 36 },
                  height: { xs: 28, sm: 36 },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: { xs: "0.75rem", sm: "1rem" },
                  fontWeight: "var(--cs-typography-fontWeight-bold)",
                  border: "3px solid var(--cs-semantic-color-text-inverse)",
                  zIndex: 2,
                }}
              >
                {jerseyNumber}
              </Box>
            )}
          </Box>
        </Grid>
        <Grid
          size={{ xs: 12, sm: "auto" }}
          sx={{ textAlign: { xs: "center", sm: "left" } }}
        >
          <Typography
            variant="h3"
            sx={{
              fontFamily: "var(--cs-typography-fontFamily-display)",
              fontWeight: "var(--cs-typography-fontWeight-bold)",
              textTransform: "uppercase",
              letterSpacing: "var(--cs-typography-letterSpacing-tight)",
              color: "var(--cs-semantic-color-text-inverse)",
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="h6"
              sx={{
                opacity: 0.9,
                fontWeight: "var(--cs-typography-fontWeight-medium)",
                color: "var(--cs-semantic-color-text-inverse)",
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Grid>
        {stats.length > 0 && (
          <Grid size={{ xs: 12, md: "auto" }}>
            <Stack
              direction="row"
              spacing={{ xs: 2, sm: 4 }}
              sx={{ justifyContent: { xs: "center", sm: "flex-start" } }}
            >
              {stats.map((stat, index) => (
                <React.Fragment key={stat.label}>
                  <KpiStat
                    label={stat.label}
                    value={stat.value}
                    light
                    isEmpty={gamesPlayed !== undefined && gamesPlayed === 0}
                  />
                  {index < stats.length - 1 && (
                    <Typography
                      sx={{
                        opacity: 0.3,
                        alignSelf: "center",
                        color: "var(--cs-semantic-color-text-inverse)",
                        fontSize: { xs: "1.5rem", sm: "2rem" },
                      }}
                    >
                      |
                    </Typography>
                  )}
                </React.Fragment>
              ))}
            </Stack>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default EntityBanner;
