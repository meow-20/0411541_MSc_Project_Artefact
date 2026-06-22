import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createUser, payWithBiometric } from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import { isNotEmpty, isValidEmail, isPositiveNumber } from '../utils/validation';
import AmountInput from '../components/AmountInput';
import PrimaryButton from '../components/PrimaryButton';

const EnrolmentScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const route = useRoute();
  const navigation = useNavigation();

  const { biometricId, amount } = route.params || {};

  const handleSubmit = async () => {
    // Validate inputs
    if (!isNotEmpty(name)) {
      setError('Please enter a name');
      return;
    }
    if (!isNotEmpty(email)) {
      setError('Please enter an email');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email');
      return;
    }
    if (!isPositiveNumber(parseFloat(initialBalance))) {
      setError('Please enter a valid initial balance (>= 0)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create the user
      const userData = {
        name,
        email,
        biometricId,
        initialBalance: parseFloat(initialBalance)
      };
      const user = await createUser(userData);
      
      // Immediately process the original payment
      const paymentResult = await payWithBiometric({ 
        biometricId, 
        amount: parseFloat(amount) 
      });
      
      // Navigate to result screen with both user creation and payment results
      navigation.navigate('PaymentResultScreen', { 
        user: paymentResult.user, 
        transaction: paymentResult.transaction 
      });
    } catch (err) {
      setError(err.message || 'Enrolment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enrol New Customer</Text>
      <Text style={styles.subtitle}>Fingerprint not recognized - enrolling new user</Text>
      
      <View style={styles.form}>
        <TextInput
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          style={styles.input}
        />
        
        <TextInput
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          style={styles.input}
        />
        
        <AmountInput 
          label="Initial Balance (£)"
          value={initialBalance}
          onChangeText={setInitialBalance}
          placeholder="Enter starting balance"
        />
        
        {error && (
          <View style={styles.error}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        <PrimaryButton 
          title="Enrol & Pay"
          onPress={handleSubmit}
          loading={loading}
        />
      </View>
      
      {/* Show what we're working with */}
      {biometricId && amount && (
        <View style={styles.info}>
          <Text style={styles.infoText}>Biometric ID: {biometricId.substring(0, 8)}...</Text>
          <Text style={styles.infoText}>Amount to charge: {formatCurrency(amount)}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f9fafb', // gray-50
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1f2937', // gray-800
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 24,
    color: '#ea580c', // orange-600
  },
  form: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db', // gray-300
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: '100%',
    marginBottom: 16,
  },
  error: {
    padding: 16,
    backgroundColor: '#fef2f2', // red-50
    borderLeftWidth: 4,
    borderColor: '#dc2626', // red-600
    marginBottom: 16,
  },
  errorText: {
    color: '#b91c1c', // red-700
    fontWeight: '500',
  },
  info: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f9fafb', // gray-50
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280', // gray-600
  },
});

export default EnrolmentScreen;
