import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/env";

const PayPointsScreen = () => {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchTransactions = async (isRefresh = false) => {
    try {
      setError(null);

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await fetch(`${API_BASE_URL}/user/transactions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load PayPoints");
      }

      setTransactions(data.transactions || []);
    } catch (err) {
      setError(err.message || "Failed to load PayPoints");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTransactions(false);
    }, [token])
  );

  const onRefresh = () => {
    fetchTransactions(true);
  };

  const rewardsData = useMemo(() => {
    const now = new Date();

    const validTransactions = transactions.filter(
      (item) => Number(item.amount || 0) > 0
    );

    const totalSpent = validTransactions.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const totalPoints = validTransactions.reduce(
      (sum, item) => sum + Math.floor(Number(item.amount || 0)),
      0
    );

    const thisMonthPoints = validTransactions.reduce((sum, item) => {
      const d = new Date(item.createdAt);
      const sameMonth =
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();

      return sameMonth ? sum + Math.floor(Number(item.amount || 0)) : sum;
    }, 0);

    const nextRewardAt = Math.ceil((totalPoints + 1) / 50) * 50;
    const pointsToNextReward = nextRewardAt - totalPoints;
    const progress = ((totalPoints % 50) / 50) * 100;

    const recentEarned = validTransactions.slice(0, 6).map((item) => ({
      ...item,
      earnedPoints: Math.floor(Number(item.amount || 0)),
    }));

    return {
      totalSpent,
      totalPoints,
      thisMonthPoints,
      nextRewardAt,
      pointsToNextReward,
      progress,
      recentEarned,
    };
  }, [transactions]);

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#6D28D9" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6D28D9" />
      }
    >
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.pointsIconWrap}>
            <FontAwesome name="diamond" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.heroBadge}>Rewards</Text>
        </View>

        <Text style={styles.heroTitle}>PayPoints Balance</Text>
        <Text style={styles.heroPoints}>{rewardsData.totalPoints}</Text>
        <Text style={styles.heroSubtitle}>
          Earn 1 PayPoint for every £1 spent with FingerPay
        </Text>

        <View style={styles.progressSection}>
          <View style={styles.progressTopRow}>
            <Text style={styles.progressLabel}>Progress to next reward</Text>
            <Text style={styles.progressValue}>
              {rewardsData.pointsToNextReward} pts left
            </Text>
          </View>

          <View style={styles.progressBarBg}>
            <View
              style={[styles.progressBarFill, { width: `${rewardsData.progress}%` }]}
            />
          </View>

          <Text style={styles.progressFoot}>
            Next milestone at {rewardsData.nextRewardAt} PayPoints
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total spent</Text>
          <Text style={styles.statValue}>£{rewardsData.totalSpent.toFixed(2)}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>This month</Text>
          <Text style={styles.statValue}>{rewardsData.thisMonthPoints} pts</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoIconWrap}>
          <Ionicons name="flash-outline" size={18} color="#6D28D9" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.infoTitle}>How PayPoints work</Text>
          <Text style={styles.infoText}>
            Every successful payment earns points automatically. Spend £1, earn 1 PayPoint.
          </Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Recent earnings</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {rewardsData.recentEarned.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="gift-outline" size={22} color="#6B7280" />
            </View>
            <Text style={styles.emptyTitle}>No PayPoints yet</Text>
            <Text style={styles.emptyText}>
              Start making payments with FingerPay to earn rewards automatically.
            </Text>
          </View>
        ) : (
          rewardsData.recentEarned.map((item) => {
            const d = new Date(item.createdAt);
            const date = d.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });

            return (
              <View key={item._id} style={styles.earningRow}>
                <View style={styles.earningLeft}>
                  <View style={styles.earningIconWrap}>
                    <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                  </View>
                  <View>
                    <Text style={styles.earningMerchant}>
                      {item.merchantName || "FingerPay Merchant"}
                    </Text>
                    <Text style={styles.earningDate}>{date}</Text>
                  </View>
                </View>

                <View style={styles.earningRight}>
                  <Text style={styles.earningPoints}>+{item.earnedPoints} pts</Text>
                  <Text style={styles.earningAmount}>
                    £{Number(item.amount || 0).toFixed(2)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
};

export default PayPointsScreen;

const styles = StyleSheet.create({
  screen: {
    paddingTop: 20,
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 18,
    paddingBottom: 30,
  },
  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  heroCard: {
    backgroundColor: "#6D28D9",
    borderRadius: 28,
    padding: 22,
    shadowColor: "#2E1065",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 10,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pointsIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.16)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroBadge: {
    color: "#F3E8FF",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: "#E9D5FF",
    fontSize: 15,
    marginTop: 18,
    marginBottom: 6,
  },
  heroPoints: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "800",
  },
  heroSubtitle: {
    color: "#E9D5FF",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  progressSection: {
    marginTop: 20,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: 14,
  },
  progressTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  progressLabel: {
    color: "#F5F3FF",
    fontSize: 13,
    fontWeight: "600",
  },
  progressValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  progressBarBg: {
    height: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
  },
  progressFoot: {
    color: "#DDD6FE",
    fontSize: 12,
    marginTop: 10,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 3,
  },
  statLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  infoCard: {
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 3,
  },
  infoIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F3E8FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#6B7280",
  },
  sectionCard: {
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },
  earningRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  earningLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  earningIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#ECFDF3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  earningMerchant: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 3,
  },
  earningDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  earningRight: {
    alignItems: "flex-end",
  },
  earningPoints: {
    fontSize: 15,
    fontWeight: "800",
    color: "#6D28D9",
    marginBottom: 3,
  },
  earningAmount: {
    fontSize: 12,
    color: "#6B7280",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 26,
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
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 10,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    marginBottom: 10,
  },
});