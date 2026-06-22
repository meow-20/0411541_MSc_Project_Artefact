import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  LayoutAnimation,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { API_BASE_URL } from "../config/env";

const MoneyScreen = () => {
  const { user, token, login, role } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    console.log(user);
  }, []);

  const [bankExpanded, setBankExpanded] = useState(false);
  const [bankTopupAmount, setBankTopupAmount] = useState("");
  const [bankTopupLoading, setBankTopupLoading] = useState(false);
  const [bankTopupError, setBankTopupError] = useState(null);

  const [cardExpanded, setCardExpanded] = useState(false);
  const [cardTopupAmount, setCardTopupAmount] = useState("");
  const [cardTopupLoading, setCardTopupLoading] = useState(false);
  const [cardTopupError, setCardTopupError] = useState(null);

  const handleCardPayment = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCardExpanded((prev) => !prev);
    setCardTopupError(null);
    if (!cardExpanded) setBankExpanded(false);
  };

  const handleBankTransfer = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setBankExpanded((prev) => !prev);
    setBankTopupError(null);
    if (!bankExpanded) setCardExpanded(false);
  };

  const handleCardTopup = async () => {
    const amountNum = parseFloat(cardTopupAmount);

    if (!cardTopupAmount) {
      setCardTopupError("Please enter an amount");
      return;
    }

    setCardTopupLoading(true);
    setCardTopupError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/user/wallet/topup-card`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: amountNum }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Top up failed");
      }

      if (data.user) {
        login({
          user: {
            ...user,
            ...data.user,
          },
          token,
          role,
        });
      }

      setCardTopupAmount("");
      setCardExpanded(false);
      navigation.reset({
        index: 0,
        routes: [{ name: "CustomerMain" }],
      });
    } catch (err) {
      setCardTopupError(err.message || "Top up failed. Please try again.");
    } finally {
      setCardTopupLoading(false);
    }
  };

  const handleBankTopup = async () => {
    const amountNum = parseFloat(bankTopupAmount);

    if (!bankTopupAmount) {
      setBankTopupError("Please enter an amount");
      return;
    }

    setBankTopupLoading(true);
    setBankTopupError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/user/wallet/topup-bank`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: amountNum }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Top up failed");
      }

      if (data.user) {
        login({
          user: {
            ...user,
            ...data.user,
          },
          token,
          role,
        });
      }

      setBankTopupAmount("");
      setBankExpanded(false);
      navigation.reset({
        index: 0,
        routes: [{ name: "CustomerMain" }],
      });
    } catch (err) {
      setBankTopupError(err.message || "Top up failed. Please try again.");
    } finally {
      setBankTopupLoading(false);
    }
  };

  const handleComingSoon = () => {
    Alert.alert("Coming Soon", "This feature is coming soon!", [
      { text: "OK", style: "cancel" },
    ]);
  };

  const bankReady = !!user?.accountDetails?.accountNumber;
  const cardReady = !!user?.cardDetails?.cardNumber;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>Top up wallet</Text>
        <Text style={styles.heroTitle}>Add money in seconds</Text>
        <Text style={styles.heroSubtitle}>
          Choose a payment source and securely add funds to your FingerPay wallet.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available methods</Text>

        <TouchableOpacity
          style={[styles.methodCard, bankExpanded && styles.methodCardActive]}
          onPress={handleBankTransfer}
          activeOpacity={0.9}
        >
          <View style={styles.methodTopRow}>
            <View style={styles.methodLeft}>
              <View style={styles.methodIconWrap}>
                <MaterialCommunityIcons
                  name="bank-outline"
                  size={24}
                  color="#6D28D9"
                />
              </View>

              <View style={styles.methodTextWrap}>
                <Text style={styles.methodTitle}>Bank transfer</Text>
                <Text style={styles.methodMeta}>
                  {bankReady
                    ? `${user.accountDetails.bankName} •••• ${user.accountDetails.accountNumber.slice(-4)}`
                    : "Add your bank details to use this method"}
                </Text>
                <Text style={styles.methodDescription}>
                  Transfer funds directly from your linked bank account
                </Text>
              </View>
            </View>

            <View style={styles.methodRight}>
              <View
                style={[
                  styles.statusChip,
                  bankReady ? styles.statusReady : styles.statusMissing,
                ]}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    bankReady ? styles.statusReadyText : styles.statusMissingText,
                  ]}
                >
                  {bankReady ? "Linked" : "Setup"}
                </Text>
              </View>

              <Ionicons
                name={bankExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color="#6D28D9"
              />
            </View>
          </View>
        </TouchableOpacity>

        {bankExpanded && (
          <View style={styles.expandCard}>
            <Text style={styles.expandTitle}>Add money from bank</Text>
            <Text style={styles.expandSubtitle}>
              Enter the amount you want to add to your wallet.
            </Text>

            <View style={styles.amountInputWrap}>
              <Text style={styles.currency}>£</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={bankTopupAmount}
                onChangeText={setBankTopupAmount}
              />
            </View>

            {bankTopupError ? (
              <Text style={styles.errorText}>{bankTopupError}</Text>
            ) : null}

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleBankTopup}
              activeOpacity={0.9}
              disabled={bankTopupLoading}
            >
              {bankTopupLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Add to wallet</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.methodCard, cardExpanded && styles.methodCardActive]}
          onPress={handleCardPayment}
          activeOpacity={0.9}
        >
          <View style={styles.methodTopRow}>
            <View style={styles.methodLeft}>
              <View style={styles.methodIconWrap}>
                <Ionicons name="card-outline" size={24} color="#6D28D9" />
              </View>

              <View style={styles.methodTextWrap}>
                <Text style={styles.methodTitle}>Debit or credit card</Text>
                <Text style={styles.methodMeta}>
                  {cardReady
                    ? `Primary card •••• ${user.cardDetails.cardNumber.slice(-4)}`
                    : "Add your card details to use this method"}
                </Text>
                <Text style={styles.methodDescription}>
                  Add funds instantly with your saved card
                </Text>
              </View>
            </View>

            <View style={styles.methodRight}>
              <View
                style={[
                  styles.statusChip,
                  cardReady ? styles.statusReady : styles.statusMissing,
                ]}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    cardReady ? styles.statusReadyText : styles.statusMissingText,
                  ]}
                >
                  {cardReady ? "Saved" : "Setup"}
                </Text>
              </View>

              <Ionicons
                name={cardExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color="#6D28D9"
              />
            </View>
          </View>
        </TouchableOpacity>

        {cardExpanded && (
          <View style={styles.expandCard}>
            <Text style={styles.expandTitle}>Add money with card</Text>
            <Text style={styles.expandSubtitle}>
              Your card payment will be processed securely.
            </Text>

            <View style={styles.amountInputWrap}>
              <Text style={styles.currency}>£</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={cardTopupAmount}
                onChangeText={setCardTopupAmount}
              />
            </View>

            {cardTopupError ? (
              <Text style={styles.errorText}>{cardTopupError}</Text>
            ) : null}

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleCardTopup}
              activeOpacity={0.9}
              disabled={cardTopupLoading}
            >
              {cardTopupLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Add to wallet</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Coming soon</Text>

        <TouchableOpacity
          style={[styles.methodCard, styles.soonCard]}
          onPress={handleComingSoon}
          activeOpacity={0.9}
        >
          <View style={styles.methodTopRow}>
            <View style={styles.methodLeft}>
              <View style={styles.methodIconWrap}>
                <FontAwesome5 name="apple-pay" size={22} color="#111827" />
              </View>
              <View style={styles.methodTextWrap}>
                <Text style={styles.methodTitle}>Apple Pay</Text>
                <Text style={styles.methodDescription}>
                  Secure payments with Face ID or Touch ID
                </Text>
              </View>
            </View>
            <View style={styles.comingSoonPill}>
              <Text style={styles.comingSoonPillText}>Coming soon</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.methodCard, styles.soonCard]}
          onPress={handleComingSoon}
          activeOpacity={0.9}
        >
          <View style={styles.methodTopRow}>
            <View style={styles.methodLeft}>
              <View style={styles.methodIconWrap}>
                <FontAwesome5 name="paypal" size={21} color="#2563EB" />
              </View>
              <View style={styles.methodTextWrap}>
                <Text style={styles.methodTitle}>PayPal</Text>
                <Text style={styles.methodDescription}>
                  Pay using your PayPal balance and linked methods
                </Text>
              </View>
            </View>
            <View style={styles.comingSoonPill}>
              <Text style={styles.comingSoonPillText}>Coming soon</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default MoneyScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    paddingBottom: 32,
  },
  hero: {
    backgroundColor: "#5B21B6",
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroEyebrow: {
    color: "#DDD6FE",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  heroSubtitle: {
    color: "#E9D5FF",
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 320,
  },
  section: {
    marginTop: 18,
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },
  methodCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    marginBottom: 12,
  },
  methodCardActive: {
    borderColor: "#C4B5FD",
    backgroundColor: "#FAF7FF",
  },
  soonCard: {
    backgroundColor: "#FCFCFD",
  },
  methodTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  methodLeft: {
    flexDirection: "row",
    flex: 1,
    paddingRight: 10,
  },
  methodIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3E8FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  methodTextWrap: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  methodMeta: {
    fontSize: 13,
    color: "#4B5563",
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 19,
  },
  methodRight: {
    alignItems: "flex-end",
    gap: 12,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusReady: {
    backgroundColor: "#ECFDF3",
  },
  statusMissing: {
    backgroundColor: "#FFF7ED",
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statusReadyText: {
    color: "#027A48",
  },
  statusMissingText: {
    color: "#B45309",
  },
  expandCard: {
    marginTop: -2,
    marginBottom: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDE9FE",
  },
  expandTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  expandSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 19,
    marginBottom: 14,
  },
  amountInputWrap: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  currency: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    color: "#111827",
  },
  errorText: {
    marginTop: 8,
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "500",
  },
  primaryButton: {
    marginTop: 14,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#6D28D9",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  comingSoonPill: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  comingSoonPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
  },
});