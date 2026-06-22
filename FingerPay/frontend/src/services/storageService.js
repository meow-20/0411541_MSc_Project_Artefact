import * as SecureStore from 'expo-secure-store';

const BIOmetric_ID_KEY = 'fingerpay_biometric_id';

export const getBiometricId = async () => {
  try {
    const id = await SecureStore.getItemAsync(BIOmetric_ID_KEY);
    return id;
  } catch (error) {
    console.error('Failed to get biometric ID from secure store:', error);
    return null;
  }
};

export const setBiometricId = async (id) => {
  try {
    await SecureStore.setItemAsync(BIOmetric_ID_KEY, id);
  } catch (error) {
    console.error('Failed to set biometric ID in secure store:', error);
    throw error;
  }
};

// Optional: clear the biometric ID (e.g., on logout)
export const clearBiometricId = async () => {
  try {
    await SecureStore.deleteItemAsync(BIOmetric_ID_KEY);
  } catch (error) {
    console.error('Failed to clear biometric ID:', error);
  }
};
