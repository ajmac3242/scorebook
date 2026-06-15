import { axe } from "jest-axe";
import { expect } from "vitest";

/**
 * Common accessibility assertion helper using jest-axe.
 * Should be called within an 'it' or 'test' block after the component has rendered.
 *
 * @param container The container returned from render() or a specific DOM element.
 */
export async function assertAccessible(container: HTMLElement) {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}

export * from "./renderWithProviders";
