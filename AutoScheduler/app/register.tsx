import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import axios, { AxiosError } from "axios";

const RegisterScreen: React.FC = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleRegister = async () => {
    setErrorMessage(""); // Clear any previous errors

    try {
      const response = await axios.post("http://127.0.0.1:3000/users", {
        user: { name, password, email },
      });

      if (response.status === 201) {
        // Registration successful -> navigate to schedule screen
        router.push("/schedule");
      }
    } catch (error) {
      //Correctly handle Axios errors
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error: string }>;
        setErrorMessage(axiosError.response?.data?.error || "Registration failed. Try again.");
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AutoScheduler</Text>
      <Text style={styles.subtitle}>Create an account</Text>
 
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#999"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
      />

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/signin")} style={styles.registerButton}>
        <Text style={styles.registerText}>Back to Sign In</Text>
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
  error: { color: "red", marginTop: 10 }, // Error styling
});

export default RegisterScreen;
