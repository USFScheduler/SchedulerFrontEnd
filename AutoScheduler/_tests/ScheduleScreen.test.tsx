import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import ScheduleScreen from "../app/schedule";
import * as ExpoRouter from "expo-router";

// Mock alert so it doesn't crash in Node environment (CI)
global.alert = jest.fn();

jest.mock('axios');

// Mock expo-router
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => "/schedule"),
}));

/*
// Mock axios to avoid real HTTP requests in tests
jest.mock("axios", () => ({
  __esModule: true,
  default: {
    post: jest.fn(() => Promise.resolve({ data: {} })),
    isAxiosError: () => true,
  },
}));
*/

describe("ScheduleScreen", () => {
  beforeEach(() => {
    // Assign mock push function before each test
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
    const nameInput = getByPlaceholderText("Event Name");
    fireEvent.changeText(nameInput, "English Class");
    expect(nameInput.props.value).toBe("English Class");
  });

  it("navigates on Finalize Schedule", async () => {
    const mockPush = jest.fn();
    (ExpoRouter.useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    const { getByText } = render(<ScheduleScreen />);
    fireEvent.press(getByText("Finalize Schedule"));

    //Wait for navigation after async submission
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/finalize");
    });
  });
});
