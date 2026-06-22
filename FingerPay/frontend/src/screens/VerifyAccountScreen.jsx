// VerifyAccountScreen.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { OtpInput } from "react-native-otp-entry";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/env";
import { useNavigation } from "@react-navigation/native";

const VerifyAccountScreen = () => {
  const navigation = useNavigation();
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [biometricVerified, setBiometricVerified] = useState(false);
  const [defaultPayment, setDefaultPayment] = useState("card");

  const { user, token, login } = useAuth();

  const [emailCode, setEmailCode] = useState("");
  const [emailVerified, setEmailVerified] = useState(user?.emailVerified);

  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const primaryCard = user?.cardDetails;
  const primaryBank = user?.accountDetails;

  console.log('user on verify: ',user);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/user/me`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        // console.log("Me response:", data);

        if (res.ok && data.user) {
          // reuse login so AuthContext + AsyncStorage get updated
          login({ user: data.user, token });
        }
      } catch (e) {
        console.log("Error fetching /user/me:", e);
      }
    };

    if (token) {
      fetchUser();
    }
  }, [token]);

  const handleCardPress = () => {
    if (primaryCard) {
      // Card already saved – do nothing or show a message

      Alert.alert("Card already saved", "You already have a primary card on file.");
      return;
    }

    navigation.navigate("CardDetailsScreen");
  };

  const handleBankPress = () => {
    const primaryBank = user?.accountDetails;
    if (primaryBank && primaryBank.accountNumber && primaryBank.sortCode) {
      // Bank account already saved – do nothing or show a message
      Alert.alert("Bank account already saved", "You already have a primary bank account on file.");
      return;
    }

    navigation.navigate("BankDetailsScreen");
  };

  const handleSendEmailCode = async () => {
    try {
      setSending(true);

      const url = `${API_BASE_URL}/auth/send-email-code`;
      console.log("Sending to URL:", url);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      console.log("Status:", res.status);

      let text = await res.text(); // read raw text first
      console.log("Raw response text:", text);

      let data = null;
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = null;
      }

      if (!res.ok) {
        throw new Error((data && data.message) || "Failed to send code");
      }

      Alert.alert("Code sent", `We sent a code to ${user.email}.`);
    } catch (err) {
      console.log("send-email-code catch error:", err.message);
      Alert.alert("Error", err.message || "Could not send verification code.");
    } finally {
      setSending(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (emailCode.length !== 6) {
      Alert.alert("Invalid", "Please enter the 6‑digit code.");
      return;
    }

    try {
      setVerifying(true);

      const res = await fetch(`${API_BASE_URL}/auth/verify-email-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, code: emailCode }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "Failed to verify code");
      }
      if (res.data.success) {
        setUser(res.data.user); // update context
        setEmailVerified(res.data.user.emailVerified); // local state if you need it
      }

      Alert.alert("Success", data?.message || "Email verified.");
    } catch (err) {
      console.log(err.message);
      Alert.alert("Error", err.message || "Could not verify email.");
    } finally {
      setVerifying(false);
    }
  };

  // // TODO: call backend to send SMS code
  // const handleSendPhoneCode = () => {
  //   Alert.alert("Code sent", "A verification code was sent to your phone.");
  // };

  // // TODO: call backend to verify phone code
  // const handleVerifyPhone = () => {
  //   if (phoneCode.length === 6) {
  //     setPhoneVerified(true);
  //     Alert.alert("Phone verified", "Your phone number has been verified.");
  //   } else {
  //     Alert.alert("Invalid code", "Please enter the 6‑digit code.");
  //   }
  // };

  const handleVerifyBiometric = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const supported =
        await LocalAuthentication.supportedAuthenticationTypesAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || supported.length === 0 || !enrolled) {
        Alert.alert(
          "Not available",
          "Biometric authentication is not set up on this device.",
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Verify your identity",
        cancelLabel: "Cancel",
      });

      if (result.success) {
        setBiometricVerified(true);
        Alert.alert(
          "Biometric verified",
          "Biometric authentication successful.",
        );
        // TODO: call backend to set biometricEnabled for this user
        try {
          const res = await fetch(`${API_BASE_URL}/user/me`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await res.json();
          if (res.ok && data.user) {
            // Update user in auth context
            login({ user: data.user, token });
          }
        } catch (e) {
          console.log("Error fetching user after biometric verification:", e);
        }
      } else {
        Alert.alert("Failed", "Biometric authentication failed.");
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Could not run biometric authentication.");
    }
  };

  const handleSaveDefaultPayment = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/me/default-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ defaultPayment }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save default payment method");
      }

      // Update user in auth context
      login({ user: data.user, token });

      Alert.alert(
        "Saved",
        `Default payment method set to ${
          defaultPayment === "card" ? "Card" : "Bank account"
        }.`,
      );
    } catch (err) {
      console.log(err.message);
      Alert.alert("Error", err.message || "Could not save default payment method.");
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Verify your account</Text>
      <Text style={styles.subtitle}>
        Complete these steps to fully secure your account.
      </Text>

      {/* Email verification */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {emailVerified ? `E-mail:` : `Verify Email`}
          </Text>
          {emailVerified && <Text style={styles.badge}>Verified</Text>}
        </View>

        <Text style={styles.sectionDesc}>
          {emailVerified
            ? `${user?.email}`
            : `Enter the 6‑digit code sent to ${user?.email}.`}
        </Text>

        {!emailVerified && (
          <>
            <OtpInput
              numberOfDigits={6}
              onTextChange={setEmailCode}
              focusColor="#5b21b6"
              autoFocus={false}
              theme={{
                pinCodeContainerStyle: styles.otpBox,
                pinCodeTextStyle: styles.otpText,
              }}
            />

            <View style={styles.row}>
              <TouchableOpacity
                onPress={handleSendEmailCode}
                disabled={sending}
              >
                <Text style={styles.linkText}>
                  {sending ? "Sending..." : "Send / Resend code"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleVerifyEmail}
                disabled={verifying}
              >
                <Text style={styles.primaryButtonText}>
                  {verifying ? "Verifying..." : "Verify email"}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Phone verification */}

      {/* Biometric verification */}
      {/* <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Biometric verification</Text>
          {biometricVerified && <Text style={styles.badge}>Enabled</Text>}
        </View>

        <Text style={styles.sectionDesc}>
          Use your device’s fingerprint or face sensor to secure quick logins.
        </Text>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleVerifyBiometric}
        >
          <Text style={styles.secondaryButtonText}>
            Verify with device biometrics
          </Text>
        </TouchableOpacity>
      </View> */}

      {/* Default payment method */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Default payment method</Text>
        <Text style={styles.sectionDesc}>
          Choose how you want to add funds by default.
        </Text>

        <View style={styles.paymentOptions}>
          <TouchableOpacity
            style={[
              styles.paymentOption,
              defaultPayment === "card" && styles.paymentOptionActive,
            ]}
            onPress={handleCardPress}
          >
            <Text
              style={[
                styles.paymentOptionText,
                defaultPayment === "card" && styles.paymentOptionTextActive,
              ]}
            >
              Card
            </Text>

            {primaryCard?.cardNumber ? (
              <>
                <Text style={styles.paymentOptionSub}>Primary card</Text>
                <Text style={[styles.paymentOptionSub, { fontWeight: "bold" }]}>
                  Visa * * * * {primaryCard.cardNumber.slice(-4)}
                </Text>
                <Text style={styles.paymentOptionSub}>
                  Expires {primaryCard.expiryDate}
                </Text>
              </>
            ) : (
              <Text style={styles.paymentOptionSub}>
                Visa / Mastercard / Debit
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              defaultPayment === "bank" && styles.paymentOptionActive,
            ]}
            onPress={handleBankPress}
          >
            <Text
              style={[
                styles.paymentOptionText,
                defaultPayment === "bank" && styles.paymentOptionTextActive,
              ]}
            >
              Bank account
            </Text>
            {user?.accountDetails?.accountNumber && user?.accountDetails?.sortCode ? (
              <>
                <Text style={styles.paymentOptionSub}>Primary bank</Text>
                <Text style={[styles.paymentOptionSub, { fontWeight: "bold" }]}>
                  {/* Show last 4 digits of account number */}
                  **** {user.accountDetails.accountNumber.slice(-4)}
                </Text>
                <Text style={styles.paymentOptionSub}>
                  {/* Show bank name */}
                  {user.accountDetails.bankName}
                </Text>
              </>
            ) : (
              <Text style={styles.paymentOptionSub}>
                UK bank transfer or direct debit
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity
        style={styles.primaryButtonFull}
        onPress={handleSaveDefaultPayment}
      >
        <Text style={styles.primaryButtonText}>Verify Now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 30,
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  contentContainer: { padding: 16, paddingBottom: 32 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
  },
  section: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  sectionDesc: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 12,
  },
  badge: {
    fontSize: 12,
    color: "#16a34a",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    fontWeight: "600",
  },
  otpBox: {
    width: 40,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginHorizontal: 4,
    backgroundColor: "#f9fafb",
  },
  otpText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  row: {
    flexDirection: "row",
    marginTop: 12,
    justifyContent: "space-between",
    alignItems: "center",
  },
  linkText: {
    fontSize: 13,
    color: "#5b21b6",
    fontWeight: "500",
  },
  primaryButton: {
    backgroundColor: "#5b21b6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  primaryButtonFull: {
    backgroundColor: "#5b21b6",
    paddingVertical: 12,
    borderRadius: 999,
    marginTop: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryButton: {
    borderColor: "#5b21b6",
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 4,
  },
  secondaryButtonText: {
    color: "#5b21b6",
    fontSize: 14,
    fontWeight: "600",
  },
  paymentOptions: {
    marginTop: 8,
    gap: 8,
  },
  paymentOption: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
  },
  paymentOptionActive: {
    borderColor: "#5b21b6",
    backgroundColor: "#eef2ff",
  },
  paymentOptionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  paymentOptionTextActive: {
    color: "#5b21b6",
  },
  paymentOptionSub: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
});

export default VerifyAccountScreen;
