import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { saveTokens, saveUserId, saveUserInfo } from '../utils/tokenStorage';
import api from "@/api/api";

const SignInScreen = () => {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSignIn2 = async () => {
    try {
      const response = await api.post("/login", {
        name: username,
        password,
      });

      const { access_token, refresh_token, user } = response.data;

      // Save tokens
      await saveTokens(access_token, refresh_token);
      await saveUserId(user.id);
      await saveUserInfo(user.name, user.email);

      router.push("/schedule"); // Redirect to schedule after successful login

    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Invalid credentials. Please try again.");
      } else {
        const errorMessage =
          err?.response?.data?.error ||
          err?.response?.data?.errors ||
          err?.response?.data?.message ||
          "An error occurred. Please try again.";

        setError(errorMessage);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AutoScheduler</Text>
      <Text style={styles.subtitle}>Sign In</Text>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#999"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity style={styles.button} onPress={handleSignIn2}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/register")} style={styles.registerButton}>
        <Text style={styles.registerText}>Register</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 20 },
  input: { width: "100%", padding: 10, borderWidth: 1, borderColor: "#ccc", borderRadius: 5, marginBottom: 10 },
  button: { backgroundColor: "black", padding: 10, borderRadius: 5, width: "100%", alignItems: "center", marginTop: 10 },
  buttonText: { color: "white", fontSize: 16 },
  registerButton: { marginTop: 20 },
  registerText: { color: "black", fontSize: 14 },
  errorText: { color: "red", marginBottom: 10 },
});

export default SignInScreen;
