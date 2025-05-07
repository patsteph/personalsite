import React, { useState, useEffect } from 'react';
import { booksIndex } from '../lib/algolia';

type FilterProps = {
  onFilterChange: (filters: any) => void;
  className?: string;
};

export default function BooksFilter({ onFilterChange, className = '' }: FilterProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  
  // Status values - mapped exactly to the values found in Algolia
  // The database contains status values: "read", "reading", "to-read", "toRead"
  interface StatusOption {
    label: string; // User-friendly display value
    value: string; // Actual value in the database
  }
  
  const statusOptions: StatusOption[] = [
    { label: 'Read', value: 'read' },
    { label: 'Currently Reading', value: 'reading' },
    { label: 'To Read', value: 'to-read' } // Also handle alternative "toRead" format in the query
  ];
  
  // Available filter options for other filters
  const categories = ["Fiction", "Non-Fiction", "Science Fiction", "Fantasy", "Business", "Self-Help", "Biography"];
  const ratings = [5, 4, 3, 2, 1];
  
  // Function to update filters and trigger search
  const applyFilters = () => {
    // Build Algolia filters based on the exact index structure
    let filters = [];
    
    if (statusFilter) {
      // Handle special case for "to-read" which might also be "toRead" in the index
      if (statusFilter === 'to-read') {
        filters.push(`(status:to-read OR status:toRead)`);
      } else {
        filters.push(`status:${statusFilter}`);
      }
    }
    
    if (categoryFilter) {
      // Categories are stored as an array in Algolia, so we need to search within the array
      filters.push(`categories:"${categoryFilter}"`);
    }
    
    if (ratingFilter) {
      filters.push(`rating:${ratingFilter}`);
    }
    
    // Notify parent component
    onFilterChange({
      search,
      filters: filters.length > 0 ? filters.join(' AND ') : ''
    });
  };
  
  // Apply initial filters on mount
  useEffect(() => {
    applyFilters();
  }, []);
  
  // Helper functions to update filters and immediately trigger search
  const updateStatusFilter = (status: string) => {
    setStatusFilter(status);
    // Need to update filters immediately without relying on state updates
    const filters = [];
    
    // Handle special case of "to-read" which might also be "toRead" in the index
    if (status) {
      if (status === 'to-read') {
        filters.push(`(status:to-read OR status:toRead)`);
      } else {
        filters.push(`status:${status}`);
      }
    }
    
    if (categoryFilter) filters.push(`categories:"${categoryFilter}"`);
    if (ratingFilter) filters.push(`rating:${ratingFilter}`);
    
    onFilterChange({
      search,
      filters: filters.length > 0 ? filters.join(' AND ') : ''
    });
  };
  
  const updateCategoryFilter = (category: string) => {
    setCategoryFilter(category);
    // Need to update filters immediately without relying on state updates
    const filters = [];
    
    // Handle status filter first
    if (statusFilter) {
      if (statusFilter === 'to-read') {
        filters.push(`(status:to-read OR status:toRead)`);
      } else {
        filters.push(`status:${statusFilter}`);
      }
    }
    
    // Handle category as array in Algolia
    if (category) filters.push(`categories:"${category}"`);
    if (ratingFilter) filters.push(`rating:${ratingFilter}`);
    
    onFilterChange({
      search,
      filters: filters.length > 0 ? filters.join(' AND ') : ''
    });
  };
  
  const updateRatingFilter = (rating: string) => {
    setRatingFilter(rating);
    // Need to update filters immediately without relying on state updates
    const filters = [];
    
    // Handle status filter first
    if (statusFilter) {
      if (statusFilter === 'to-read') {
        filters.push(`(status:to-read OR status:toRead)`);
      } else {
        filters.push(`status:${statusFilter}`);
      }
    }
    
    // Handle category as array in Algolia
    if (categoryFilter) filters.push(`categories:"${categoryFilter}"`);
    if (rating) filters.push(`rating:${rating}`);
    
    onFilterChange({
      search,
      filters: filters.length > 0 ? filters.join(' AND ') : ''
    });
  };
  
  return (
    <div className={`filters ${className}`}>
      {/* Search - Auto-search after 3 characters */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search books..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={search}
          onChange={(e) => {
            const newValue = e.target.value;
            setSearch(newValue);
            
            // Auto-search after 3+ characters or empty string (show all)
            if (newValue.length >= 3 || newValue === '') {
              // Small delay for typing
              setTimeout(() => {
                const filters = [];
                
                // Handle special case of "to-read" which might also be "toRead" in the index
                if (statusFilter) {
                  if (statusFilter === 'to-read') {
                    filters.push(`(status:to-read OR status:toRead)`);
                  } else {
                    filters.push(`status:${statusFilter}`);
                  }
                }
                
                // Categories are stored as an array in Algolia
                if (categoryFilter) filters.push(`categories:"${categoryFilter}"`);
                if (ratingFilter) filters.push(`rating:${ratingFilter}`);
                
                onFilterChange({
                  search: newValue,
                  filters: filters.length > 0 ? filters.join(' AND ') : ''
                });
              }, 300);
            }
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              // Manually trigger filter update
              const filters = [];
              
              // Handle special case of "to-read" which might also be "toRead" in the index
              if (statusFilter) {
                if (statusFilter === 'to-read') {
                  filters.push(`(status:to-read OR status:toRead)`);
                } else {
                  filters.push(`status:${statusFilter}`);
                }
              }
              
              // Categories are stored as an array in Algolia
              if (categoryFilter) filters.push(`categories:"${categoryFilter}"`);
              if (ratingFilter) filters.push(`rating:${ratingFilter}`);
              
              onFilterChange({
                search,
                filters: filters.length > 0 ? filters.join(' AND ') : ''
              });
            }
          }}
        />
      </div>
      
      {/* Status Filter */}
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Status</h3>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={statusFilter}
          onChange={(e) => updateStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      
      {/* Category Filter */}
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Categories</h3>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={categoryFilter}
          onChange={(e) => updateCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>
      
      {/* Rating Filter */}
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Rating</h3>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={ratingFilter}
          onChange={(e) => updateRatingFilter(e.target.value)}
        >
          <option value="">Any Rating</option>
          {ratings.map(rating => (
            <option key={rating} value={rating}>
              {Array(rating).fill('★').join('')}
              {Array(5-rating).fill('☆').join('')}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
