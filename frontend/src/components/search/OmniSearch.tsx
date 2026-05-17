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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";

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
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 2,
        py: 1.5,
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <SearchIcon sx={{ color: "text.secondary", flexShrink: 0 }} />
      <InputBase
        inputRef={inputRef}
        fullWidth
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search players, games, teams, stats, or actions…"
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        sx={{ fontSize: "1rem" }}
      />
      {query && (
        <CloseIcon
          sx={{ color: "text.secondary", cursor: "pointer", flexShrink: 0 }}
          onClick={() => setQuery("")}
        />
      )}
    </Box>
  );

  const emptyDropdown = (
    <List dense disablePadding>
      {SECTION_HEADERS.map((section, idx) => (
        <React.Fragment key={section}>
          <ListSubheader
            sx={{
              bgcolor: "background.paper",
              lineHeight: "32px",
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "text.disabled",
              textTransform: "uppercase",
            }}
          >
            {section}
          </ListSubheader>
          <ListItem sx={{ pl: 3, py: 0.5 }}>
            <ListItemText
              primary={
                <Typography variant="body2" color="text.disabled">
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

       slotProps={{ paper: { sx: { bgcolor: "background.paper" } } }} >
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
