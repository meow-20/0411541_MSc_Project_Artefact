import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const FingerprintSuccessScreen = () => {
  const navigation = useNavigation();

  const handleEnrollNewCustomer = () => {
    // Navigate back to VerifyFingerprintScreen or registration screen
    navigation.navigate("Verify"); 
  };

  const handlePayment = () => {
    // Navigate to payment screen
    navigation.navigate("Payment"); // or your payment screen name
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Success!</Text>
        <Text style={styles.message}>
          Fingerprint successfully registered
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#008000" }]}
          onPress={handleEnrollNewCustomer}
        >
          <Text style={styles.buttonText}>Enroll New Customer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#5b21b6" }]}
          onPress={handlePayment}
        >
          <Text style={styles.buttonText}>Payment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#008000",
    marginBottom: 16,
  },
  message: {
    fontSize: 18,
    color: "#333",
    textAlign: "center",
  },
  buttonContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default FingerprintSuccessScreen;