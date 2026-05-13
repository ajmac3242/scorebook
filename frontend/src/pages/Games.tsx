import React from "react";
import { Typography, Box } from "@mui/material";

const Games: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
        Games
      </Typography>
      <Typography variant="body1">
        Manage and track your games here. (Placeholder for DESIGN-003-B)
      </Typography>
    </Box>
  );
};

export default Games;
