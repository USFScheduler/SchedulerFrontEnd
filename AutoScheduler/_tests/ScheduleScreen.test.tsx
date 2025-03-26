import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ScheduleScreen from "../app/schedule";
import * as ExpoRouter from "expo-router"; 

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => "/schedule"), 
}));


describe("ScheduleScreen", () => {
  beforeEach(() => {
    //Reset and assign fresh mock every time
    (ExpoRouter.useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
    });
  });

  it("renders with one event by default", () => {
    const { getByPlaceholderText } = render(<ScheduleScreen />);
    expect(getByPlaceholderText("Event Name")).toBeTruthy();
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
