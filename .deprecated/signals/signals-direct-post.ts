/**
 * Ultra Simple Signal API - Direct POST Only
 * This endpoint specifically handles POST requests only, with minimal complexity
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from '@/lib/firebase-admin';

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  // Set essential CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  
  // Log basic information about the request
  console.log('SIGNALS-DIRECT-POST API CALLED:', req.method);
  
  // Handle OPTIONS requests for CORS
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return res.status(200).end();
  }
  
  // Only handle POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests'
    });
  }
  
  try {
    // Initialize Firestore
    const signalsCollection = firestore.collection('signals');
    
    // Parse the request body
    let signalData;
    if (typeof req.body === 'string') {
      try {
        signalData = JSON.parse(req.body);
      } catch (e) {
        console.error('Error parsing JSON body:', e);
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON',
          message: 'Unable to parse request body as JSON'
        });
      }
    } else {
      signalData = req.body;
    }
    
    console.log('Received signal data:', signalData);
    
    // Add required fields if missing
    const now = new Date().toISOString();
    if (!signalData.dateAdded) {
      signalData.dateAdded = now;
    }
    
    if (!signalData.tags) {
      signalData.tags = [];
    }
    
    if (typeof signalData.featured !== 'boolean') {
      signalData.featured = false;
    }
    
    // Newsletter specific validation
    if (signalData.type === 'newsletter') {
      if (!signalData.subscriptionUrl) {
        signalData.subscriptionUrl = signalData.url;
      }
      if (!signalData.publisher) {
        signalData.publisher = 'Unknown Publisher';
      }
      if (!signalData.frequency) {
        signalData.frequency = 'weekly';
      }
    }
    
    // Article specific validation
    if (signalData.type === 'article') {
      if (!signalData.author) {
        signalData.author = 'Unknown Author';
      }
      if (!signalData.source) {
        signalData.source = 'Unknown Source';
      }
      if (!signalData.publishDate) {
        signalData.publishDate = now;
      }
    }
    
    // Save to Firestore
    try {
      console.log('Attempting to add document to Firestore');
      const docRef = await signalsCollection.add(signalData);
      console.log('Document successfully added with ID:', docRef.id);
      
      // Return success
      return res.status(201).json({
        success: true,
        message: 'Signal created successfully',
        id: docRef.id,
        data: {
          id: docRef.id,
          ...signalData
        }
      });
    } catch (firestoreError) {
      console.error('Error adding document to Firestore:', firestoreError);
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: 'Error saving signal to database',
        details: firestoreError instanceof Error ? firestoreError.message : String(firestoreError)
      });
    }
  } catch (error) {
    console.error('Unhandled error in signals-direct-post API:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}