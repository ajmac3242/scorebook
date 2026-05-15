// frontend/src/tokens/palette.ts

export type ColorScale = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
};

export type SemanticColor = {
  main: string;
  light: string;
  dark: string;
  contrastText: string;
};

export const blue: ColorScale = {
  50: "#F1F7FA",
  100: "#D9EAF1",
  200: "#B7D5E3",
  300: "#8DB9CD",
  400: "#5A9BBD",
  500: "#287094",
  600: "#1F6486",
  700: "#18546F",
  800: "#0F4359",
  900: "#023246",
};

export const slate: ColorScale = {
  50: "#F6F8F9",
  100: "#E8EEF1",
  200: "#D2DDE3",
  300: "#AEBFC8",
  400: "#8095A1",
  500: "#5A7381",
  600: "#4C6573",
  700: "#3E5561",
  800: "#31434D",
  900: "#22313A",
};

export const warmGray: ColorScale = {
  50: "#FCFCFA",
  100: "#F6F6F6",
  200: "#EBEBE7",
  300: "#DCDCD7",
  400: "#D4D4CE",
  500: "#BDBDB6",
  600: "#A8A8A0",
  700: "#8C8C84",
  800: "#6B6B65",
  900: "#4C4C47",
};

export const neutral: ColorScale = {
  50: "#FFFFFF",
  100: "#FFFDF5",
  200: "#F7F4EA",
  300: "#F5F5F0",
  400: "#E7E2D8",
  500: "#D1D1D1",
  600: "#B1B1B1",
  700: "#8E8E8E",
  800: "#5D5D5D",
  900: "#2D2D2D",
};

export const successScale: ColorScale = {
  50: "#F4F8F4",
  100: "#DFEBE2",
  200: "#BED6C4",
  300: "#97BA9F",
  400: "#709A7A",
  500: "#4E7D5B",
  600: "#426C4E",
  700: "#355A40",
  800: "#284734",
  900: "#1D3427",
};

export const errorScale: ColorScale = {
  50: "#FBF4F4",
  100: "#F2DEDE",
  200: "#E6BDBD",
  300: "#D38F8F",
  400: "#BC6666",
  500: "#A64444",
  600: "#913939",
  700: "#782F2F",
  800: "#5F2424",
  900: "#471A1A",
};

export const warningScale: ColorScale = {
  50: "#FFF8EC",
  100: "#FBEBC8",
  200: "#F5D99A",
  300: "#EDC264",
  400: "#E5AF45",
  500: "#D99E32",
  600: "#BC8323",
  700: "#98681A",
  800: "#744E14",
  900: "#56390E",
};

export const paperGrid = {
  dot: "#D1D1D1",
  background: "#F6F6F6",
};

export const brand = {
  primary: {
    main: blue[500],
    light: blue[400],
    dark: blue[900],
    contrastText: "#FFFFFF",
  } satisfies SemanticColor,
  secondary: {
    main: warmGray[400],
    light: warmGray[100],
    dark: warmGray[600],
    contrastText: blue[900],
  } satisfies SemanticColor,
  success: {
    main: successScale[500],
    light: successScale[300],
    dark: successScale[700],
    contrastText: "#FFFFFF",
  } satisfies SemanticColor,
  error: {
    main: errorScale[500],
    light: errorScale[300],
    dark: errorScale[700],
    contrastText: "#FFFFFF",
  } satisfies SemanticColor,
  warning: {
    main: warningScale[500],
    light: warningScale[300],
    dark: warningScale[700],
    contrastText: blue[900],
  } satisfies SemanticColor,
  info: {
    main: slate[500],
    light: slate[300],
    dark: slate[700],
    contrastText: "#FFFFFF",
  } satisfies SemanticColor,
};

export const surfaces = {
  canvas: neutral[100], // legacy #fffdf5 feel
  app: warmGray[100], // legacy #F6F6F6 app bg
  paper: neutral[50], // card / sheet / app bar
  subtle: neutral[300], // code blocks / subdued panels
  muted: warmGray[200],
  border: neutral[500],
  borderStrong: warmGray[500],
};

export const text = {
  primary: blue[900], // legacy #023246
  secondary: slate[500], // legacy #5A7381
  heading: "#1A1A1A", // legacy index.css heading tone
  body: neutral[900], // legacy #2d2d2d
  muted: warmGray[700],
  inverse: "#FFFFFF",
};

export const focus = {
  ring: "#154C56", // from :focus-visible in index.css
};

export const palette = {
  blue,
  slate,
  warmGray,
  neutral,
  successScale,
  errorScale,
  warningScale,
  paperGrid,
  brand,
  surfaces,
  text,
  focus,
};

export type AppPalette = typeof palette;
