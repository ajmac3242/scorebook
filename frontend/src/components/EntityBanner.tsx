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
  Search as SearchIcon,
  Close as CloseIcon,
  CheckCircle as CheckIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { StatItem } from "./SharedUI";
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
  primaryColor?: string;
  stats?: Array<{ label: string; value: string | number }>;
  actions?: React.ReactNode;
  onSync?: () => void;
  isSyncing?: boolean;
  jerseyNumber?: string;
  searchTerm?: string;
  onSearchChange?: (_value: string) => void;
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
  primaryColor = "#154C56",
  stats = [],
  actions,
  onSync,
  isSyncing = false,
  jerseyNumber,
  searchTerm,
  onSearchChange,
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
        p: { xs: 2, sm: 4 },
        pt: { xs: 7, sm: 4 },
        mb: 0,
        borderRadius: "8px",
        bgcolor: primaryColor,
        color: "white",
        position: "relative",
        overflow: "hidden",
        transition: "background-color 0.3s ease",
      }}
    >
      <Tooltip
        title={
          backTo
            ? `Back to ${backTo.split("/").pop() || "Previous Page"}`
            : "Go Back"
        }
      >
        <IconButton
          aria-label={
            backTo
              ? `Back to ${backTo.split("/").pop() || "previous page"}`
              : "go back"
          }
          onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
          sx={{
            position: "absolute",
            top: 16,
            left: 16,
            color: "white",
            bgcolor: "rgba(255,255,255,0.1)",
            "&:hover": {
              bgcolor: "rgba(255,255,255,0.2)",
              transform: "scale(1.1)",
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Tooltip>

      <Grid
        container
        spacing={{ xs: 2, sm: 4 }}
        sx={{ mt: { xs: 0, sm: 1 }, alignItems: "center" }}
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
                  bgcolor: "var(--palette-golden-dune)",
                  color: "var(--palette-midnight)",
                  borderRadius: "50%",
                  width: { xs: 28, sm: 36 },
                  height: { xs: 28, sm: 36 },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: { xs: "0.75rem", sm: "1rem" },
                  fontWeight: "bold",
                  border: "3px solid white",
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
              fontFamily: "var(--serif)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: "white",
              fontSize: { xs: "1.75rem", sm: "3rem" },
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="h6"
              sx={{
                opacity: 0.9,
                fontWeight: 500,
                color: "white",
                fontSize: { xs: "1rem", sm: "1.25rem" },
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
                  <StatItem label={stat.label} value={stat.value} light />
                  {index < stats.length - 1 && (
                    <Typography
                      sx={{
                        opacity: 0.3,
                        alignSelf: "center",
                        color: "white",
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
      <Box
        sx={{
          position: "absolute",
          top: 16,
          right: 16,
          display: "flex",
          alignItems: "center",
          gap: 1,
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
                sx={{ color: "white", flexShrink: 0 }}
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
                      color: "white",
                      fontSize: "0.9rem",
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
                  color: showSyncSuccess ? "#4CAF50" : "white",
                  borderColor: showSyncSuccess
                    ? "#4CAF50"
                    : "rgba(255,255,255,0.5)",
                  "&:hover": {
                    borderColor: showSyncSuccess ? "#4CAF50" : "white",
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
    </Box>
  );
};

export default EntityBanner;
