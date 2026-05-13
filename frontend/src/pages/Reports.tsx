import React from "react";
import { Typography, Box } from "@mui/material";

const Reports: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
        Reports
      </Typography>
      <Typography variant="body1">
        View season and game reports here. (Placeholder for DESIGN-003-B)
      </Typography>
    </Box>
  );
};

export default Reports;
