import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Animated,
  Easing,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/env";
import { useNavigation } from "@react-navigation/native";

const PaymentScreen = () => {
  const { user, token, login, logout } = useAuth();
  const navigation = useNavigation();

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [successData, setSuccessData] = useState(null);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  const [showErrorOverlay, setShowErrorOverlay] = useState(false);
  const [errorModalData, setErrorModalData] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/merchant/me`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) return;

      const data = await res.json();
      if (data.user) {
        login({ user: data.user, token, role: "merchant" });
      }
    } catch (e) {
      console.error("Failed to refresh merchant:", e);
    }
  };

  const handleAmountChange = (text) => {
    let cleaned = text.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");

    if (parts.length > 2) {
      cleaned = parts[0] + "." + parts[1];
    }

    if (parts.length === 2) {
      const integerPart = parts[0];
      const decimalPart = parts[1].slice(0, 2);
      cleaned = integerPart + "." + decimalPart;
    }

    setAmount(cleaned);
  };

  const handleLogout = async () => {
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: "Auth" }],
    });
  };

  const handleFingerprintPress = async () => {
    setError(null);

    try {
      setLoading(true);

      const verifyRes = await fetch(`${API_BASE_URL}/biometric/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "Verification failed");
      }

      if (verifyData.verified) {
        try {
          const userRes = await fetch(
            `${API_BASE_URL}/user/${verifyData.user.id}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            },
          );

          const userData = await userRes.json();

          if (!userRes.ok) {
            throw new Error(userData.error || "Failed to fetch user");
          }

          const paymentAmount = parseFloat(amount);

          if (!paymentAmount || paymentAmount <= 0) {
            throw new Error("Please enter a valid amount");
          }

          if (paymentAmount > userData.balance) {
            setErrorModalData({
              title: "Insufficient Balance",
              message:
                "This payment could not be completed because the customer does not have enough available funds.",
              amount: paymentAmount,
            });
            setShowErrorOverlay(true);
            return;
          }

          const transactionRes = await fetch(
            `${API_BASE_URL}/transactions/process`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: userData.id,
                amount: paymentAmount,
                merchantId: user.id,
              }),
            },
          );

          const transactionData = await transactionRes.json();

          if (!transactionRes.ok) {
            throw new Error(transactionData.error || "Transaction failed");
          }

          setSuccessData({
            amount: paymentAmount,
            newBalance: transactionData.newBalance,
          });

          setShowSuccessOverlay(true);

          fadeAnim.setValue(0);
          scaleAnim.setValue(0.92);

          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 280,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 320,
              easing: Easing.out(Easing.back(1.2)),
              useNativeDriver: true,
            }),
          ]).start();

          setTimeout(() => {
            Animated.parallel([
              Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 220,
                easing: Easing.in(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.timing(scaleAnim, {
                toValue: 0.96,
                duration: 220,
                easing: Easing.in(Easing.ease),
                useNativeDriver: true,
              }),
            ]).start(() => {
              setShowSuccessOverlay(false);
              setSuccessData(null);
            });
          }, 5000);

          setAmount("");
        } catch (e) {
          setError(e.message || "Failed to fetch user data");
        }
      }
    } catch (e) {
      setError(
        e.message || "Fingerprint verification failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const merchantName = user?.merchant_name || user?.company_name || user?.name;
  const companyName = user?.company_name || "Merchant Account";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.screen}>
        <View style={styles.darkHeader}>
          <View style={styles.topRow}>
            <View>
              <Text style={styles.brandTitle}>FingerPay</Text>
              <Text style={styles.brandSubtitle}>Merchant terminal</Text>
            </View>

            <TouchableOpacity style={styles.logoutChip} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={16} color="#E5E7EB" />
            </TouchableOpacity>
          </View>

          <View style={styles.merchantCard}>
            <View style={styles.logoWrap}>
              <Image
                source={require("../../assets/logo.png")}
                style={styles.logo}
              />
            </View>

            <View style={styles.merchantTextWrap}>
              <Text style={styles.merchantLabel}>Accepting payments for</Text>
              <Text style={styles.companyName}>{companyName}</Text>
              <Text style={styles.merchantName}>{merchantName}</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.amountCard}>
            <Text style={styles.amountCardLabel}>Payment amount</Text>

            <View style={styles.amountInputWrap}>
              <Text style={styles.currency}>£</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
              />
            </View>

            <Text style={styles.amountHint}>
              Enter the amount, then verify the customer with fingerprint
            </Text>
          </View>

          <View style={styles.quickAmountsRow}>
            {["5", "10", "20", "50"].map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.quickAmountChip}
                onPress={() => setAmount(item)}
              >
                <Text style={styles.quickAmountText}>£{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.payButton, loading && styles.payButtonDisabled]}
            onPress={handleFingerprintPress}
            activeOpacity={0.9}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <View style={styles.payIconWrap}>
                  <Ionicons
                    name="finger-print-outline"
                    size={24}
                    color="#FFFFFF"
                  />
                </View>
                <View>
                  <Text style={styles.payButtonTitle}>Take payment</Text>
                  <Text style={styles.payButtonSubtitle}>
                    Verify fingerprint to complete transaction
                  </Text>
                </View>
              </>
            )}
          </TouchableOpacity>

          {error ? (
            <View style={styles.inlineError}>
              <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
              <Text style={styles.inlineErrorText}>{error}</Text>
            </View>
          ) : null}
        </View>

        <Modal
          visible={showErrorOverlay}
          transparent
          animationType="fade"
          onRequestClose={() => setShowErrorOverlay(false)}
        >
          <View style={styles.overlayContainer}>
            <View style={styles.errorCard}>
              <View style={styles.errorIconWrap}>
                <Ionicons name="close-outline" size={34} color="#DC2626" />
              </View>

              <Text style={styles.errorTitle}>{errorModalData?.title}</Text>
              <Text style={styles.errorSubtitle}>
                {errorModalData?.message}
              </Text>

              <View style={styles.modalAmountCard}>
                <Text style={styles.modalAmountLabel}>Payment amount</Text>
                <Text style={styles.modalAmountValue}>
                  £{errorModalData?.amount}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.errorButton}
                onPress={() => setShowErrorOverlay(false)}
              >
                <Text style={styles.errorButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showSuccessOverlay}
          transparent
          animationType="none"
          onRequestClose={() => setShowSuccessOverlay(false)}
        >
          <View style={styles.overlayContainer}>
            <Animated.View
              style={[
                styles.animatedCardWrap,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.successCard}>
                <View style={styles.successIconWrap}>
                  <Ionicons name="checkmark" size={34} color="#16A34A" />
                </View>

                <Text style={styles.successTitle}>Payment Successful</Text>
                <Text style={styles.successSubtitle}>
                  The fingerprint payment has been completed successfully.
                </Text>

                <View style={styles.modalAmountCard}>
                  <Text style={styles.modalAmountLabel}>Amount paid</Text>
                  <Text style={styles.modalAmountValue}>
                    £{successData?.amount}
                  </Text>
                </View>

                <Text style={styles.overlayHint}>Closing automatically...</Text>
              </View>
            </Animated.View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default PaymentScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F172A",
  },

  screen: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  darkHeader: {
    backgroundColor: "#0F172A",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },

  brandTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  brandSubtitle: {
    fontSize: 13,
    color: "#C4B5FD",
    marginTop: 4,
  },

  logoutChip: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(109, 40, 217, 0.18)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  merchantCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(109, 40, 217, 0.22)",
  },

  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: "#6D28D9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  logo: {
    width: 40,
    height: 40,
    tintColor: "#FFFFFF",
  },

  merchantTextWrap: {
    flex: 1,
  },

  merchantLabel: {
    fontSize: 12,
    color: "#C4B5FD",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  merchantName: {
    fontSize: 13,
    color: "#E5E7EB",
  },

  companyName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 2,
  },

  content: {
    flex: 1,
    padding: 20,
    marginTop: -6,
  },

  amountCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 22,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#EDE9FE",
  },

  amountCardLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6D28D9",
    marginBottom: 16,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  amountInputWrap: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    marginBottom: 10,
  },

  currency: {
    fontSize: 34,
    fontWeight: "800",
    color: "#6D28D9",
    marginRight: 6,
  },

  amountInput: {
    minWidth: 140,
    fontSize: 44,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
  },

  amountHint: {
    fontSize: 13,
    lineHeight: 20,
    color: "#6B7280",
    textAlign: "center",
  },

  quickAmountsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 16,
    marginBottom: 18,
  },

  quickAmountChip: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#F5F3FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },

  quickAmountText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6D28D9",
  },

  payButton: {
    minHeight: 76,
    borderRadius: 24,
    backgroundColor: "#0F172A",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: "#6D28D9",
  },

  payButtonDisabled: {
    opacity: 0.75,
  },

  payIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#6D28D9",
    justifyContent: "center",
    alignItems: "center",
  },

  payButtonTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 2,
  },

  payButtonSubtitle: {
    fontSize: 12,
    color: "#DDD6FE",
  },

  inlineError: {
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: "#FEF2F2",
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
  },

  inlineErrorText: {
    flex: 1,
    color: "#B91C1C",
    fontSize: 13,
    lineHeight: 19,
  },

  overlayContainer: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  animatedCardWrap: {
    width: "100%",
    maxWidth: 340,
  },

  successCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 12,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },

  errorCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },

  successIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#ECFDF3",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  errorIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  successTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
  },

  errorTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
  },

  successSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 6,
  },

  errorSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 6,
  },

  modalAmountCard: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EDE9FE",
  },

  modalAmountLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6D28D9",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  modalAmountValue: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0F172A",
  },

  errorButton: {
    width: "100%",
    marginTop: 4,
    backgroundColor: "#0F172A",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#6D28D9",
  },

  errorButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  overlayHint: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
  },
});
