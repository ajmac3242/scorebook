import { screen, fireEvent } from "../../../test-utils";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TeamSettingsDialog from "./TeamSettingsDialog";
import { renderWithProviders } from "../../../test-utils";

describe("TeamSettingsDialog", () => {
  let mockProps: any;

  beforeEach(() => {
    mockProps = {
      open: true,
      onClose: vi.fn(),
      onSave: vi.fn().mockResolvedValue(undefined),
      onDeleteRequest: vi.fn(),
      editName: "Lakers",
      setEditName: vi.fn(),
      editLogoUrl: "http://logo.com",
      setEditLogoUrl: vi.fn(),
      editColor: "#000000",
      setEditColor: vi.fn(),
      editPeriodType: "QUARTERS" as const,
      setEditPeriodType: vi.fn(),
      editPeriodLength: 10,
      setEditPeriodLength: vi.fn(),
      editOvertimeLength: 5,
      setEditOvertimeLength: vi.fn(),
      editMaxStintDuration: 30,
      setEditMaxStintDuration: vi.fn(),
      editTimeoutLimit: 3,
      setEditTimeoutLimit: vi.fn(),
      editFoulLimit: 5,
      setEditFoulLimit: vi.fn(),
      editFoulWarningThresholds: { P1: 2, P2: 2, P3: 2, P4: 2 },
      setEditFoulWarningThresholds: vi.fn(),
      editPlaybook: ["Horns", "Elevator"],
      setEditPlaybook: vi.fn(),
      newPlayName: "",
      setNewPlayName: vi.fn(),
    };
  });

  it("renders with correct values", () => {
    renderWithProviders(<TeamSettingsDialog {...mockProps} />);

    expect(screen.getByText("Edit team details")).toBeInTheDocument();
    expect(screen.getByLabelText(/team name/i)).toHaveValue("Lakers");
    expect(screen.getByLabelText(/logo url/i)).toHaveValue("http://logo.com");
    expect(screen.getByLabelText(/period type/i)).toHaveTextContent("Quarters");
  });

  it("calls setEditName on name change", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TeamSettingsDialog {...mockProps} />);

    const input = screen.getByLabelText(/team name/i);
    await user.type(input, "!");
    expect(mockProps.setEditName).toHaveBeenCalled();
  });

  it("updates logo URL", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TeamSettingsDialog {...mockProps} />);

    const input = screen.getByLabelText(/logo url/i);
    await user.type(input, "/new");
    expect(mockProps.setEditLogoUrl).toHaveBeenCalled();
  });

  it("updates primary color", () => {
    renderWithProviders(<TeamSettingsDialog {...mockProps} />);
    const colorInput = screen.getByLabelText(/primary color/i);
    // fireEvent intentional: userEvent has limited support for <input type="color"> in happy-dom
    fireEvent.change(colorInput, { target: { value: "#ffffff" } });
    expect(mockProps.setEditColor).toHaveBeenCalledWith("#ffffff");
  });

  it("calls setEditPeriodType on select change", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TeamSettingsDialog {...mockProps} />);

    const select = screen.getByLabelText(/period type/i);
    await user.click(select);
    const option = await screen.findByRole("option", { name: "Halves" });
    await user.click(option);
    expect(mockProps.setEditPeriodType).toHaveBeenCalledWith("HALVES");
  });

  it("handles numeric input changes", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TeamSettingsDialog {...mockProps} />);

    const periodLength = screen.getByLabelText(/period length/i);
    await user.type(periodLength, "2"); // results in 102 as it prepends/appends depending on cursor, but triggers change
    expect(mockProps.setEditPeriodLength).toHaveBeenCalled();

    const otLength = screen.getByLabelText(/ot length/i);
    await user.type(otLength, "6");
    expect(mockProps.setEditOvertimeLength).toHaveBeenCalled();

    const maxStint = screen.getByLabelText(/max stint duration/i);
    await user.type(maxStint, "5");
    expect(mockProps.setEditMaxStintDuration).toHaveBeenCalled();

    const timeouts = screen.getByLabelText(/timeouts/i);
    await user.type(timeouts, "5");
    expect(mockProps.setEditTimeoutLimit).toHaveBeenCalled();

    const foulLimit = screen.getByLabelText(/foul limit/i);
    await user.type(foulLimit, "6");
    expect(mockProps.setEditFoulLimit).toHaveBeenCalled();
  });

  it("handles fallback to 0 for invalid numeric inputs", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TeamSettingsDialog {...mockProps} />);
    const periodLength = screen.getByLabelText(/period length/i);
    await user.clear(periodLength);
    expect(mockProps.setEditPeriodLength).toHaveBeenCalledWith(0);
  });

  it("updates foul warning thresholds", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TeamSettingsDialog {...mockProps} />);

    const p1Threshold = screen.getByLabelText("P1");
    await user.type(p1Threshold, "3");
    expect(mockProps.setEditFoulWarningThresholds).toHaveBeenCalled();
  });

  it("adds a play to the playbook", async () => {
    const user = userEvent.setup();
    mockProps.newPlayName = "Flare";
    renderWithProviders(<TeamSettingsDialog {...mockProps} />);

    const addButton = screen.getByRole("button", { name: /add/i });
    await user.click(addButton);
    expect(mockProps.setEditPlaybook).toHaveBeenCalledWith([
      ...mockProps.editPlaybook,
      "Flare",
    ]);
    expect(mockProps.setNewPlayName).toHaveBeenCalledWith("");
  });

  it("does not add play if name is empty", async () => {
    const user = userEvent.setup();
    mockProps.newPlayName = "";
    renderWithProviders(<TeamSettingsDialog {...mockProps} />);
    const addButton = screen.getByRole("button", { name: /add/i });
    await user.click(addButton);
    expect(mockProps.setEditPlaybook).not.toHaveBeenCalled();
  });

  it("adds a play on Enter key", async () => {
    const user = userEvent.setup();
    mockProps.newPlayName = "Flare";
    renderWithProviders(<TeamSettingsDialog {...mockProps} />);

    const input = screen.getByLabelText(/new play name/i);
    await user.type(input, "{Enter}");
    expect(mockProps.setEditPlaybook).toHaveBeenCalledWith([
      ...mockProps.editPlaybook,
      "Flare",
    ]);
  });

  it("does not add play on Enter if name is empty", async () => {
    const user = userEvent.setup();
    mockProps.newPlayName = "   ";
    renderWithProviders(<TeamSettingsDialog {...mockProps} />);
    const input = screen.getByLabelText(/new play name/i);
    await user.type(input, "{Enter}");
    expect(mockProps.setEditPlaybook).not.toHaveBeenCalled();
  });

  it("removes a play from the playbook", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TeamSettingsDialog {...mockProps} />);

    const deleteChip = screen.getAllByTestId("CancelIcon")[0]; // MUI Chip delete icon
    await user.click(deleteChip);
    expect(mockProps.setEditPlaybook).toHaveBeenCalledWith(["Elevator"]);
  });

  it("calls onDeleteRequest when delete icon is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TeamSettingsDialog {...mockProps} />);

    const deleteButton = screen.getByLabelText(/delete team/i);
    await user.click(deleteButton);
    expect(mockProps.onDeleteRequest).toHaveBeenCalled();
  });

  it("calls onSave when save button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TeamSettingsDialog {...mockProps} />);

    const saveButton = screen.getByRole("button", { name: /save/i });
    await user.click(saveButton);
    expect(mockProps.onSave).toHaveBeenCalled();
  });

  it("calls onClose when cancel button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TeamSettingsDialog {...mockProps} />);

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);
    expect(mockProps.onClose).toHaveBeenCalled();
  });
});
