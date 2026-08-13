import api from './api';

/**
 * Sends product parameters to the backend to get a Business Recommendation,
 * which includes the ML prediction, historical analysis, and strategic logic.
 * 
 * @param {Object} data - The product features
 * @returns {Promise<Object>} The recommendation payload from the backend
 */
export const predictOptimalPrice = async (data) => {
  try {
    const response = await api.post('/predictions/predict-price', data);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.detail || 
        error.response.data.message || 
        `Server error: ${error.response.status}`
      );
    } else if (error.request) {
      throw new Error("Cannot connect to backend server. Please check your network connection.");
    } else {
      throw new Error(`Request failed: ${error.message}`);
    }
  }
};

/**
 * Fetches the Demand Forecast for a given product and horizon.
 * 
 * @param {string} productId - The product ID (e.g. 'ACC001')
 * @param {number} horizon - Horizon in days (7, 14, 30, 90, 180, 365)
 * @returns {Promise<Object>} The forecast response from the backend
 */
export const getDemandForecast = async (productId, horizon) => {
  try {
    const response = await api.get(`/predictions/forecast?product_id=${productId}&horizon=${horizon}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.detail || 
        error.response.data.message || 
        `Server error: ${error.response.status}`
      );
    } else if (error.request) {
      throw new Error("Cannot connect to backend server. Please check your network connection.");
    } else {
      throw new Error(`Request failed: ${error.message}`);
    }
  }
};

/**
 * Fetches the list of all available product IDs for Demand Forecasting.
 * 
 * @returns {Promise<string[]>} Array of product IDs
 */
export const getAvailableProducts = async () => {
  try {
    const response = await api.get(`/predictions/products`);
    return response.data.products;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.detail || 
        error.response.data.message || 
        `Server error: ${error.response.status}`
      );
    } else if (error.request) {
      throw new Error("Cannot connect to backend server. Please check your network connection.");
    } else {
      throw new Error(`Request failed: ${error.message}`);
    }
  }
};
