import axios from 'axios';
import { API_BASE_URL } from '../config/env';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Create a new user
export const createUser = async (userData) => {
  try {
    const response = await api.post('/users', userData);
    return response.data;
  } catch (error) {
    // If the backend returns an error with a code, rethrow it
    if (error.response && error.response.data && error.response.data.code) {
      throw error.response.data;
    }
    throw error;
  }
};

// Pay with biometric
export const payWithBiometric = async (paymentData) => {
  try {
    const response = await api.post('/payments/pay-with-biometric', paymentData);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data && error.response.data.code) {
      throw error.response.data;
    }
    throw error;
  }
};

// Optional: get bank users (for dashboard)
export const getBankUsers = async () => {
  try {
    const response = await api.get('/bank/users');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Optional: get bank user by id
export const getBankUserById = async (userId) => {
  try {
    const response = await api.get(`/bank/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default api;
