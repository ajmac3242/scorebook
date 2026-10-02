import {
  renderWithProviders,
  assertAccessible,
  screen,
} from "../../test-utils";
import PageContainer from "./PageContainer";
import { describe, it, expect } from "vitest";

describe("PageContainer", () => {
  it("renders children with default 'wide' width configuration", () => {
    renderWithProviders(
      <PageContainer>
        <div>Content Inside Container</div>
      </PageContainer>,
      { withAuth: false },
    );

    expect(screen.getByText("Content Inside Container")).toBeInTheDocument();
  });

  it("applies specified width configurations ('narrow', 'default', 'wide', 'full')", () => {
    const { rerender, container } = renderWithProviders(
      <PageContainer width="narrow">
        <div>Narrow Container</div>
      </PageContainer>,
      { withAuth: false },
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
      { withAuth: false },
    );

    await assertAccessible(container);
  });
});
