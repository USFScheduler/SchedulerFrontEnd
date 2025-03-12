import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import SignInScreen from "../app/signin";

describe("SignInScreen", () => {
  it("navigates to Register screen when Register is pressed", () => {
    const mockRouter = { push: jest.fn() };
    jest.spyOn(require("expo-router"), "useRouter").mockReturnValue(mockRouter);

    const { getByText } = render(<SignInScreen />);
    fireEvent.press(getByText("Register"));

    expect(mockRouter.push).toHaveBeenCalledWith("/register");
  });
});
