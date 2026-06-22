import React from 'react';
import { View, Text, Button, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { formatCurrency } from '../utils/formatCurrency';
import TransactionSummary from '../components/TransactionSummary';
import PrimaryButton from '../components/PrimaryButton';

const PaymentResultScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user, transaction } = route.params || {};

  if (!user || !transaction) {
    // Navigate back if no data
    navigation.goBack();
    return null;
  }

  const amount = transaction.amount;
  const status = transaction.status;
  const formattedAmount = formatCurrency(amount);
  const isSuccess = status === 'completed';

  return (
    <View style={styles.container}>
      <View style={styles.resultIconContainer}>
        {isSuccess ? (
          <Text style={styles.successIcon}>✓</Text>
        ) : (
          <Text style={styles.failureIcon}>✗</Text>
        )}
        <Text style={styles.resultText}>
          Payment {isSuccess ? 'Successful' : 'Failed'}
        </Text>
      </View>
      
      <TransactionSummary transaction={transaction} user={user} />
      
      <View style={styles.backButtonContainer}>
        <PrimaryButton 
          title="Back to Payment"
          onPress={() => navigation.goBack()}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f9fafb', // gray-50
  },
  resultIconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successIcon: {
    fontSize: 36,
    fontWeight: '700',
    color: '#059669', // green-600
    marginBottom: 8,
  },
  failureIcon: {
    fontSize: 36,
    fontWeight: '700',
    color: '#dc2626', // red-600
    marginBottom: 8,
  },
  resultText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  backButtonContainer: {
    marginTop: 32,
  },
});

export default PaymentResultScreen;
