import { useTheme } from "../components/ThemeContext"; 

export function useDynamicStyles() {
  const { darkMode } = useTheme();

  const backgroundColor = darkMode ? "#121212" : "#f4f4f4"; // dark background vs light
  const cardColor = darkMode ? "#1e1e1e" : "white";         // card color
  const textColor = darkMode ? "#ffffff" : "#000000";       // main text
  const subTextColor = darkMode ? "#cccccc" : "#555555";    // lighter text
  const borderColor = darkMode ? "#333333" : "#ccc";        // input borders
  const buttonBackground = darkMode ? "#ffffff" : "#000000";
  const buttonText = darkMode ? "#000000" : "#ffffff";

  return {
    backgroundColor,
    cardColor,
    textColor,
    subTextColor,
    borderColor,
    buttonBackground,
    buttonText,
  };
}
