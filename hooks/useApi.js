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
});

// Utility for GET requests with React hook
export function useGet(url, initialData = null) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add null check for URL to prevent "startsWith" errors
  const sanitizedUrl = url ? (url.startsWith('/api/') ? url : url.startsWith('/') ? url : `/${url}`) : null;

  const fetchData = useCallback(async () => {
    // Skip if URL is null
    if (!sanitizedUrl) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.get(sanitizedUrl);
      setData(response.data);
      setError(null);
    } catch (err) {
      console.error(`Error fetching data from ${sanitizedUrl}:`, err);
      setError(err);
      setData(initialData);
    } finally {
      setLoading(false);
    }
  }, [sanitizedUrl, initialData]);

  useEffect(() => {
    // Only fetch if we have a valid URL
    if (sanitizedUrl) fetchData();
    else setLoading(false);
  }, [sanitizedUrl, fetchData]);

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchData 
  };
}

// POST utility using useCallback to ensure stable function reference
export const apiPost = async (url, data) => {
  // Add null check for URL
  if (!url) throw new Error('URL is required for API call');
  
  const sanitizedUrl = url.startsWith('/api/') ? url : url.startsWith('/') ? url : `/${url}`;
  try {
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
    const response = await api.delete(sanitizedUrl);
    return response.data;
  } catch (err) {
    console.error(`Error in DELETE to ${sanitizedUrl}:`, err);
    console.error('Response data:', err.response?.data);
    throw err;
  }
};

export default api;
