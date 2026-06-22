// screens/WithdrawScreen.js
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/env";

const MerchantWithdrawScreen = () => {
  const { user, token } = useAuth();

  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState(Number(user?.balance || 0));
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const merchantStorageKey = `merchant_withdrawals_${
    user?.id || user?.company_name || "default"
  }`;

  const fetchMerchantBalance = async () => {
    try {
      setError(null);

      const res = await fetch(`${API_BASE_URL}/merchant/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load merchant");
      }

      const numericBalance = Number(data.balance || 0);
      setBalance(Number.isFinite(numericBalance) ? numericBalance : 0);
    } catch (err) {
      setError(err.message || "Failed to load merchant");
    } finally {
      setRefreshing(false);
    }
  };

  const loadTransactions = async () => {
    try {
      setHistoryLoading(true);
      const saved = await AsyncStorage.getItem(merchantStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setTransactions(Array.isArray(parsed) ? parsed : []);
      } else {
        setTransactions([]);
      }
    } catch (e) {
      console.log("Failed to load withdrawals:", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const saveTransaction = async (tx) => {
    try {
      const existing = await AsyncStorage.getItem(merchantStorageKey);
      const parsed = existing ? JSON.parse(existing) : [];
      const updated = [tx, ...parsed];
      await AsyncStorage.setItem(merchantStorageKey, JSON.stringify(updated));
      setTransactions(updated);
    } catch (e) {
      console.log("Failed to save withdrawal:", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setRefreshing(true);
      fetchMerchantBalance();
      loadTransactions();
    }, [token, merchantStorageKey])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMerchantBalance();
    loadTransactions();
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

  const setQuickAmount = (value) => {
    setAmount(String(value));
    setError(null);
  };

  const handleWithdraw = async () => {
    setError(null);

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }

    if (numericAmount > balance) {
      setError("Amount exceeds available wallet balance.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/merchant/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: numericAmount }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Withdraw failed");
      }

      const nextBalance =
        typeof data?.balance !== "undefined"
          ? Number(data.balance)
          : balance - numericAmount;

      setBalance(Number.isFinite(nextBalance) ? nextBalance : balance);

      const transaction = {
        id: `${Date.now()}`,
        type: "Bank withdrawal",
        amount: numericAmount,
        status: "Completed",
        createdAt: new Date().toISOString(),
        reference: `WD-${Date.now().toString().slice(-6)}`,
      };

      await saveTransaction(transaction);
      setAmount("");
    } catch (err) {
      setError(err.message || "Withdraw failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value) => {
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="cash-outline" size={28} color="#fff" />
            </View>

            <Text style={styles.heroEyebrow}>Merchant payouts</Text>
            <Text style={styles.heroTitle}>Withdraw to bank</Text>
            <Text style={styles.heroSubtitle}>
              Move funds from your merchant wallet to your connected bank account.
            </Text>

            <View style={styles.balanceShell}>
              <Text style={styles.balanceLabel}>Available balance</Text>
              <Text style={styles.balanceAmount}>£{balance.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Withdrawal amount</Text>
            <Text style={styles.sectionSubtext}>
              Enter the amount you want to transfer to your bank account.
            </Text>

            <View style={styles.amountRow}>
              <Text style={styles.currency}>£</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0.00"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.quickRow}>
              {[50, 100, 250].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={styles.quickChip}
                  onPress={() => setQuickAmount(value)}
                >
                  <Text style={styles.quickChipText}>£{value}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
                <Text style={styles.error}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.7 }]}
              onPress={handleWithdraw}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="cash-outline" size={18} color="#fff" />
                  <Text style={styles.buttonText}>Withdraw to bank</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={styles.historyHeader}>
              <Text style={styles.sectionTitle}>Recent withdrawals</Text>
              <View style={styles.historyBadge}>
                <Text style={styles.historyBadgeText}>{transactions.length}</Text>
              </View>
            </View>

            <Text style={styles.sectionSubtext}>
              Stored locally on this device for this merchant.
            </Text>

            {historyLoading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator color="#0EA5A4" />
              </View>
            ) : transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="receipt-outline"
                  size={26}
                  color="#94A3B8"
                />
                <Text style={styles.emptyTitle}>No withdrawals yet</Text>
                <Text style={styles.emptyText}>
                  Your completed bank withdrawals will appear here.
                </Text>
              </View>
            ) : (
              transactions.map((tx, index) => (
                <View
                  key={tx.id || index}
                  style={[
                    styles.txRow,
                    index === transactions.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={styles.txIconWrap}>
                    <Ionicons
                      name="cash-outline"
                      size={18}
                      color="#6D28D9"
                    />
                  </View>

                  <View style={styles.txInfo}>
                    <Text style={styles.txTitle}>{tx.type}</Text>
                    <Text style={styles.txMeta}>{tx.reference}</Text>
                    <Text style={styles.txMeta}>{formatDate(tx.createdAt)}</Text>
                  </View>

                  <View style={styles.txRight}>
                    <Text style={styles.txAmount}>-£{Number(tx.amount).toFixed(2)}</Text>
                    <Text style={styles.txStatus}>{tx.status}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default MerchantWithdrawScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F172A",
  },

  container: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },

  content: {
    padding: 20,
    paddingBottom: 36,
  },

  heroCard: {
    backgroundColor: "#0F172A",
    borderRadius: 30,
    padding: 22,
    marginBottom: 18,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 10,
  },

  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6D28D9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  heroEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },

  heroTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 8,
  },

  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#CBD5E1",
    marginBottom: 18,
  },

  balanceShell: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 22,
    padding: 16,
  },

  balanceLabel: {
    fontSize: 13,
    color: "#CBD5E1",
    marginBottom: 6,
  },

  balanceAmount: {
    fontSize: 30,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },

  sectionSubtext: {
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
    marginBottom: 14,
  },

  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  currency: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    marginRight: 6,
  },

  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
  },

  quickRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    marginBottom: 6,
  },

  quickChip: {
    backgroundColor: "#F5F3FF",
    borderWidth: 1,
    borderColor: "#6D28D9",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },

  quickChipText: {
    color: "#6D28D9",
    fontSize: 13,
    fontWeight: "700",
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#FECACA",
  },

  error: {
    flex: 1,
    color: "#B91C1C",
    fontSize: 13,
    lineHeight: 19,
  },

  button: {
    marginTop: 16,
    backgroundColor: "#0F172A",
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  historyBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ECFEFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  historyBadgeText: {
    color: "#6D28D9",
    fontSize: 12,
    fontWeight: "800",
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 26,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 10,
    marginBottom: 4,
  },

  emptyText: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },

  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  txIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#ECFEFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  txInfo: {
    flex: 1,
  },

  txTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 3,
  },

  txMeta: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },

  txRight: {
    alignItems: "flex-end",
  },

  txAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },

  txStatus: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6D28D9",
  },
});