export type CSSVariableMap = Record<`--${string}`, string | number | null | undefined>;
export type CSSVariableStyleObject = Record<`--${string}`, string | number>;

export function cssVariables(vars: CSSVariableMap): CSSVariableStyleObject {
  return Object.fromEntries(
    Object.entries(vars).filter(([, value]) => value !== undefined && value !== null),
  ) as CSSVariableStyleObject;
}

export default cssVariables;
