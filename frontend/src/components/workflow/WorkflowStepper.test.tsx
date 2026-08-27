import { describe, it, expect } from "vitest";
import {
  renderWithProviders as render,
  screen,
  assertAccessible,
} from "../../test-utils";
import WorkflowStepper from "./WorkflowStepper";

describe("WorkflowStepper", () => {
  const defaultSteps = ["Select Team", "Choose Roster", "Confirm Lineup"];

  it("renders all step labels and step numbers", () => {
    render(<WorkflowStepper steps={defaultSteps} activeStep={0} />);

    expect(screen.getByText("Select Team")).toBeInTheDocument();
    expect(screen.getByText("Choose Roster")).toBeInTheDocument();
    expect(screen.getByText("Confirm Lineup")).toBeInTheDocument();

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders check icons for completed steps", () => {
    render(<WorkflowStepper steps={defaultSteps} activeStep={2} />);

    // First two steps should be completed and show CheckIcon (data-testid="CheckIcon")
    expect(screen.getAllByTestId("CheckIcon")).toHaveLength(2);
    // Active step (step 3, index 2) should display step number "3"
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.queryByText("1")).not.toBeInTheDocument();
    expect(screen.queryByText("2")).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <WorkflowStepper steps={defaultSteps} activeStep={1} />,
    );
    await assertAccessible(container);
  });
});
