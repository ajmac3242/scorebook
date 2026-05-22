import React from "react";
import { Box, Divider, Tab, Tabs, Typography, useTheme } from "@mui/material";
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
  controls?: React.ReactNode;
  children: React.ReactNode;
}

function AppPageShell<T extends string>({
  title,
  activeTab,
  tabs,
  onTabChange,
  actions,
  controls,
  children,
}: AppPageShellProps<T>) {
  const theme = useTheme();
  const tokens = useTokens();
  const pageSurface = tokens.layout.pageSurface;
  const pageTabs = tokens.layout.pageTabs;

  const activeIndex =
    tabs && activeTab ? tabs.findIndex((tab) => tab.value === activeTab) : -1;

  const showTabs = Boolean(tabs && tabs.length > 0);
  const showHeaderDivider = showTabs || Boolean(controls);

  return (
    <Box
      id="main-content"
      sx={{
        width: "100%",
        minWidth: 0,
        maxWidth: "none",
        flex: 1,
        alignSelf: "stretch",
        background:
          pageSurface?.background ??
          "var(--cs-semantic-color-background-default)",
        border: pageSurface?.border ?? "none",
        borderRadius: {
          xs: 0,
          md: `${pageSurface?.radius ?? 20}px`,
        },
        boxShadow: pageSurface?.shadow ?? "none",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: {
            xs: 2.5,
            md: `${(pageSurface?.headerPaddingX ?? 32) / 8}rem`,
          },
          pt: {
            xs: 2,
            md: `${(pageSurface?.headerPaddingTop ?? 16) / 8}rem`,
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
            mb: showTabs ? 1.5 : controls ? 1.25 : 0,
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

        {showTabs ? (
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
              mt: 0,
              minWidth: 0,
              "& .MuiTabs-flexContainer": {
                gap: `${pageTabs?.gap ?? 20}px`,
              },
              "& .MuiTabs-scroller": {
                overflow: "visible !important",
              },
              "& .MuiTabs-indicator": {
                backgroundColor: theme.palette.primary.main,
                height: 2,
                borderRadius: 999,
              },
              "& .MuiTab-root": {
                textTransform: "none",
                fontSize: "0.875rem",
                fontWeight: 500,
                minHeight: pageTabs?.height ?? 40,
                minWidth: 0,
                px: `${(pageTabs?.paddingX ?? 4) / 8}rem`,
                pb: 1.25,
                pt: 0.75,
                borderRadius: 0,
                color: pageTabs?.inactiveColor ?? "text.secondary",
                backgroundColor: "transparent",
                transition: "color 150ms ease",
                "&:hover": {
                  backgroundColor: "transparent",
                  color: "text.primary",
                },
              },
              "& .MuiTab-root.Mui-selected": {
                color: pageTabs?.activeColor ?? "text.primary",
                backgroundColor: "transparent",
                fontWeight: 600,
              },
            }}
          >
            {tabs.map((tab) => (
              <Tab key={tab.value} label={tab.label} />
            ))}
          </Tabs>
        ) : null}

        {showHeaderDivider ? (
          <Divider
            sx={{
              mt: showTabs ? 0 : 1.25,
              width: "calc(100% + 64px)",
              ml: "-32px",
              borderColor:
                pageSurface?.dividerColor ??
                "var(--cs-semantic-color-border-subtle)",
            }}
          />
        ) : null}
      </Box>

      {controls ? (
        <Box
          sx={{
            px: {
              xs: 2.5,
              md: `${(pageSurface?.contentPaddingX ?? 32) / 8}rem`,
            },
            py: 1.75,
            borderBottom: "1px solid",
            borderColor:
              pageSurface?.dividerColor ??
              "var(--cs-semantic-color-border-subtle)",
            background:
              pageSurface?.controlsBackground ??
              "var(--cs-semantic-color-background-subtle, transparent)",
          }}
        >
          {controls}
        </Box>
      ) : null}

      <Box
        sx={{
          width: "100%",
          minWidth: 0,
          px: {
            xs: 2.5,
            md: `${(pageSurface?.contentPaddingX ?? 32) / 8}rem`,
          },
          pt: controls ? 2 : 1.5,
          pb: {
            xs: 2.5,
            md: `${(pageSurface?.contentPaddingBottom ?? 32) / 8}rem`,
          },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default AppPageShell;
