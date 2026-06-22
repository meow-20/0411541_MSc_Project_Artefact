// navigation/AppNavigator.jsx
import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useAuth } from "../context/AuthContext";
import BottomNavBar from "../components/BottomNavBar";

import SplashScreen from "../screens/SplashScreen";
import HomeScreen from "../screens/HomeScreen";
import PaymentScreen from "../screens/PaymentScreen";
import EnrolmentScreen from "../screens/EnrolmentScreen";
import PaymentResultScreen from "../screens/PaymentResultScreen";
import LoginScreen from "../screens/LoginScreen";
import SignUpScreen from "../screens/SignUpScreen";
import MerchantLoginScreen from "../screens/MerchantLoginScreen";
import MerchantSignUpScreen from "../screens/MerchantSignUpScreen";
import VerifyAccountScreen from "../screens/VerifyAccountScreen";
import CardDetailsScreen from "../screens/CardDetailsScreen";
import BankDetailsScreen from "../screens/BankDetailsScreen";
import MerchantTabs from "../components/MerchantTabs";
import FingerprintSuccessScreen from "../screens/FingerprintSuccessScreen";

const RootStack = createStackNavigator();
const AuthStack = createStackNavigator();
const CustomerStack = createStackNavigator();
const MerchantStack = createStackNavigator();

// Auth stack (shown when NOT authenticated)
const AuthStackScreen = () => (
  <AuthStack.Navigator
    initialRouteName="LoginScreen"
    screenOptions={{ headerShown: false }}
  >
    <AuthStack.Screen
      name="LoginScreen"
      component={LoginScreen}
      options={{ headerShown: false }}
    />
    <AuthStack.Screen
      name="SignUpScreen"
      component={SignUpScreen}
      options={{ headerShown: false }}
    />
    <AuthStack.Screen
      name="MerchantLoginScreen"
      component={MerchantLoginScreen}
      options={{ headerShown: false }}
    />
    <AuthStack.Screen
      name="MerchantSignUpScreen"
      component={MerchantSignUpScreen}
      options={{ headerShown: false }}
    />
  </AuthStack.Navigator>
);
function CustomerStackScreen() {
  return (
    <CustomerStack.Navigator screenOptions={{ headerShown: false }}>
      <CustomerStack.Screen name="CustomerTabs" component={BottomNavBar} />
      <RootStack.Screen
        name="VerifyAccountScreen"
        component={VerifyAccountScreen}
      />
      <RootStack.Screen
        name="CardDetailsScreen"
        component={CardDetailsScreen}
      />
      <RootStack.Screen
        name="BankDetailsScreen"
        component={BankDetailsScreen}
      />
    </CustomerStack.Navigator>
  );
}

function MerchantStackScreen() {
  return (
    <MerchantStack.Navigator screenOptions={{ headerShown: false }}>
      <MerchantStack.Screen name="PaymentScreen" component={MerchantTabs} />
      <MerchantStack.Screen name="FingerprintSuccess" component={FingerprintSuccessScreen} />
    </MerchantStack.Navigator>
  );
}

const AppNavigator = () => {
  const { isAuthenticated, role } = useAuth();
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashVisible(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (isSplashVisible) {
    return (
      <NavigationContainer>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="SplashScreen" component={SplashScreen} />
        </RootStack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <RootStack.Screen name="Auth" component={AuthStackScreen} />
        ) : role === "merchant" ? (
          <RootStack.Screen
            name="MerchantMain"
            component={MerchantStackScreen}
          />
        ) : (
          <RootStack.Screen
            name="CustomerMain"
            component={CustomerStackScreen}
          />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
