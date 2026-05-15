MuiPaper: {
  defaultProps: { elevation: 0 },
  styleOverrides: {
    root: {
      backgroundImage: "none",
      backgroundColor: activeTokens.semantic.color.background.paper,
      borderColor: activeTokens.semantic.color.border.subtle,
    },
    rounded: {
      borderRadius: activeTokens.semantic.component.sectionCard.radius,
    },
  },
},
MuiCard: {
  defaultProps: { elevation: 0 },
  styleOverrides: {
    root: {
      borderRadius: activeTokens.semantic.component.selectionCard.radius,
      border: activeTokens.semantic.component.border.card,
      boxShadow: "none",
      backgroundColor: activeTokens.semantic.color.background.paper,
    },
  },
},
MuiTabs: {
  styleOverrides: {
    root: {
      minHeight: activeTokens.layout.subnavHeight,
    },
    indicator: {
      height: activeTokens.semantic.component.subnavTab.indicatorHeight,
      borderRadius: 999,
      backgroundColor: activeTokens.semantic.color.brand.primary,
    },
    flexContainer: {
      gap: activeTokens.layout.inlineGap * 2,
    },
  },
},
MuiTab: {
  styleOverrides: {
    root: {
      minHeight: activeTokens.layout.subnavHeight,
      paddingInline: activeTokens.layout.inlineGap,
      paddingBlock: activeTokens.layout.inlineGap,
      textTransform: "none",
      fontSize: activeTokens.semantic.typography.supportingText.fontSize,
      fontWeight: activeTokens.typography.fontWeight.medium,
      color: activeTokens.semantic.color.text.secondary,
      "&.Mui-selected": {
        color: activeTokens.semantic.color.text.primary,
      },
    },
  },
},
MuiButton: {
  defaultProps: { disableElevation: true },
  styleOverrides: {
    root: {
      minHeight: activeTokens.touch.targetComfortable,
      borderRadius: activeTokens.semantic.component.radius.button,
      textTransform: "none",
      boxShadow: "none",
    },
  },
},
MuiOutlinedInput: {
  styleOverrides: {
    root: {
      minHeight: activeTokens.layout.inputHeightMd,
      borderRadius: activeTokens.semantic.component.radius.input,
      backgroundColor: activeTokens.semantic.color.background.paper,
    },
  },
},
