import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

const AmountInput = ({ label, value, onChangeText, placeholder }) => {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="gray"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    marginBottom: 4,
    fontSize: 12,
    fontWeight: '500',
    color: '#555555', // text-gray-700
  },
  input: {
    borderWidth: 1,
    borderColor: '#dddddd', // border-gray-300
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '100%',
    fontSize: 16,
  },
});

export default AmountInput;
