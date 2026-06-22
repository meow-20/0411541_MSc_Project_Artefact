import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import PaymentScreen from "../screens/PaymentScreen";
import HistoryScreen from "../screens/HistoryScreen";
import WithdrawScreen from "../screens/WithdrawScreen";
import ProfileScreen from "../screens/ProfileScreen";
import VerifyFingerPrintScreen from "../screens/VerifyFingerPrintScreen";

const Tab = createBottomTabNavigator();

function MerchantTabs() {
  return (
    <Tab.Navigator
      initialRouteName="PaymentScreen"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#5b21b6",
        tabBarInactiveTintColor: "#666",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 0,
          height: 65,
          paddingBottom: 8,
          paddingTop: 6,
        },

        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === "Payment") iconName = "home-outline";
          else if (route.name === "History") iconName = "time-outline";
          else if (route.name === "Withdraw") iconName = "cash-outline";
          else if (route.name === "Verify") iconName = "finger-print-outline";
          else if (route.name === "Profile") iconName = "person-outline";

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Payment" component={PaymentScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Withdraw" component={WithdrawScreen} />
      <Tab.Screen name="Verify" component={VerifyFingerPrintScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default MerchantTabs;
