import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import RegisterScreen from "../app/register";

describe("RegisterScreen", () => {
  it("updates username and password fields when user types", () => {
    const { getByPlaceholderText, getByDisplayValue } = render(<RegisterScreen />);

    const usernameInput = getByPlaceholderText("Username");
    const passwordInput = getByPlaceholderText("Password");

    fireEvent.changeText(usernameInput, "newuser");
    fireEvent.changeText(passwordInput, "securepass");

    expect(getByDisplayValue("newuser")).toBeTruthy();
    expect(getByDisplayValue("securepass")).toBeTruthy();
  });

  it("navigates to sign-in screen when Back to Sign In is pressed", () => {
    const mockRouter = { push: jest.fn() };
    jest.spyOn(require("expo-router"), "useRouter").mockReturnValue(mockRouter);

    const { getByText } = render(<RegisterScreen />);
    fireEvent.press(getByText("Back to Sign In"));

    expect(mockRouter.push).toHaveBeenCalledWith("/signin");
  });
});