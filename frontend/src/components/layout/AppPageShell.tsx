import React from "react";
import { Box, Tab, Tabs, Typography, useTheme } from "@mui/material";
import { useTokens } from "../../theme/useTokens";

export interface AppPageTab<T extends string> {
  value: T;
  label: string;
}

interface AppPageShellProps<T extends string> {
  title: string;
  activeTab?: T;
  tabs?: readonly AppPageTab<T>[];
  onTabChange?: (_tab: T) => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

function AppPageShell<T extends string>({
  title,
  activeTab,
  tabs,
  onTabChange,
  actions,
  children,
}: AppPageShellProps<T>) {
  const theme = useTheme();
  const tokens = useTokens();
  const pageSurface = tokens.layout.pageSurface;
  const pageTabs = tokens.layout.pageTabs;

  const activeIndex =
    tabs && activeTab ? tabs.findIndex((tab) => tab.value === activeTab) : -1;

  return (
    <Box
      id="main-content"
      sx={{
        width: "100%",
        minWidth: 0,
        maxWidth: pageSurface?.maxWidth ?? 1280,
        background: pageSurface?.background ?? "transparent",
        border: pageSurface?.border ?? "none",
        boxShadow: pageSurface?.shadow ?? "none",
        overflow: "visible",
      }}
    >
      <Box
        sx={{
          px: {
            xs: 0,
            md: `${(pageSurface?.headerPaddingX ?? 0) / 8}rem`,
          },
          pt: {
            xs: 0,
            md: `${(pageSurface?.headerPaddingTop ?? 0) / 8}rem`,
          },
          pb: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            gap: 2,
            flexDirection: { xs: "column", sm: "row" },
            mb: 2,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: "text.primary",
            }}
          >
            {title}
          </Typography>

          {actions ? <Box sx={{ flexShrink: 0 }}>{actions}</Box> : null}
        </Box>

        {tabs && tabs.length > 0 ? (
          <Tabs
            value={activeIndex < 0 ? 0 : activeIndex}
            onChange={(_event, index: number) => {
              if (!tabs || !onTabChange) return;
              const nextTab = tabs[index];
              if (nextTab) onTabChange(nextTab.value);
            }}
            aria-label={`${title} sections`}
            variant="scrollable"
            scrollButtons="auto"
            textColor="inherit"
            sx={{
              minHeight: pageTabs?.height ?? 40,
              mt: 0.75,
              "& .MuiTabs-flexContainer": {
                gap: `${pageTabs?.gap ?? 8}px`,
              },
              "& .MuiTabs-indicator": {
                backgroundColor: theme.palette.primary.main,
                height: 2,
              },
              "& .MuiTab-root": {
                textTransform: "none",
                fontSize: "0.875rem",
                fontWeight: 500,
                minHeight: pageTabs?.height ?? 40,
                px: `${(pageTabs?.paddingX ?? 12) / 8}rem`,
                borderRadius: `${pageTabs?.radius ?? 8}px`,
                color: pageTabs?.inactiveColor ?? "text.secondary",
                transition:
                  "background-color 150ms ease, color 150ms ease, box-shadow 150ms ease",
                "&:hover": {
                  backgroundColor: pageTabs?.hoverBackground ?? "action.hover",
                },
              },
              "& .MuiTab-root.Mui-selected": {
                color: pageTabs?.activeColor ?? "text.primary",
                backgroundColor: pageTabs?.activeBackground ?? "transparent",
              },
            }}
          >
            {tabs.map((tab) => (
              <Tab key={tab.value} label={tab.label} />
            ))}
          </Tabs>
        ) : null}
      </Box>

      <Box
        sx={{
          px: {
            xs: 0,
            md: `${(pageSurface?.contentPaddingX ?? 0) / 8}rem`,
          },
          pt: 0,
          pb: {
            xs: 0,
            md: `${(pageSurface?.contentPaddingBottom ?? 0) / 8}rem`,
          },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default AppPageShell;
