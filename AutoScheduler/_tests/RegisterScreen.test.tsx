import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import RegisterScreen from "../app/register";

describe("RegisterScreen", () => {
  it("updates username, password, and canvas token fields when user types", () => {
    const { getByPlaceholderText, getByDisplayValue } = render(<RegisterScreen />);

    const usernameInput = getByPlaceholderText("Username");
    const passwordInput = getByPlaceholderText("Password");
    const canvasTokenInput = getByPlaceholderText("Enter Canvas Token Here"); //Adding in testing for canvas token

    fireEvent.changeText(usernameInput, "newuser");
    fireEvent.changeText(passwordInput, "securepass");
    fireEvent.changeText(canvasTokenInput, "abc123canvas");

    expect(getByDisplayValue("newuser")).toBeTruthy();
    expect(getByDisplayValue("securepass")).toBeTruthy();
    expect(getByDisplayValue("abc123canvas")).toBeTruthy(); //testing if the canvas token is being updated correctly
  });

  it("navigates to sign-in screen when Back to Sign In is pressed", () => {
    const mockRouter = { push: jest.fn() };
    jest.spyOn(require("expo-router"), "useRouter").mockReturnValue(mockRouter);

    const { getByText } = render(<RegisterScreen />);
    fireEvent.press(getByText("Back to Sign In"));

    expect(mockRouter.push).toHaveBeenCalledWith("/signin");
  });
});
