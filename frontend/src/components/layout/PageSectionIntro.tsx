import React from "react";
import { Box, Typography } from "@mui/material";
import { useTokens } from "../../theme/useTokens";

interface PageSectionIntroProps {
  title: string;
  description?: string;
}

const PageSectionIntro: React.FC<PageSectionIntroProps> = ({
  title,
  description,
}) => {
  const tokens = useTokens();
  const sectionIntro = tokens.layout.sectionIntro;
  const titleGap = sectionIntro?.titleGap ?? 4;

  return (
    <Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          mb: `${titleGap / 8}rem`,
          color: "text.primary",
        }}
      >
        {title}
      </Typography>

      {description ? (
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      ) : null}
    </Box>
  );
};

export default PageSectionIntro;
