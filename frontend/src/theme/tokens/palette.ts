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
  100: "#FAFBFC",
  200: "#F3F5F7",
  300: "#E9EDF1",
  400: "#D9DEE4",
  500: "#C2CAD3",
  600: "#97A3AF",
  700: "#6B7785",
  800: "#46515C",
  900: "#1F2933",
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

export const palettes = {
  blue,
  slate,
  warmGray,
  neutral,
  successScale,
  errorScale,
  warningScale,
};
