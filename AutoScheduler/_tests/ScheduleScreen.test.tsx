import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ScheduleScreen from "../app/schedule";
import * as ExpoRouter from "expo-router";

// ✅ Mock alert (fixes CI crash due to alert being undefined)
global.alert = jest.fn();

// ✅ Mock expo-router hooks
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => "/schedule"),
}));

// ✅ Mock Axios to prevent real network calls in CI
jest.mock("axios", () => ({
  __esModule: true,
  default: {
    post: jest.fn(() => Promise.resolve({ data: {} })),
    isAxiosError: () => true,
  },
}));

describe("ScheduleScreen", () => {
  beforeEach(() => {
    // Assign mock router for every test
    (ExpoRouter.useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
    });
  });

  it("renders with one event by default", () => {
    const { getByPlaceholderText } = render(<ScheduleScreen />);
    expect(getByPlaceholderText("Event Name")).toBeTruthy();
    expect(getByPlaceholderText("Start Time (HH:MM)")).toBeTruthy();
    expect(getByPlaceholderText("End Time (HH:MM)")).toBeTruthy();
  });

  it("adds a new event when Add Another Event is pressed", () => {
    const { getAllByPlaceholderText, getByText } = render(<ScheduleScreen />);
    fireEvent.press(getByText("Add Another Event"));
    expect(getAllByPlaceholderText("Event Name").length).toBe(2);
  });

  it("updates event text fields", () => {
    const { getByPlaceholderText } = render(<ScheduleScreen />);
    const name = getByPlaceholderText("Event Name");
    fireEvent.changeText(name, "English Class");
    expect(name.props.value).toBe("English Class");
  });

  it("navigates on Finalize Schedule", () => {
    const mockPush = jest.fn();
    (ExpoRouter.useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    const { getByText } = render(<ScheduleScreen />);
    fireEvent.press(getByText("Finalize Schedule"));
    expect(mockPush).toHaveBeenCalledWith("/finalize");
  });
});
