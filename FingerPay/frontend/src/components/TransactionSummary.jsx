import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatCurrency } from '../utils/formatCurrency';

const TransactionSummary = ({ transaction, user }) => {
  if (!transaction || !user) {
    return null;
  }

  const amount = transaction.amount;
  const type = transaction.type;
  const status = transaction.status;
  const formattedAmount = formatCurrency(amount);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transaction Summary</Text>
      <View style={styles.details}>
        <View style={styles.row}>
          <Text style={styles.label}>Amount:</Text>
          <Text style={styles.value}>{formattedAmount}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Type:</Text>
          <Text style={styles.value} style={{ textTransform: 'capitalize' }}>{type}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Status:</Text>
          <Text 
            style={[
              styles.value,
              status === 'completed' ? styles.statusCompleted : styles.statusFailed,
            ]}>
            {status}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Customer:</Text>
          <Text style={styles.value}>{user.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>New Balance:</Text>
          <Text style={styles.value}>{formatCurrency(user.balance)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  details: {
    // space-y-2 equivalent: we'll add marginBottom to each row except last
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: '#6b7280', // gray-600
    fontWeight: '500',
  },
  value: {
    fontWeight: '500',
  },
  statusCompleted: {
    color: '#059669', // green-600
    fontWeight: '500',
  },
  statusFailed: {
    color: '#dc2626', // red-600
    fontWeight: '500',
  },
});

export default TransactionSummary;
