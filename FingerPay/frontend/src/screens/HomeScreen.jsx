import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { API_BASE_URL } from "../config/env";

const HomeScreen = () => {
  const { user, token } = useAuth();
  const navigation = useNavigation();
  const userName = user?.name || "there";

  const [balance, setBalance] = useState(0);
  const [showBalance, setShowBalance] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const fetchHomeData = async (token) => {
    const [userRes, txRes] = await Promise.all([
      fetch(`${API_BASE_URL}/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_BASE_URL}/user/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const userData = await userRes.json();
    const txData = await txRes.json();

    if (!userRes.ok) throw new Error(userData.error || "Failed to load user");
    if (!txRes.ok)
      throw new Error(txData.error || "Failed to load transactions");

    return { user: userData, transactions: txData.transactions };
  };

  const loadData = async (isRefresh = false) => {
    try {
      setError(null);
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await fetchHomeData(token);
      setBalance(Number(data.user.user.balance) || 0);
      setTransactions(data.transactions || []);
    } catch (err) {
      setError(err.message || "Failed to load");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData(false);
    }, [token]),
  );

  const onRefresh = () => {
    loadData(true);
  };

  const visibleTransactions = showAllTransactions
    ? transactions
    : transactions.slice(0, 4);

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#6D28D9" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6D28D9"
          />
        }
      >
        <View style={styles.heroSection}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greetingText}>{getGreeting()}</Text>
              <Text style={styles.nameText}>Hi, {userName} 👋</Text>
            </View>

            <TouchableOpacity
              style={styles.verifyButton}
              onPress={() => navigation.navigate("VerifyAccountScreen")}
            >
              <Text style={styles.verifyButtonText}>Verify</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.walletCard}>
            <View style={styles.walletTopRow}>
              <Text style={styles.walletLabel}>Available balance</Text>
              <TouchableOpacity
                onPress={() => setShowBalance((prev) => !prev)}
                style={styles.iconCircle}
              >
                <Ionicons
                  name={showBalance ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.walletAmount}>
              {showBalance ? `£${Number(balance || 0).toFixed(2)}` : "••••"}
            </Text>

            <View style={styles.walletFooterRow}>
              <View style={styles.walletTag}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={14}
                  color="#C4B5FD"
                />
                <Text style={styles.walletTagText}>Secure wallet</Text>
              </View>

              <View style={styles.walletTag}>
                <Ionicons
                  name="finger-print-outline"
                  size={14}
                  color="#C4B5FD"
                />
                <Text style={styles.walletTagText}>Biometric pay</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("Wallet")}
          >
            <View style={styles.actionIconWrap}>
              <Ionicons name="add-outline" size={18} color="#6D28D9" />
            </View>
            <Text style={styles.actionText}>Add Money</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIconWrap}>
              <Ionicons
                name="swap-horizontal-outline"
                size={18}
                color="#6D28D9"
              />
            </View>
            <Text style={styles.actionText}>Transfer</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIconWrap}>
              <Ionicons name="receipt-outline" size={18} color="#6D28D9" />
            </View>
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent transactions</Text>

            {transactions.length > 4 && (
              <TouchableOpacity
                onPress={() => setShowAllTransactions((prev) => !prev)}
              >
                <Text style={styles.seeAllText}>
                  {showAllTransactions ? "See less" : "See all"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {visibleTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="receipt-outline" size={22} color="#6B7280" />
              </View>
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySubtitle}>
                Your recent payments will appear here once you start using
                FingerPay.
              </Text>
            </View>
          ) : (
            visibleTransactions.map((item) => {
              const d = new Date(item.createdAt);
              const date = d.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
              const time = d.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <View key={item._id} style={styles.transactionItem}>
                  {item.merchantImage ? (
                    <Image
                      source={{ uri: item.merchantImage }}
                      style={styles.merchantLogo}
                    />
                  ) : (
                    <View style={[styles.merchantLogo, styles.placeholderLogo]}>
                      <Ionicons
                        name="storefront-outline"
                        size={18}
                        color="#6B7280"
                      />
                    </View>
                  )}

                  <View style={styles.transactionDetails}>
                    <Text style={styles.merchantName}>{item.merchantName}</Text>
                    <Text style={styles.transactionDate}>{date}</Text>
                    <Text style={styles.transactionTime}>{time}</Text>
                  </View>

                  <Text style={styles.amountText}>
                    -£{Math.abs(Number(item.amount || 0)).toFixed(2)}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    paddingBottom: 32,
  },
  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  heroSection: {
    backgroundColor: "#5B21B6",
    paddingTop: 34,
    paddingHorizontal: 20,
    paddingBottom: 36,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greetingText: {
    color: "#DDD6FE",
    fontSize: 13,
    marginBottom: 4,
  },
  nameText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
  },
  verifyButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  verifyButtonText: {
    color: "#5B21B6",
    fontSize: 14,
    fontWeight: "700",
  },
  walletCard: {
    marginTop: 22,
    backgroundColor: "#6D28D9",
    borderRadius: 28,
    padding: 20,
    shadowColor: "#2E1065",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 10,
  },
  walletTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  walletLabel: {
    color: "#DDD6FE",
    fontSize: 14,
    fontWeight: "600",
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.14)",
    justifyContent: "center",
    alignItems: "center",
  },
  walletAmount: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "800",
    marginTop: 18,
    letterSpacing: 0.3,
  },
  walletFooterRow: {
    flexDirection: "row",
    marginTop: 18,
    gap: 10,
    flexWrap: "wrap",
  },
  walletTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 6,
  },
  walletTagText: {
    color: "#E9D5FF",
    fontSize: 12,
    fontWeight: "600",
  },
  quickActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: -18,
    marginBottom: 20,
    gap: 10,
  },
  actionCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F5F3FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  actionText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
  },
  sectionCard: {
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  seeAllText: {
    color: "#6D28D9",
    fontSize: 14,
    fontWeight: "700",
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  merchantLogo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
  },
  placeholderLogo: {
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  transactionDetails: {
    flex: 1,
  },
  merchantName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
    color: "#6B7280",
  },
  transactionTime: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  amountText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#5B21B6",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 16,
  },
});
