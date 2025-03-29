'use client';

import { useState, useEffect } from 'react';
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

  // Remove the leading '/api' if the URL already starts with it
  // This prevents double /api/api/ paths
  const sanitizedUrl = url.startsWith('/api/') ? url : url.startsWith('/') ? url : `/${url}`;

  const fetchData = async () => {
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
  };

  useEffect(() => {
    if (url) fetchData();
  }, [url]);

  return { data, loading, error, refetch: fetchData };
}

// POST utility
export async function apiPost(url, data) {
  const sanitizedUrl = url.startsWith('/api/') ? url : url.startsWith('/') ? url : `/${url}`;
  try {
    const response = await api.post(sanitizedUrl, data);
    return response.data;
  } catch (err) {
    console.error(`Error in POST to ${sanitizedUrl}:`, err);
    console.error('Response data:', err.response?.data);
    throw err;
  }
}

// PUT utility
export async function apiPut(url, data) {
  const sanitizedUrl = url.startsWith('/api/') ? url : url.startsWith('/') ? url : `/${url}`;
  try {
    const response = await api.put(sanitizedUrl, data);
    return response.data;
  } catch (err) {
    console.error(`Error in PUT to ${sanitizedUrl}:`, err);
    console.error('Response data:', err.response?.data);
    throw err;
  }
}

// DELETE utility
export async function apiDelete(url) {
  const sanitizedUrl = url.startsWith('/api/') ? url : url.startsWith('/') ? url : `/${url}`;
  try {
    const response = await api.delete(sanitizedUrl);
    return response.data;
  } catch (err) {
    console.error(`Error in DELETE to ${sanitizedUrl}:`, err);
    console.error('Response data:', err.response?.data);
    throw err;
  }
}

export default api;
