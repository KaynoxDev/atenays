'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Base API URL configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Add global timeout to avoid infinite loading
});

// Utility for GET requests with React hook
export function useGet(url, initialData = null, options = {}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestCount, setRequestCount] = useState(0);
  
  // Add null check for URL to prevent "startsWith" errors
  const sanitizedUrl = url ? (url.startsWith('/api/') ? url : url.startsWith('/') ? url : `/${url}`) : null;
  
  // Timeout handling
  const timeout = options.timeout || 15000;

  const fetchData = useCallback(async () => {
    // Skip if URL is null
    if (!sanitizedUrl) {
      setLoading(false);
      return;
    }
    
    // Create a timeout controller for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);
    
    try {
      setLoading(true);
      console.log(`Fetching data from ${sanitizedUrl} (attempt ${requestCount + 1})`);
      
      const response = await api.get(sanitizedUrl, {
        signal: controller.signal,
      });
      
      console.log(`Data received from ${sanitizedUrl}:`, Array.isArray(response.data) ? `${response.data.length} items` : 'object');
      setData(response.data);
      setError(null);
    } catch (err) {
      if (err.name === 'AbortError' || err.code === 'ECONNABORTED') {
        console.error(`Request timeout for ${sanitizedUrl}`);
        setError(new Error('Request timed out. Please try again later.'));
      } else {
        console.error(`Error fetching data from ${sanitizedUrl}:`, err);
        setError(err);
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [sanitizedUrl, timeout, requestCount]);

  useEffect(() => {
    // Only fetch if we have a valid URL
    if (sanitizedUrl) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [sanitizedUrl, fetchData]);
  
  const refetch = useCallback(() => {
    setRequestCount(prev => prev + 1);
    return fetchData();
  }, [fetchData]);

  return { 
    data, 
    loading, 
    error, 
    refetch 
  };
}

// POST utility
export const apiPost = async (url, data) => {
  // Add null check for URL
  if (!url) throw new Error('URL is required for API call');
  
  const sanitizedUrl = url.startsWith('/api/') ? url : url.startsWith('/') ? url : `/${url}`;
  try {
    console.log(`Posting to ${sanitizedUrl}`);
    const response = await api.post(sanitizedUrl, data);
    return response.data;
  } catch (err) {
    console.error(`Error in POST to ${sanitizedUrl}:`, err);
    console.error('Response data:', err.response?.data);
    throw err;
  }
};

// PUT utility
export const apiPut = async (url, data) => {
  // Add null check for URL
  if (!url) throw new Error('URL is required for API call');
  
  const sanitizedUrl = url.startsWith('/api/') ? url : url.startsWith('/') ? url : `/${url}`;
  try {
    console.log(`Putting to ${sanitizedUrl}`);
    const response = await api.put(sanitizedUrl, data);
    return response.data;
  } catch (err) {
    console.error(`Error in PUT to ${sanitizedUrl}:`, err);
    console.error('Response data:', err.response?.data);
    throw err;
  }
};

// DELETE utility
export const apiDelete = async (url) => {
  // Add null check for URL
  if (!url) throw new Error('URL is required for API call');
  
  const sanitizedUrl = url.startsWith('/api/') ? url : url.startsWith('/') ? url : `/${url}`;
  try {
    console.log(`Deleting ${sanitizedUrl}`);
    const response = await api.delete(sanitizedUrl);
    return response.data;
  } catch (err) {
    console.error(`Error in DELETE to ${sanitizedUrl}:`, err);
    console.error('Response data:', err.response?.data);
    throw err;
  }
};

// Check that apiGet and other functions are properly exported

// If exports are missing, add or fix them like this:
export const apiGet = async (url) => {
  // Implementation
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }
  return response.json();
};

export default api;
