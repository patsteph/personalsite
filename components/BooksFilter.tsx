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
  
  // Available filter options
  const statuses = ['Read', 'Currently Reading', 'To Read'];
  const categories = ["Fiction", "Non-Fiction", "Science Fiction", "Fantasy", "Business", "Self-Help", "Biography"];
  const ratings = [5, 4, 3, 2, 1];
  
  // Function to update filters and trigger search
  const applyFilters = () => {
    // Build Algolia filters
    let filters = [];
    
    if (statusFilter) {
      filters.push(`status:${statusFilter}`);
    }
    
    if (categoryFilter) {
      filters.push(`category:${categoryFilter}`);
    }
    
    if (ratingFilter) {
      filters.push(`rating:${ratingFilter}`);
    }
    
    // Notify parent component
    onFilterChange({
      search,
      filters: filters.join(' AND ')
    });
  };
  
  // Apply initial filters on mount
  useEffect(() => {
    applyFilters();
  }, []);
  
  // Helper functions to update filters and immediately trigger search
  const updateStatusFilter = (status: string) => {
    setStatusFilter(status);
    setTimeout(() => applyFilters(), 10); // Small timeout to ensure state update is processed
  };
  
  const updateCategoryFilter = (category: string) => {
    setCategoryFilter(category);
    setTimeout(() => applyFilters(), 10);
  };
  
  const updateRatingFilter = (rating: string) => {
    setRatingFilter(rating);
    setTimeout(() => applyFilters(), 10);
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
                if (statusFilter) filters.push(`status:${statusFilter}`);
                if (categoryFilter) filters.push(`category:${categoryFilter}`);
                if (ratingFilter) filters.push(`rating:${ratingFilter}`);
                
                onFilterChange({
                  search: newValue,
                  filters: filters.join(' AND ')
                });
              }, 300);
            }
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              // Manually trigger filter update
              const filters = [];
              if (statusFilter) filters.push(`status:${statusFilter}`);
              if (categoryFilter) filters.push(`category:${categoryFilter}`);
              if (ratingFilter) filters.push(`rating:${ratingFilter}`);
              
              onFilterChange({
                search,
                filters: filters.join(' AND ')
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
          {statuses.map(status => (
            <option key={status} value={status}>{status}</option>
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
