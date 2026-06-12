import React from "react";
import {
  Box,
  Divider,
  Fab,
  Stack,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
  type FabProps,
} from "@mui/material";
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
  /** When true, headerContent bleeds edge-to-edge, overflowing the inner padding */
  bleedHeader?: boolean;
  /** Props for an optional Floating Action Button on mobile */
  fabProps?: FabProps & { icon?: React.ReactNode };
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
  bleedHeader = false,
  fabProps,
}: AppPageShellProps<T>) {
  const tokens = useTokens();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
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
        px: {
          xs: tokens.layout.pagePaddingXUnits / 2,
          md: tokens.layout.pagePaddingXUnits,
        },
        pt: bleedHeader
          ? 0
          : {
              xs: tokens.layout.pagePaddingXUnits / 2,
              md: tokens.layout.pagePaddingXUnits,
            },
        pb: {
          xs: tokens.layout.pagePaddingXUnits / 2,
          md: tokens.layout.pagePaddingXUnits,
        },
      }}
    >
      <Box
        sx={{
          bgcolor: tokens.semantic.color.background.default,
          borderRadius: {
            xs: `${containerRadius / 2}px`,
            md: `${containerRadius}px`,
          },
          px: {
            xs: tokens.layout.pagePanelPaddingMobileUnits,
            md: tokens.layout.pagePanelPaddingXUnits,
          },
          py: {
            xs: tokens.layout.pagePaddingXUnits / 2,
            md: tokens.layout.pagePaddingXUnits,
          },
          ...(bleedHeader && { pt: 0 }),
        }}
      >
        {(breadcrumb ||
          contextLabel ||
          showStandardHeader ||
          showTabs ||
          controls ||
          headerContent) && (
          <Box
            sx={{
              mb: {
                xs: tokens.layout.pagePaddingXUnits / 1.5,
                md: tokens.layout.pagePaddingXUnits,
              },
            }}
          >
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
                  mb: {
                    xs: tokens.layout.pagePaddingXUnits / 2,
                    md:
                      showTabs || controls
                        ? tokens.layout.pagePaddingXUnits / 1.5
                        : 0,
                  },
                  fontSize: { xs: "1.25rem", md: "1.5rem" },
                }}
              >
                {title}
              </Typography>
            ) : null}

            {headerContent ? (
              <Box
                sx={{
                  mb: {
                    xs: tokens.layout.pagePaddingXUnits / 2,
                    md:
                      showTabs || controls
                        ? tokens.layout.pagePaddingXUnits / 1.5
                        : 0,
                  },
                  ...(bleedHeader && {
                    mx: {
                      xs: -(tokens.layout.pagePaddingXUnits / 2),
                      md: -tokens.layout.pagePaddingXUnits / 0.75,
                    },
                    mt: 0,
                    overflow: "hidden",
                    borderRadius: {
                      xs: `${containerRadius / 2}px ${containerRadius / 2}px 0 0`,
                      md: `${containerRadius}px ${containerRadius}px 0 0`,
                    },
                  }),
                }}
              >
                {headerContent}
              </Box>
            ) : null}

            {showTabs || controls ? (
              <>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={{
                    xs: tokens.layout.pagePaddingXUnits / 2,
                    sm: tokens.layout.pagePaddingXUnits / 1.5,
                  }}
                  sx={{
                    justifyContent: "space-between",
                    alignItems: { xs: "stretch", sm: "center" },
                    pb: tokens.layout.pagePaddingXUnits / 2,
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
                        width: { xs: "100%", sm: "auto" },
                        minWidth: 0,
                      }}
                    >
                      {controls}
                    </Box>
                  ) : null}
                </Stack>

                <Divider />
              </>
            ) : null}
          </Box>
        )}

        <Box>{children}</Box>
      </Box>

      {/* Mobile FAB Integration */}
      {isMobile && fabProps && (
        <Fab
          color="primary"
          {...fabProps}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            boxShadow: theme.shadows[6],
            ...fabProps.sx,
          }}
        >
          {fabProps.icon}
        </Fab>
      )}
    </Box>
  );
}

export default AppPageShell;
