import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { API_BASE_URL } from "../config/env";
import { useAuth } from "../context/AuthContext";

const BankDetailsScreen = ({ navigation }) => {
  const { user, token, login } = useAuth(); // get user and token from auth context

  const [sortCode, setSortCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      // sortCode is like "12-34-56" in state
      const cleanSortCode = sortCode.replace(/\D/g, ""); // remove dashes and any non-digits
      const cleanAccountNumber = accountNumber.replace(/\D/g, "");

      console.log("Sending sort code:", cleanSortCode); // should log "123456"
      console.log("Sending account number:", cleanAccountNumber); // should log "12345678"

      const response = await fetch(`${API_BASE_URL}/bank/me/account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // include your JWT here
        },
        body: JSON.stringify({
          sortCode: cleanSortCode,
          accountNumber: cleanAccountNumber,
          userName: accountName,
          bankName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log("Save bank details failed:", errorData);
        return;
      }

      const data = await response.json();
      console.log("Bank details saved:", data);
      // Update auth context with the updated user data
      login({ user: data.user, token });

      navigation.goBack();
    } catch (err) {
      console.log("Save bank details error", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Add Bank Account</Text>
      <Text style={styles.subtitle}>
        Securely save your bank account for FingerPay.
      </Text>

      {/* Bank preview */}
      <View style={styles.bankPreview}>
        <Text style={styles.bankBrand}>FingerPay Bank</Text>
        <View style={styles.bankRow}>
          <View>
            <Text style={styles.bankLabel}>Account Holder</Text>
            <Text style={styles.bankValue}>{accountName || "FULL NAME"}</Text>
          </View>
          <View>
            <Text style={styles.bankLabel}>Bank</Text>
            <Text style={styles.bankValue}>{bankName || "BANK NAME"}</Text>
          </View>
        </View>
        <View style={styles.bankRow}>
          <View>
            <Text style={styles.bankLabel}>Sort Code</Text>
            <Text style={styles.bankValue}>
              {sortCode
                ? sortCode
                    .replace(/\s/g, "")
                    .replace(/(\d{2})/g, "$1-")
                    .trim()
                : "-- -- --"}
            </Text>

            <Text style={styles.bankLabel}>Account No.</Text>
            <Text style={styles.bankValue}>
              {accountNumber
                ? accountNumber
                    .replace(/\s/g, "")
                    .replace(/(\d{4})/g, "$1 ")
                    .trim()
                : "--------"}
            </Text>
          </View>
        </View>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.inputLabel}>Sort Code</Text>
        <TextInput
          style={styles.input}
          placeholder="12-34-56"
          keyboardType="numeric"
          maxLength={8} // 6 digits + 2 dashes
          value={sortCode}
          onChangeText={(text) => {
            const digits = text.replace(/\D/g, "");
            const limited = digits.slice(0, 6);
            const formatted = limited.replace(/(\d{2})/g, "$1-").trim();
            setSortCode(formatted);
          }}
        />

        <Text style={styles.inputLabel}>Account Number</Text>
        <TextInput
          style={styles.input}
          placeholder="12345678"
          keyboardType="numeric"
          maxLength={9} // 8 digits
          value={accountNumber}
          onChangeText={(text) => {
            const digits = text.replace(/\D/g, "");
            const limited = digits.slice(0, 8);
            const formatted = limited.replace(/(\d{4})/g, "$1 ").trim();
            setAccountNumber(formatted);
          }}
        />

        <Text style={styles.inputLabel}>Account Name</Text>
        <TextInput
          style={styles.input}
          placeholder="John Doe"
          autoCapitalize="words"
          value={accountName}
          onChangeText={setAccountName}
        />

        <Text style={styles.inputLabel}>Bank Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Barclays / HSBC etc."
          autoCapitalize="words"
          value={bankName}
          onChangeText={setBankName}
        />
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? "Saving..." : "Save Bank Account"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.helperText}>
        Your bank details are encrypted and stored securely.
      </Text>
    </ScrollView>
  );
};

export default BankDetailsScreen;

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827", // dark text on light bg
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280", // grey
    marginBottom: 20,
  },
  bankPreview: {
    backgroundColor: "#5b21b6", // primary
    borderRadius: 18,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#4c1d95",

    // "card floating" feel
    elevation: 12,

    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  bankBrand: {
    color: "#e9d5ff", // light lilac
    fontSize: 12,
    marginBottom: 16,
  },
  bankRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bankLabel: {
    color: "#e5e7eb",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  bankValue: {
    color: "#f9fafb",
    fontSize: 14,
    marginTop: 4,
  },
  form: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginTop: 4,
  },
  inputLabel: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#d1d5db", // light grey
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#111827",
    fontSize: 14,
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: "#5b21b6",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#f9fafb",
    fontSize: 16,
    fontWeight: "600",
  },
  helperText: {
    marginTop: 8,
    color: "#9ca3af",
    fontSize: 12,
    textAlign: "center",
  },
});
