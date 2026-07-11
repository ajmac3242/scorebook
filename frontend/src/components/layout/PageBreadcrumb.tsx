import React from "react";
import { Box, Link as MuiLink, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useTokens } from "../../theme/useTokens";

export type BreadcrumbSegment = {
  label: string;
  to?: string;
};

interface PageBreadcrumbProps {
  segments: BreadcrumbSegment[];
}

const PageBreadcrumb: React.FC<PageBreadcrumbProps> = ({ segments }) => {
  const tokens = useTokens();
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        fontSize: tokens.typography.fontSize.sm,
      }}
    >
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;

        if (isLast) {
          return (
            <Typography
              key={index}
              sx={{
                fontSize: "inherit",
                fontWeight: tokens.typography.fontWeight.medium,
                color: "text.primary",
              }}
            >
              {segment.label}
            </Typography>
          );
        }

        return (
          <React.Fragment key={index}>
            {segment.to ? (
              <MuiLink
                component={RouterLink}
                to={segment.to}
                underline="hover"
                sx={{
                  color: "text.secondary",
                  fontWeight: tokens.typography.fontWeight.regular,
                  fontSize: "inherit",
                  "&:hover": { color: "text.primary" },
                }}
              >
                {segment.label}
              </MuiLink>
            ) : (
              <Typography
                sx={{
                  fontSize: "inherit",
                  fontWeight: tokens.typography.fontWeight.regular,
                  color: "text.secondary",
                }}
              >
                {segment.label}
              </Typography>
            )}
            <Box
              component="span"
              sx={{
                color: "text.secondary",
                mx: tokens.semantic.spacing.xs / 8,
                fontSize: "inherit",
              }}
            >
              /
            </Box>
          </React.Fragment>
        );
      })}
    </Box>
  );
};

export default PageBreadcrumb;
