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
    const response = await api.post('/business-recommendation', data);
    return response.data;
  } catch (error) {
    if (error.response) {
      // Server responded with a status other than 2xx
      throw new Error(
        error.response.data.detail || 
        error.response.data.message || 
        `Server error: ${error.response.status}`
      );
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error("Cannot connect to backend server. Please check your network connection.");
    } else {
      // Something happened in setting up the request
      throw new Error(`Request failed: ${error.message}`);
    }
  }
};
