import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Dialog,
  InputBase,
  List,
  ListSubheader,
  ListItem,
  ListItemText,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import { useTokens } from "../../theme/useTokens";

const SECTION_HEADERS = [
  "Players",
  "Games",
  "Teams",
  "Reports",
  "Actions",
] as const;

export interface OmniSearchProps {
  open: boolean;
  onClose: () => void;
}

const OmniSearch: React.FC<OmniSearchProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const tokens = useTokens();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [open]);

  const searchInput = (
    <Box
      role="search"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 2,
        py: 1.5,
        borderBottom: "1px solid",
        borderColor: tokens.semantic.color.border.subtle,
      }}
    >
      <SearchIcon
        sx={{
          color: tokens.semantic.color.text.secondary,
          flexShrink: 0,
        }}
      />
      <InputBase
        inputRef={inputRef}
        fullWidth
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search players, games, teams, stats, or actions…"
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        slotProps={{
          input: {
            "aria-label": "Search players, games, teams, stats, or actions",
          },
        }}
        sx={{ fontSize: tokens.typography.fontSize.md }}
      />
      {query && (
        <Tooltip title="Clear search">
          <IconButton
            size="small"
            aria-label="Clear search"
            onClick={() => setQuery("")}
            sx={{
              color: tokens.semantic.color.text.secondary,
              flexShrink: 0,
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );

  const emptyDropdown = (
    <List dense disablePadding>
      {SECTION_HEADERS.map((section, idx) => (
        <React.Fragment key={section}>
          <ListSubheader
            sx={{
              bgcolor: tokens.semantic.color.background.paper,
              lineHeight: "32px",
              fontSize: tokens.typography.fontSize.xs,
              fontWeight: tokens.typography.fontWeight.bold,
              letterSpacing: tokens.typography.letterSpacing.wider,
              color: tokens.semantic.color.text.disabled,
              textTransform: "uppercase",
            }}
          >
            {section}
          </ListSubheader>
          <ListItem sx={{ pl: 3, py: 0.5 }}>
            <ListItemText
              primary={
                <Typography
                  variant="body2"
                  sx={{ color: tokens.semantic.color.text.disabled }}
                >
                  No results
                </Typography>
              }
            />
          </ListItem>
          {idx < SECTION_HEADERS.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </List>
  );

  if (isMobile) {
    // Full-screen modal on mobile
    return (
      <Dialog
        fullScreen
        open={open}
        onClose={onClose}
        slotProps={{
          paper: { sx: { bgcolor: tokens.semantic.color.background.paper } },
        }}
      >
        {searchInput}
        {emptyDropdown}
      </Dialog>
    );
  }

  // Inline expanded panel on tablet+
  if (!open) return null;
  return (
    <Box
      sx={{
        position: "fixed",
        top: 64,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 640,
        zIndex: (t) => t.zIndex.appBar + 1,
        px: 2,
      }}
    >
      <Paper elevation={8} sx={{ borderRadius: 2, overflow: "hidden" }}>
        {searchInput}
        {emptyDropdown}
      </Paper>
    </Box>
  );
};

export default OmniSearch;
