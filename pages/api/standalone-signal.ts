/**
 * Fully standalone signal API that doesn't depend on any external imports
 * This should work regardless of middleware or import issues
 */
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  // Log everything to help debug
  console.log('STANDALONE-SIGNAL API called:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    query: req.query,
    bodyPresent: !!req.body
  });
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return res.status(200).end();
  }
  
  // Response for GET
  if (req.method === 'GET') {
    console.log('Handling GET request');
    
    // Mock data - don't depend on Firestore
    const mockSignals = [
      {
        id: 'mock1',
        type: 'newsletter',
        title: 'Mock Newsletter 1',
        description: 'This is a mock newsletter for testing',
        url: 'https://example.com/newsletter1',
        publisher: 'Test Publisher',
        frequency: 'weekly',
        dateAdded: new Date().toISOString(),
        featured: false,
        tags: ['test', 'mock']
      },
      {
        id: 'mock2',
        type: 'article',
        title: 'Mock Article 1',
        description: 'This is a mock article for testing',
        url: 'https://example.com/article1',
        author: 'Test Author',
        source: 'Test Source',
        dateAdded: new Date().toISOString(),
        featured: true,
        tags: ['test', 'mock', 'article']
      }
    ];
    
    return res.status(200).json({
      success: true,
      message: 'Standalone signal GET successful',
      timestamp: new Date().toISOString(),
      data: mockSignals
    });
  }
  
  // Response for POST
  if (req.method === 'POST') {
    console.log('Handling POST request', req.body);
    
    // Here we would normally validate the token and save to Firestore
    // But for testing we'll just return success with the received data
    
    const receivedData = req.body;
    const mockId = `mock-${Date.now()}`;
    
    return res.status(201).json({
      success: true,
      message: 'Standalone signal POST successful (mock)',
      timestamp: new Date().toISOString(),
      data: {
        id: mockId,
        ...receivedData,
        dateAdded: new Date().toISOString()
      }
    });
  }
  
  // Fallback for other methods
  console.log(`Method ${req.method} not implemented`);
  return res.status(405).json({
    success: false,
    error: `Method ${req.method} not implemented`
  });
}