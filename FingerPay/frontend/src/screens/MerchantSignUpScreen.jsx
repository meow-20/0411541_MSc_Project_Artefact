import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/env";
import { isNotEmpty, isValidEmail } from "../utils/validation";
import { useNavigation } from "@react-navigation/native";

const MerchantSignUpScreen = () => {
  const [companyName, setCompanyName] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [VATNumber, setVATNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { login } = useAuth();
  const navigation = useNavigation();

  const handleSignUp = async () => {
    if (!isNotEmpty(companyName)) {
      Alert.alert("Error", "Please enter company name");
      return;
    }
    if (!isNotEmpty(merchantName)) {
      Alert.alert("Error", "Please enter merchant name");
      return;
    }
    if (!isNotEmpty(email)) {
      Alert.alert("Error", "Please enter an email");
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert("Error", "Please enter a valid email");
      return;
    }
    if (!isNotEmpty(phoneNumber)) {
      Alert.alert("Error", "Please enter phone number");
      return;
    }
    if (!isNotEmpty(VATNumber)) {
      Alert.alert("Error", "Please enter VAT number");
      return;
    }
    if (!isNotEmpty(licenseNumber)) {
      Alert.alert("Error", "Please enter license number");
      return;
    }
    if (!isNotEmpty(password)) {
      Alert.alert("Error", "Please enter a password");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/merchant/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company_name: companyName,
          merchant_name: merchantName,
          email,
          password,
          phone_number: phoneNumber,
          VAT_number: VATNumber,
          license_number: licenseNumber,
          address: "",
          bank_details: {},
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Registration failed");
      }

      const data = await response.json();

      login({
        user: {
          id: data.id,
          email: data.email,
          name: data.merchant_name,
          company_name: data.company_name,
          merchant_name: data.merchant_name,
          phone_number: data.phone_number,
          VAT_number: data.VAT_number,
          license_number: data.license_number,
          balance: data.balance,
        },
        token: data.token,
        role: "merchant",
      });

      navigation.replace("PaymentScreen");
    } catch (error) {
      Alert.alert("Registration failed", error.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    navigation.navigate("MerchantLoginScreen");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.topBadge}>
            <Ionicons name="briefcase-outline" size={14} color="#C7D2FE" />
            <Text style={styles.topBadgeText}>Merchant Onboarding</Text>
          </View>

          <View style={styles.logoWrap}>
            <Image
              source={require("../../assets/logo.png")}
              style={styles.logo}
            />
          </View>

          <Text style={styles.heroTitle}>Create your business account</Text>
          <Text style={styles.heroSubtitle}>
            Register your merchant profile and start accepting secure payments with FingerPay.
          </Text>

          <View style={styles.heroPills}>
            <View style={styles.heroPill}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#E0E7FF" />
              <Text style={styles.heroPillText}>Trusted onboarding</Text>
            </View>
            <View style={styles.heroPill}>
              <Ionicons name="document-text-outline" size={14} color="#E0E7FF" />
              <Text style={styles.heroPillText}>Business verification</Text>
            </View>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Merchant registration</Text>
          <Text style={styles.formSubtitle}>
            Fill in your business and contact details to set up your merchant account
          </Text>

          <Text style={styles.sectionTitle}>Business details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business name</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="business-outline" size={18} color="#6B7280" />
              <TextInput
                placeholder="Enter your business name"
                placeholderTextColor="#9CA3AF"
                value={companyName}
                onChangeText={setCompanyName}
                autoCapitalize="words"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Merchant display name</Text>
            <View style={styles.inputWrap}>
              <MaterialIcons name="storefront" size={24} color="#6B7280" />
              <TextInput
                placeholder="Enter your merchant display name"
                placeholderTextColor="#9CA3AF"
                value={merchantName}
                onChangeText={setMerchantName}
                autoCapitalize="words"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business email</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color="#6B7280" />
              <TextInput
                placeholder="Enter your business email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone number</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="call-outline" size={18} color="#6B7280" />
              <TextInput
                placeholder="Enter your phone number"
                placeholderTextColor="#9CA3AF"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfInput]}>
              <Text style={styles.label}>VAT number</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="receipt-outline" size={18} color="#6B7280" />
                <TextInput
                  placeholder="Enter VAT number"
                  placeholderTextColor="#9CA3AF"
                  value={VATNumber}
                  onChangeText={setVATNumber}
                  autoCapitalize="characters"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, styles.halfInput]}>
              <Text style={styles.label}>License number</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="document-outline" size={18} color="#6B7280" />
                <TextInput
                  placeholder="Enter license number"
                  placeholderTextColor="#9CA3AF"
                  value={licenseNumber}
                  onChangeText={setLicenseNumber}
                  autoCapitalize="characters"
                  style={styles.input}
                />
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Security</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color="#6B7280" />
              <TextInput
                placeholder="Create a password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={styles.input}
              />
              <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#6B7280" />
              <TextInput
                placeholder="Confirm your password"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                style={styles.input}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword((prev) => !prev)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.helperCard}>
            <Ionicons name="information-circle-outline" size={18} color="#2563EB" />
            <Text style={styles.helperText}>
              Your business details help verify your merchant account and enable secure payment acceptance.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
            onPress={handleSignUp}
            activeOpacity={0.9}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.signUpButtonText}>Create merchant account</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have a merchant account?</Text>
            <TouchableOpacity onPress={handleLogin}>
              <Text style={styles.loginLinkText}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MerchantSignUpScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#EEF2F7",
  },
  screen: {
    flex: 1,
    backgroundColor: "#EEF2F7",
  },
  content: {
    flexGrow: 1,
    paddingBottom: 28,
  },
  hero: {
    backgroundColor: "#0F172A",
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 42,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  topBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 18,
  },
  topBadgeText: {
    color: "#C7D2FE",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  logoWrap: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
    alignSelf: "center",
  },
  logo: {
    width: 56,
    height: 56,
    tintColor: "#FFFFFF",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#CBD5E1",
    lineHeight: 21,
    paddingHorizontal: 10,
  },
  heroPills: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 18,
    flexWrap: "wrap",
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  heroPillText: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "600",
  },
  formCard: {
    marginTop: -18,
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 20,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 10,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 21,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 12,
    marginTop: 6,
  },
  inputGroup: {
    marginBottom: 14,
  },
  row: {
    flexDirection: "column",
  },
  halfInput: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
    color: "#374151",
  },
  inputWrap: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 18,
    paddingHorizontal: 14,
    backgroundColor: "#F9FAFB",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
  },
  helperCard: {
    marginTop: 4,
    marginBottom: 18,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  helperText: {
    flex: 1,
    color: "#1D4ED8",
    fontSize: 13,
    lineHeight: 19,
  },
  signUpButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  signUpButtonDisabled: {
    opacity: 0.75,
  },
  signUpButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 18,
    gap: 6,
  },
  loginText: {
    fontSize: 14,
    color: "#6B7280",
  },
  loginLinkText: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "700",
  },
});