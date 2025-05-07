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
    searchValue: string; // Simple value to use for text search
  }
  
  const statusOptions: StatusOption[] = [
    { label: 'Read', value: 'read', searchValue: 'read' },
    { label: 'Currently Reading', value: 'reading', searchValue: 'reading' },
    { label: 'To Read', value: 'to-read', searchValue: 'to-read' }
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
    
    // Get the selected option
    const selectedOption = status ? statusOptions.find(option => option.value === status) : null;
    
    // If it's a status filter, use simple text search directly
    if (selectedOption) {
      onFilterChange({
        search: selectedOption.searchValue, // Use simple value for text search
        filters: '' // No need for additional filters
      });
      console.log(`DEBUG: Using simple search value: ${selectedOption.searchValue}`);
    } else {
      // Reset filters if no status selected
      onFilterChange({
        search,
        filters: ''
      });
    }
  };
  
  const updateCategoryFilter = (category: string) => {
    setCategoryFilter(category);
    
    // Simply add the category as a search term
    // Since the status approach is working using direct search, we'll try the same
    let searchValue = search;
    
    // Add category to the search if it exists
    if (category) {
      // Combine with existing search if any
      searchValue = search ? `${search} ${category}` : category;
    }
    
    console.log(`DEBUG: Using simple category search: ${searchValue}`);
    
    onFilterChange({
      search: searchValue,
      filters: ''
    });
  };
  
  const updateRatingFilter = (rating: string) => {
    setRatingFilter(rating);
    
    // Since direct search approach is working, let's use it for ratings too
    let searchValue = search;
    
    // Add rating to the search if it exists
    if (rating) {
      // We'll search for "5 stars" or similar since rating is a number
      const ratingText = `${rating} star`;
      searchValue = search ? `${search} ${ratingText}` : ratingText;
    }
    
    console.log(`DEBUG: Using simple rating search: ${searchValue}`);
    
    onFilterChange({
      search: searchValue,
      filters: ''
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
                // If we have a status filter, combine it with the search
                if (statusFilter) {
                  const selectedOption = statusOptions.find(option => option.value === statusFilter);
                  if (selectedOption) {
                    // Combine user's search text with status value
                    const combinedSearch = newValue ? `${newValue} ${selectedOption.searchValue}` : selectedOption.searchValue;
                    
                    console.log(`DEBUG: Combined search: "${combinedSearch}"`);
                    
                    onFilterChange({
                      search: combinedSearch,
                      filters: ''
                    });
                    return; // Exit early since we're using search query approach
                  }
                }
                
                // Default case - just use the search text and any non-status filters
                const filters = [];
                if (categoryFilter) filters.push(`categories:${categoryFilter}`);
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
              
              // If we have a status filter, use search query approach
              if (statusFilter) {
                const selectedOption = statusOptions.find(option => option.value === statusFilter);
                if (selectedOption) {
                  // Combine user's search text with status value
                  const combinedSearch = search ? `${search} ${selectedOption.searchValue}` : selectedOption.searchValue;
                  
                  console.log(`DEBUG: Combined search on Enter: "${combinedSearch}"`);
                  
                  onFilterChange({
                    search: combinedSearch,
                    filters: ''
                  });
                  return; // Exit early
                }
              }
              
              // Default case - just use the search text and any non-status filters
              const filters = [];
              if (categoryFilter) filters.push(`categories:${categoryFilter}`);
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
