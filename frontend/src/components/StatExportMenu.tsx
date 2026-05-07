import React from "react";
import { Stack, Button } from "@mui/material";

interface StatExportMenuProps {
  onExportPDF: () => void;
  isExporting: boolean;
  isDeleted: boolean;
}

const StatExportMenu: React.FC<StatExportMenuProps> = ({ onExportPDF, isExporting, isDeleted }) => {
  if (isDeleted) return null;

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Button
        variant="contained"
        size="small"
        onClick={onExportPDF}
        disabled={isExporting}
        sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white" }}
      >
        {isExporting ? "Exporting..." : "Export PDF"}
      </Button>
    </Stack>
  );
};

export default StatExportMenu;
