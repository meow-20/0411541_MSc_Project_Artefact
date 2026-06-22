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

const CardDetailsScreen = ({ navigation }) => {
  const {user, token, login} = useAuth(); // get user and token from auth context

  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [saving, setSaving] = useState(false);

  //   const handleSave = () => {
  //     setSaving(true);
  //     setTimeout(() => {
  //       setSaving(false);
  //       navigation.goBack(); // go back to payment screen
  //     }, 800);
  //   };

  const handleSave = async () => {
  try {
    setSaving(true);

    const cleanNumber = cardNumber.replace(/\s/g, "");
    const formattedExpiry = expiry; // already "MM/YY" from your input logic

    const response = await fetch(`${API_BASE_URL}/user/me/card`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // include your JWT here
      },
      body: JSON.stringify({
        cardNumber: cleanNumber,
        cvv,
        expiryDate: formattedExpiry,
        userName: cardName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log("Save card failed:", errorData);
      return;
    }

    const data = await response.json();
    console.log("Card saved:", data);
    // optional: update auth context with data.user
    login({ user: data.user, token });

    navigation.goBack();
  } catch (err) {
    console.log("Save card error", err);
  } finally {
    setSaving(false);
  }
};

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Add Card</Text>
      <Text style={styles.subtitle}>
        Securely save your card for FingerPay.
      </Text>

      {/* Card preview */}
      <View style={styles.cardPreview}>
        <Text style={styles.cardBrand}>FingerPay Card</Text>
        <Text style={styles.cardNumberPreview}>
          {cardNumber
            ? cardNumber
                .replace(/\s/g, "")
                .replace(/(.{4})/g, "$1 ")
                .trim()
            : "•••• •••• •••• ••••"}
        </Text>
        <View style={styles.cardRow}>
          <View>
            <Text style={styles.cardLabel}>Card Holder</Text>
            <Text style={styles.cardValue}>{cardName || "FULL NAME"}</Text>
          </View>
          <View>
            <Text style={styles.cardLabel}>Expires</Text>
            <Text style={styles.cardValue}>{expiry || "MM/YY"}</Text>
          </View>
        </View>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.inputLabel}>Card Number</Text>
        <TextInput
          style={styles.input}
          placeholder="1234 5678 9012 3456"
          keyboardType="numeric"
          maxLength={19} // 16 digits + 3 spaces
          value={cardNumber}
          onChangeText={(text) => {
            // keep only digits
            const digits = text.replace(/\D/g, "");
            // cut to max 16 digits
            const limited = digits.slice(0, 16);
            // add spaces every 4 digits
            const formatted = limited.replace(/(.{4})/g, "$1 ").trim();
            setCardNumber(formatted);
          }}
        />

        <Text style={styles.inputLabel}>Name on Card</Text>
        <TextInput
          style={styles.input}
          placeholder="John Doe"
          autoCapitalize="words"
          value={cardName}
          onChangeText={setCardName}
        />

        <View style={styles.row}>
          <View style={[styles.col, { marginRight: 8 }]}>
            <Text style={styles.inputLabel}>Expiry</Text>
            <TextInput
              style={styles.input}
              placeholder="MM/YY"
              keyboardType="numeric"
              maxLength={5} // MM/YY
              value={expiry}
              onChangeText={(text) => {
                // keep only digits
                const digits = text.replace(/\D/g, "");

                // limit to 4 digits total (MMYY)
                let limited = digits.slice(0, 4);

                if (limited.length === 0) {
                  setExpiry("");
                  return;
                }

                // handle month
                let mm = limited.slice(0, Math.min(2, limited.length));

                // if only 1 digit and > 1, treat as 0X (e.g. "5" -> "05")
                if (mm.length === 1 && parseInt(mm, 10) > 1) {
                  mm = "0" + mm;
                  limited = mm + limited.slice(1); // adjust rest
                }

                // if we have 2 digits for month, clamp between 01 and 12
                if (mm.length === 2) {
                  let monthNum = parseInt(mm, 10);
                  if (monthNum === 0) {
                    monthNum = 1; // avoid 00
                  }
                  if (monthNum > 12) {
                    monthNum = 12; // cap at 12
                  }
                  mm = monthNum.toString().padStart(2, "0");
                }

                const yy = limited.slice(mm.length); // remaining digits (0–2)

                if (yy.length > 0) {
                  setExpiry(`${mm}/${yy}`);
                } else {
                  setExpiry(mm); // just month typed, no slash yet
                }
              }}
            />
          </View>
          <View style={[styles.col, { marginLeft: 8 }]}>
            <Text style={styles.inputLabel}>CVV</Text>
            <TextInput
              style={styles.input}
              placeholder="123"
              keyboardType="numeric"
              secureTextEntry
              maxLength={3} // hard cap at 3 chars
              value={cvv}
              onChangeText={(text) => {
                // keep only digits, then slice to 3 just in case
                const digits = text.replace(/\D/g, "").slice(0, 3);
                setCvv(digits);
              }}
            />
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? "Saving..." : "Save Card"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.helperText}>
        Your card details are encrypted and stored securely.
      </Text>
    </ScrollView>
  );
};

export default CardDetailsScreen;

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
  cardPreview: {
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
  cardBrand: {
    color: "#e9d5ff", // light lilac
    fontSize: 12,
    marginBottom: 16,
  },
  cardNumberPreview: {
    color: "#f9fafb",
    fontSize: 20,
    letterSpacing: 2,
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardLabel: {
    color: "#e5e7eb",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardValue: {
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
  row: {
    flexDirection: "row",
    marginTop: 8,
  },
  col: {
    flex: 1,
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
