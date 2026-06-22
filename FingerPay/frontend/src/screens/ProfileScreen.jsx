import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  console.log("User data in ProfileScreen:", user);

const isMerchant = !!user?.company_name?.trim();

  const theme = isMerchant
    ? {
        background: "#F4F7FB",
        hero: "#0F172A",
        heroSoft: "rgba(255,255,255,0.08)",
        heroText: "#FFFFFF",
        heroSubtext: "#CBD5E1",
        accent: "#0EA5A4",
        accentSoft: "#CCFBF1",
        accentText: "#0F766E",
        card: "#FFFFFF",
        border: "#E2E8F0",
        title: "#0F172A",
        text: "#334155",
        muted: "#64748B",
        iconBg: "#ECFEFF",
        dangerBg: "#FEF2F2",
        danger: "#DC2626",
        shadow: "#0F172A",
      }
    : {
        background: "#F8FAFC",
        hero: "#6D28D9",
        heroSoft: "rgba(255,255,255,0.10)",
        heroText: "#FFFFFF",
        heroSubtext: "#E9D5FF",
        accent: "#6D28D9",
        accentSoft: "#F3E8FF",
        accentText: "#6D28D9",
        card: "#FFFFFF",
        border: "#F1F5F9",
        title: "#111827",
        text: "#111827",
        muted: "#6B7280",
        iconBg: "#F3E8FF",
        dangerBg: "#FEF2F2",
        danger: "#DC2626",
        shadow: "#2E1065",
      };

  const styles = createStyles(theme, isMerchant);

  const name = user?.name || "User";
  const phone = user?.phone_number || "Not added";
  const email = user?.email || "Not added";
  const address = user?.address || "Not added";
  const initial = name?.charAt(0)?.toUpperCase() || "U";

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: () => {
          logout();
          navigation.reset({
            index: 0,
            routes: [{ name: "LoginScreen" }],
          });
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            console.log("Account deleted");
          },
        },
      ]
    );
  };

  const InfoRow = ({ icon, label, value, noBorder = false }) => (
    <View
      style={[
        styles.infoRow,
        !noBorder && styles.rowBorder,
      ]}
    >
      <View style={styles.rowLeft}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={18} color={theme.accent} />
        </View>
        <View style={styles.rowTextWrap}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      </View>
    </View>
  );

  const ActionRow = ({
    icon,
    label,
    onPress,
    danger = false,
    noBorder = false,
  }) => (
    <TouchableOpacity
      style={[
        styles.actionRow,
        !noBorder && styles.rowBorder,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.rowLeft}>
        <View
          style={[
            styles.iconWrap,
            danger && { backgroundColor: theme.dangerBg },
          ]}
        >
          <Ionicons
            name={icon}
            size={18}
            color={danger ? theme.danger : theme.accent}
          />
        </View>
        <Text style={[styles.actionLabel, danger && { color: "#B91C1C" }]}>
          {label}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={danger ? "#F87171" : "#9CA3AF"}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.avatarOuter}>
              <View style={styles.avatarInner}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.editPill} activeOpacity={0.85}>
              <Ionicons name="create-outline" size={14} color={theme.accent} />
              <Text style={styles.editPillText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.heroTitle}>{name}</Text>
          <Text style={styles.heroSubtitle}>{email}</Text>

          <View style={styles.rolePill}>
            <MaterialIcons
              name={isMerchant ? "storefront" : "person-outline"}
              size={14}
              color={isMerchant ? "#5EEAD4" : "#DDD6FE"}
            />
            <Text style={styles.rolePillText}>
              {isMerchant ? "Merchant account" : "Personal account"}
            </Text>
          </View>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Account</Text>
              <Text style={styles.heroStatValue}>Active</Text>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Security</Text>
              <Text style={styles.heroStatValue}>Protected</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Personal information</Text>
          <InfoRow icon="person-outline" label="Full name" value={name} />
          <InfoRow icon="call-outline" label="Phone number" value={phone} />
          <InfoRow icon="mail-outline" label="Email address" value={email} />
          <InfoRow
            icon="location-outline"
            label="Address"
            value={address}
            noBorder
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {isMerchant ? "Business settings" : "Security & settings"}
          </Text>

          <ActionRow
            icon="lock-closed-outline"
            label="Change Password"
            onPress={() => {}}
          />
          <ActionRow
            icon="shield-checkmark-outline"
            label={isMerchant ? "Merchant Security" : "Privacy & Security"}
            onPress={() => {}}
          />
          <ActionRow
            icon="notifications-outline"
            label="Notifications"
            onPress={() => {}}
            noBorder
          />
        </View>

        {isMerchant && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Merchant tools</Text>

            <ActionRow
              icon="card-outline"
              label="Settlement accounts"
              onPress={() => {}}
            />
            <ActionRow
              icon="receipt-outline"
              label="Transactions"
              onPress={() => {}}
            />
            <ActionRow
              icon="business-outline"
              label="Business details"
              onPress={() => {}}
              noBorder
            />
          </View>
        )}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Support</Text>

          <ActionRow
            icon="help-circle-outline"
            label="Help Center"
            onPress={() => {}}
          />
          <ActionRow
            icon="chatbubble-ellipses-outline"
            label="Contact Support"
            onPress={() => {}}
            noBorder
          />
        </View>

        <View style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>Account actions</Text>

          <ActionRow
            icon="log-out-outline"
            label="Logout"
            onPress={handleLogout}
          />
          <ActionRow
            icon="trash-outline"
            label="Delete Account"
            onPress={handleDeleteAccount}
            danger
            noBorder
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const createStyles = (theme, isMerchant) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },

    container: {
      flex: 1,
      backgroundColor: theme.background,
    },

    content: {
      padding: 20,
      paddingTop: 24,
      paddingBottom: 40,
    },

    heroCard: {
      backgroundColor: theme.hero,
      borderRadius: 30,
      padding: 22,
      marginBottom: 18,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.18,
      shadowRadius: 28,
      elevation: 10,
    },

    heroTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 18,
    },

    avatarOuter: {
      width: 74,
      height: 74,
      borderRadius: 37,
      backgroundColor: isMerchant
        ? "rgba(255,255,255,0.10)"
        : "rgba(255,255,255,0.18)",
      justifyContent: "center",
      alignItems: "center",
    },

    avatarInner: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: "#FFFFFF",
      justifyContent: "center",
      alignItems: "center",
    },

    avatarText: {
      fontSize: 22,
      fontWeight: "800",
      color: theme.accent,
    },

    editPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
    },

    editPillText: {
      color: theme.accent,
      fontSize: 13,
      fontWeight: "700",
    },

    heroTitle: {
      color: theme.heroText,
      fontSize: 26,
      fontWeight: "800",
      marginBottom: 6,
    },

    heroSubtitle: {
      color: theme.heroSubtext,
      fontSize: 14,
      marginBottom: 14,
    },

    rolePill: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.heroSoft,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      marginBottom: 20,
    },

    rolePillText: {
      color: isMerchant ? "#CCFBF1" : "#F5E8FF",
      fontSize: 12,
      fontWeight: "700",
    },

    heroStatsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: theme.heroSoft,
      borderRadius: 18,
      paddingVertical: 14,
      paddingHorizontal: 10,
    },

    heroStat: {
      flex: 1,
      alignItems: "center",
    },

    heroStatLabel: {
      fontSize: 12,
      color: theme.heroSubtext,
      marginBottom: 4,
    },

    heroStatValue: {
      fontSize: 14,
      fontWeight: "800",
      color: theme.heroText,
    },

    heroDivider: {
      width: 1,
      height: 28,
      backgroundColor: isMerchant
        ? "rgba(255,255,255,0.10)"
        : "rgba(255,255,255,0.18)",
    },

    sectionCard: {
      backgroundColor: theme.card,
      borderRadius: 24,
      padding: 18,
      marginBottom: 18,
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.04,
      shadowRadius: 20,
      elevation: 3,
      borderWidth: 1,
      borderColor: isMerchant ? theme.border : "transparent",
    },

    dangerCard: {
      backgroundColor: "#FFFFFF",
      borderRadius: 24,
      padding: 18,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: "#FEE2E2",
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.04,
      shadowRadius: 20,
      elevation: 3,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: theme.title,
      marginBottom: 12,
    },

    dangerTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: theme.title,
      marginBottom: 12,
    },

    infoRow: {
      paddingVertical: 14,
    },

    actionRow: {
      minHeight: 58,
      paddingVertical: 12,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },

    rowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },

    rowLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },

    rowTextWrap: {
      flex: 1,
    },

    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.iconBg,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },

    infoLabel: {
      fontSize: 13,
      color: theme.muted,
      marginBottom: 3,
    },

    infoValue: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.text,
    },

    actionLabel: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.text,
    },
  });