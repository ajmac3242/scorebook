import React from "react";
import { Box, Divider, Stack, Tab, Tabs, Typography } from "@mui/material";
import { useTokens } from "../../theme/useTokens";
import PageBreadcrumb, { type BreadcrumbSegment } from "./PageBreadcrumb";

export type AppPageTab<T extends string> = {
  value: T;
  label: string;
};

type AppPageShellProps<T extends string> = {
  title?: string;
  activeTab?: T;
  tabs?: readonly AppPageTab<T>[];
  onTabChange?: (_tab: T) => void;
  controls?: React.ReactNode;
  children: React.ReactNode;
  contextLabel?: React.ReactNode;
  breadcrumb?: BreadcrumbSegment[];
  headerContent?: React.ReactNode;
};

function AppPageShell<T extends string>({
  title,
  activeTab,
  tabs,
  onTabChange,
  controls,
  children,
  contextLabel,
  breadcrumb,
  headerContent,
}: AppPageShellProps<T>) {
  const tokens = useTokens();
  const containerRadius = Math.max(
    tokens.semantic.component.sectionCard.radius,
    24,
  );

  const showStandardHeader = Boolean(title) && !headerContent;
  const showTabs = Boolean(tabs?.length && activeTab && onTabChange);

  return (
    <Box
      sx={{
        minHeight: "100%",
        px: { xs: 1, md: 3 },
        py: { xs: 1, md: 3 },
      }}
    >
      <Box
        sx={{
          bgcolor: "background.default",
          borderRadius: {
            xs: `${containerRadius / 2}px`,
            md: `${containerRadius}px`,
          },
          px: { xs: 1.5, md: 4 },
          py: { xs: 1.5, md: 3 },
        }}
      >
        {(breadcrumb ||
          contextLabel ||
          showStandardHeader ||
          showTabs ||
          controls ||
          headerContent) && (
          <Box sx={{ mb: { xs: 2, md: 3 } }}>
            {breadcrumb ? (
              <Box
                sx={{
                  mb: showStandardHeader || headerContent || showTabs ? 1 : 0,
                }}
              >
                <PageBreadcrumb segments={breadcrumb} />
              </Box>
            ) : contextLabel ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: showStandardHeader || headerContent || showTabs ? 1 : 0,
                  fontWeight: 500,
                }}
              >
                {contextLabel}
              </Typography>
            ) : null}

            {showStandardHeader ? (
              <Typography
                variant="h4"
                color="text.primary"
                sx={{
                  fontWeight: 600,
                  mb: { xs: 1.5, md: showTabs || controls ? 2 : 0 },
                  fontSize: { xs: "1.25rem", md: "1.5rem" },
                }}
              >
                {title}
              </Typography>
            ) : null}

            {headerContent ? (
              <Box sx={{ mb: { xs: 1.5, md: showTabs || controls ? 2 : 0 } }}>
                {headerContent}
              </Box>
            ) : null}

            {showTabs || controls ? (
              <>
                <Stack
                  direction={{ xs: "column", lg: "row" }}
                  spacing={{ xs: 1.5, lg: 2 }}
                  sx={{
                    justifyContent: "space-between",
                    alignItems: { xs: "stretch", lg: "center" },
                  }}
                >
                  {showTabs ? (
                    <Tabs
                      value={activeTab}
                      onChange={(_, value) => onTabChange?.(value)}
                      variant="scrollable"
                      scrollButtons="auto"
                      allowScrollButtonsMobile
                      sx={{
                        minHeight: 44,
                        "& .MuiTab-root": {
                          textTransform: "none",
                          fontWeight: 500,
                          minHeight: 44,
                          px: 1,
                        },
                      }}
                    >
                      {tabs!.map((tab) => (
                        <Tab
                          key={tab.value}
                          value={tab.value}
                          label={tab.label}
                        />
                      ))}
                    </Tabs>
                  ) : (
                    <Box />
                  )}

                  {controls ? (
                    <Box
                      sx={{
                        width: { xs: "100%", lg: "auto" },
                        minWidth: 0,
                      }}
                    >
                      {controls}
                    </Box>
                  ) : null}
                </Stack>

                <Divider sx={{ mt: 1 }} />
              </>
            ) : null}
          </Box>
        )}

        <Box>{children}</Box>
      </Box>
    </Box>
  );
}

export default AppPageShell;
