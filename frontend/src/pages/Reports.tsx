import React from "react";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import AppPageShell from "../components/layout/AppPageShell";
import { useTokens } from "../theme/useTokens";
import { EmptyState } from "../components/feedback";
import { Assessment as ReportsIcon } from "@mui/icons-material";

const Reports: React.FC = () => {
  const tokens = useTokens();
  const navigate = useNavigate();

  return (
    <AppPageShell title="Reports">
      <EmptyState
        icon={
          <ReportsIcon
            sx={{
              fontSize: tokens.semantic.component.iconSize.xl,
              color: tokens.semantic.color.text.tertiary,
            }}
          />
        }
        title="Reports"
        description="View season and game reports here. Detailed analytics and performance summaries are coming soon."
        action={
          <Button
            variant="contained"
            onClick={() => navigate("/")}
            aria-label="Navigate to dashboard page"
            sx={{
              textTransform: "none",
              borderRadius: tokens.semantic.component.radius.button,
              fontWeight: tokens.semantic.typography.button.fontWeight,
            }}
          >
            Go to Dashboard
          </Button>
        }
      />
    </AppPageShell>
  );
};

export default Reports;
