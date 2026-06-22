import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const SplashScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("Startup:")
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>FingerPay</Text>
      <Text style={{ color: '#ffffff', marginTop: 0, letterSpacing: 0.5 }}>Your fingerprint, your wallet!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5B21B6', // baby blue
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff', // white (negative color for contrast)
  },
});

export default SplashScreen;
