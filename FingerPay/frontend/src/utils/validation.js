// Simple validation functions
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
};

export const isNotEmpty = (value) => {
  return value && value.trim() !== '';
};

export const isPositiveNumber = (value) => {
  return typeof value === 'number' && value > 0;
};
