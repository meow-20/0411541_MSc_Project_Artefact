import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../config/env";

const VerifyFingerprintScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [foundUser, setFoundUser] = useState(null);

  const handleConfirm = async () => {
    setError(null);
    setFoundUser(null);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError("Please enter both email and password.");
      return;
    }

    const emailPattern = /\S+@\S+\.\S+/;
    if (!emailPattern.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/user/verify-credentials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password: trimmedPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid email or password");
      }

      if (!data.user) {
        throw new Error("User not found");
      }

      setFoundUser(data.user);
    } catch (e) {
      setError(e.message || "Failed to verify user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPress = async () => {
    setError(null);

    if (!foundUser?.id) {
      setError("Please find the user first.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/biometric/enroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: foundUser.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to trigger fingerprint enroll");
      }

      navigation.navigate("FingerprintSuccess");
    } catch (e) {
      setError(e.message || "Fingerprint verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="finger-print-outline" size={30} color="#FFFFFF" />
            </View>

            <Text style={styles.heroEyebrow}>Merchant verification</Text>
            <Text style={styles.title}>Verify customer fingerprint</Text>
            <Text style={styles.subtitle}>
              Confirm the customer account first, then continue with biometric
              enrollment for secure FingerPay access.
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.inputBlock}>
              <Text style={styles.label}>Customer email</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="customer@example.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.label}>Customer password</Text>
              <View style={styles.inputWrap}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color="#6B7280"
                />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {error ? (
              <View style={styles.errorCard}>
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color="#DC2626"
                />
                <Text style={styles.error}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.findButton,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="search-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Find customer</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {foundUser && (
            <View style={styles.userCard}>
              <View style={styles.userCardHeader}>
                <Text style={styles.userCardEyebrow}>Matched customer</Text>
                <View style={styles.verifiedChip}>
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color="#16A34A"
                  />
                  <Text style={styles.verifiedChipText}>Ready</Text>
                </View>
              </View>

              <View style={styles.userMainRow}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {foundUser.name
                      ? foundUser.name.charAt(0).toUpperCase()
                      : "U"}
                  </Text>
                </View>

                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {foundUser.name || "FingerPay User"}
                  </Text>
                  <Text style={styles.userEmail}>{foundUser.email}</Text>
                </View>
              </View>

              <View style={styles.userMetaRow}>
                <View style={styles.metaBadge}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={14}
                    color="#6D28D9"
                  />
                  <Text style={styles.metaBadgeText}>Identity confirmed</Text>
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.verifyButton,
              (!foundUser || loading) && styles.buttonDisabled,
            ]}
            onPress={handleVerifyPress}
            disabled={loading || !foundUser}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <View style={styles.verifyIconWrap}>
                  <Ionicons
                    name="finger-print-outline"
                    size={22}
                    color="#FFFFFF"
                  />
                </View>
                <View>
                  <Text style={styles.verifyButtonTitle}>
                    Start fingerprint verification
                  </Text>
                  <Text style={styles.verifyButtonSubtitle}>
                    Continue biometric enrollment for this customer
                  </Text>
                </View>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default VerifyFingerprintScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F172A",
  },

  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 36,
  },

  heroCard: {
    backgroundColor: "#0F172A",
    borderRadius: 30,
    padding: 22,
    marginBottom: 18,
    shadowColor: "#0F172A",
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 28,
    elevation: 8,
  },

  heroIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#6D28D9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  heroEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: "#C4B5FD",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: "#CBD5E1",
  },

  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#EDE9FE",
  },

  inputBlock: {
    marginBottom: 14,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 8,
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 14,
    minHeight: 56,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    paddingVertical: 14,
    marginLeft: 10,
  },

  errorCard: {
    marginBottom: 14,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
  },

  error: {
    flex: 1,
    color: "#B91C1C",
    fontSize: 13,
    lineHeight: 19,
  },

  findButton: {
    backgroundColor: "#16A34A",
    minHeight: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },

  verifyButton: {
    backgroundColor: "#0F172A",
    minHeight: 76,
    borderRadius: 24,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: "#6D28D9",
  },

  verifyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#6D28D9",
    justifyContent: "center",
    alignItems: "center",
  },

  verifyButtonTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 2,
  },

  verifyButtonSubtitle: {
    fontSize: 12,
    color: "#DDD6FE",
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  userCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#EDE9FE",
  },

  userCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  userCardEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  verifiedChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF3",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },

  verifiedChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#15803D",
  },

  userMainRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#6D28D9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  userAvatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },

  userInfo: {
    flex: 1,
  },

  userName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },

  userEmail: {
    fontSize: 13,
    color: "#64748B",
  },

  userMetaRow: {
    marginTop: 14,
  },

  metaBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F3FF",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 6,
  },

  metaBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6D28D9",
  },
});