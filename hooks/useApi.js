'use client';

import { useState, useCallback, useEffect } from 'react';

// Configurer l'URL de base de l'API selon l'environnement
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Helper function to check if a string is a valid MongoDB ObjectId format
// This avoids needing to import MongoDB's ObjectId on the client
function isValidObjectId(id) {
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;
  return objectIdPattern.test(id);
}

export function useGet(url, defaultValue = null) {
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const refetch = useCallback(async () => {
    if (!url) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Special handling for URLs that might contain IDs
      if (url.includes('/api/clients/') || url.includes('/api/orders/') || url.includes('/api/materials/')) {
        // Extract the potential ID from the URL
        const parts = url.split('/');
        const lastSegment = parts[parts.length - 1];
        const idPart = lastSegment.split('?')[0]; // Remove query params if any
        
        // Skip validation for known special routes and empty values
        const specialPaths = ['new', 'stats', 'create'];
        if (!specialPaths.includes(idPart) && idPart) {
          // Validate MongoDB ObjectId format (24 hex characters)
          const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(idPart);
          
          // Log issues but don't throw errors - just to help debugging
          if (!isValidObjectId) {
            console.warn(`Warning: ID in URL doesn't appear to be a valid MongoDB ObjectId: ${idPart}`);
          }
        }
      }
      
      // Continue with the fetch regardless of ID validation
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage;
        try {
          // Try to parse as JSON to get a detailed error message
          const errorJson = JSON.parse(errorData);
          errorMessage = errorJson.error || `API error: ${response.status}`;
        } catch {
          // If not JSON, use the text content or fallback
          errorMessage = errorData || `API error: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error(`Error fetching data from ${url}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [url]);
  
  // Fetch data on mount and when URL changes
  useEffect(() => {
    refetch();
  }, [refetch]);
  
  return { data, loading, error, refetch };
}

// Rest of the API functions
export async function apiGet(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw { 
      response: { 
        status: response.status, 
        data: errorData 
      },
      message: errorData.error || `API error: ${response.status}`
    };
  }
  
  return await response.json();
}

export async function apiPost(endpoint, data, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      ...options,
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      throw { 
        response: { 
          status: response.status, 
          data: responseData 
        },
        message: responseData.error || `API error: ${response.status}`
      };
    }
    
    return responseData;
  } catch (err) {
    console.error(`Error in POST to ${url}:`, err);
    throw err;
  }
}

export async function apiPut(endpoint, data, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    console.log(`Making PUT request to ${url} with data:`, data);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      ...options,
    });
    
    // Attempt to parse response as JSON
    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      responseData = { error: 'Invalid JSON response' };
    }
    
    if (!response.ok) {
      console.error(`Error ${response.status} from API:`, responseData);
      throw { 
        response: { 
          status: response.status, 
          data: responseData 
        },
        message: responseData.error || `API error: ${response.status}`
      };
    }
    
    return responseData;
  } catch (err) {
    console.error(`Error in PUT to ${url}:`, err);
    if (err.response && err.response.data) {
      console.error('Response data:', err.response.data);
    }
    throw err;
  }
}

export async function apiDelete(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    method: 'DELETE',
    ...options,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw { 
      response: { 
        status: response.status, 
        data: errorData 
      },
      message: errorData.error || `API error: ${response.status}`
    };
  }
  
  return await response.json();
}
