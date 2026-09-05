import { screen } from "@testing-library/react";
import {
  renderWithProviders,
  assertAccessible,
} from "../../test-utils/renderWithProviders";
import PageContainer from "./PageContainer";
import { describe, it, expect } from "vitest";

describe("PageContainer", () => {
  it("renders children with default 'wide' width configuration", () => {
    renderWithProviders(
      <PageContainer>
        <div>Content Inside Container</div>
      </PageContainer>,
    );

    expect(screen.getByText("Content Inside Container")).toBeInTheDocument();
  });

  it("applies specified width configurations ('narrow', 'default', 'wide', 'full')", () => {
    const { rerender, container } = renderWithProviders(
      <PageContainer width="narrow">
        <div>Narrow Container</div>
      </PageContainer>,
    );

    const childBox = container.firstChild as HTMLElement;
    expect(childBox).toHaveStyle({ maxWidth: "720px" });

    rerender(
      <PageContainer width="full">
        <div>Full Container</div>
      </PageContainer>,
    );
    expect(container.firstChild as HTMLElement).toHaveStyle({
      maxWidth: "none",
    });
  });

  it("passes accessibility assertions", async () => {
    const { container } = renderWithProviders(
      <PageContainer>
        <h1>Page Header</h1>
        <p>Container body text.</p>
      </PageContainer>,
    );

    await assertAccessible(container);
  });
});
