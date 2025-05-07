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
    value: string; // Exact value in the Algolia index
    filterValue: string; // Raw filter syntax for Algolia
  }
  
  const statusOptions: StatusOption[] = [
    { label: 'Read', value: 'read', filterValue: 'status:read' },
    { label: 'Currently Reading', value: 'reading', filterValue: 'status:reading' },
    { label: 'To Read', value: 'to-read', filterValue: 'status:to-read OR status:toRead' }
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
        filters.push(`status:${statusFilter}`);
      } else {
        filters.push(`status:${statusFilter}`);
      }
    }
    
    if (categoryFilter) {
      // Categories are stored as an array in Algolia, so we need to search within the array
      filters.push(`categories:${categoryFilter}`);
    }
    
    if (ratingFilter) {
      filters.push(`rating:${ratingFilter}`);
    }
    
    // Add debug logging
    console.log('DEBUG: Building filters string with:', filters);
    
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
    
    // Use the filterValue from statusOptions which has the exact filter syntax
    if (status) {
      // Find the selected status option to get its filterValue
      const selectedOption = statusOptions.find(option => option.value === status);
      if (selectedOption) {
        filters.push(selectedOption.filterValue);
      }
    }
    
    if (categoryFilter) filters.push(`categories:${categoryFilter}`);
    if (ratingFilter) filters.push(`rating:${ratingFilter}`);
    
    console.log('DEBUG: updateStatusFilter with', filters);
    
    onFilterChange({
      search,
      filters: filters.length > 0 ? filters.join(' AND ') : ''
    });
  };
  
  const updateCategoryFilter = (category: string) => {
    setCategoryFilter(category);
    // Need to update filters immediately without relying on state updates
    const filters = [];
    
    // Handle status filter
    if (statusFilter) {
      filters.push(`status:${statusFilter}`);
    }
    
    // Handle category filter
    if (category) filters.push(`categories:${category}`);
    if (ratingFilter) filters.push(`rating:${ratingFilter}`);
    
    console.log('DEBUG: updateCategoryFilter with', filters);
    
    onFilterChange({
      search,
      filters: filters.length > 0 ? filters.join(' AND ') : ''
    });
  };
  
  const updateRatingFilter = (rating: string) => {
    setRatingFilter(rating);
    // Need to update filters immediately without relying on state updates
    const filters = [];
    
    // Handle status filter
    if (statusFilter) {
      filters.push(`status:${statusFilter}`);
    }
    
    // Handle other filters
    if (categoryFilter) filters.push(`categories:${categoryFilter}`);
    if (rating) filters.push(`rating:${rating}`);
    
    console.log('DEBUG: updateRatingFilter with', filters);
    
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
                
                // Use the exact filter syntax from statusOptions
                if (statusFilter) {
                  const selectedOption = statusOptions.find(option => option.value === statusFilter);
                  if (selectedOption) {
                    filters.push(selectedOption.filterValue);
                  }
                }
                
                if (categoryFilter) filters.push(`categories:${categoryFilter}`);
                if (ratingFilter) filters.push(`rating:${ratingFilter}`);
                
                console.log('DEBUG: Search onChange with', filters);
                
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
              
              // Use the exact filter syntax from statusOptions
              if (statusFilter) {
                const selectedOption = statusOptions.find(option => option.value === statusFilter);
                if (selectedOption) {
                  filters.push(selectedOption.filterValue);
                }
              }
              
              if (categoryFilter) filters.push(`categories:${categoryFilter}`);
              if (ratingFilter) filters.push(`rating:${ratingFilter}`);
              
              console.log('DEBUG: Search onKeyPress with', filters);
              
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
