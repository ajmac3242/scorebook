import React from "react";
import { Box, Link as MuiLink, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export type BreadcrumbSegment = {
  label: string;
  to?: string;
};

interface PageBreadcrumbProps {
  segments: BreadcrumbSegment[];
}

const PageBreadcrumb: React.FC<PageBreadcrumbProps> = ({ segments }) => {
  return (
    <Box
      component="nav"
      aria-label="Breadcrumb"
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        fontSize: "var(--cs-typography-fontSize-sm)",
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
                fontWeight: 500,
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
                  fontWeight: 400,
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
                  fontWeight: 400,
                  color: "text.secondary",
                }}
              >
                {segment.label}
              </Typography>
            )}
            <Box
              component="span"
              sx={{ color: "text.secondary", mx: 0.5, fontSize: "inherit" }}
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
