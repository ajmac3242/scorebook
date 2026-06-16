import React from "react";
import { Grid, Box } from "@mui/material";
import AppPageShell, { type AppPageTab } from "./AppPageShell";
import { PageToolbar } from "./PageToolbar";
import { EmptyState } from "../feedback";
import { useTokens } from "../../theme/useTokens";
import type { BreadcrumbSegment } from "./PageBreadcrumb";

interface EntityGridPageProps<T extends string, I> {
  /** Page title */
  title: string;
  /** Active tab value */
  activeTab: T;
  /** List of tabs */
  tabs: readonly AppPageTab<T>[];
  /** Callback when tab changes */
  onTabChange: (_tab: T) => void;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Current search value */
  searchValue: string;
  /** Callback when search changes */
  onSearchChange: (_value: string) => void;
  /** Label for the primary action button (e.g. "Create team") */
  primaryLabel: string;
  /** Callback for the primary action button */
  onPrimaryClick: () => void;
  /** Whether the primary action button is disabled (mobile logic usually) */
  primaryDisabled?: boolean;
  /** List of items to display in the grid */
  items: I[];
  /** Render function for each item card */
  renderCard: (_item: I) => React.ReactNode;
  /** Icon for the empty state */
  emptyIcon: React.ReactNode;
  /** Title for the empty state */
  emptyTitle: string;
  /** Description for the empty state */
  emptyDescription: string;
  /** Optional action for the empty state */
  emptyAction?: React.ReactNode;
  /** FAB icon (mobile) */
  fabIcon?: React.ReactNode;
  /** FAB aria-label */
  fabAriaLabel?: string;
  /** Optional breadcrumbs */
  breadcrumb?: BreadcrumbSegment[];
  /** Any extra snacks/dialogs that need to be in the portal */
  children?: React.ReactNode;
}

export function EntityGridPage<T extends string, I>({
  title,
  activeTab,
  tabs,
  onTabChange,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  primaryLabel,
  onPrimaryClick,
  primaryDisabled,
  items,
  renderCard,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyAction,
  fabIcon,
  fabAriaLabel,
  breadcrumb,
  children,
}: EntityGridPageProps<T, I>) {
  const tokens = useTokens();

  const controls = (
    <PageToolbar
      placeholder={searchPlaceholder}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      primaryLabel={primaryLabel}
      onPrimaryClick={onPrimaryClick}
      primaryDisabled={primaryDisabled}
    />
  );

  return (
    <AppPageShell<T>
      title={title}
      activeTab={activeTab}
      tabs={tabs}
      onTabChange={onTabChange}
      controls={controls}
      breadcrumb={breadcrumb}
      fabProps={
        fabIcon
          ? {
              icon: fabIcon,
              "aria-label": fabAriaLabel,
              onClick: onPrimaryClick,
            }
          : undefined
      }
    >
      {children}

      <Box sx={{ width: "100%" }}>
        {items.length === 0 ? (
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
            action={emptyAction}
          />
        ) : (
          <Grid
            container
            spacing={tokens.layout.pagePaddingXUnits}
          >
            {items.map((item, index) => (
              <Grid
                key={(item as any).id || index}
                size={{ xs: 12, md: 6, xl: 4 }}
              >
                {renderCard(item)}
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </AppPageShell>
  );
}

export default EntityGridPage;
