import * as LocalAuthentication from 'expo-local-authentication';

// Check if biometric authentication is available on the device
export const checkBiometricSupport = async () => {
  const { biometricSupported } = await LocalAuthentication.hasHardwareAsync();
  return biometricSupported;
};

// Authenticate using biometrics (fingerprint, face, etc.)
export const authenticateWithBiometrics = async (promptMessage) => {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    // Fallback to passcode if biometric fails (optional)
    // fallbackLabel: 'Use Passcode',
  });

  if (result.success) {
    return result;
  } else {
    throw new Error('Biometric authentication failed');
  }
};
