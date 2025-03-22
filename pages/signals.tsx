// pages/signals.tsx
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { GetStaticProps } from 'next';
import Layout from '@/components/layout/Layout';
import { NewsletterList, ArticleList, SignalDetail } from '@/components/signals';
import { Newsletter, Article, Signal } from '@/types';
import * as api from '@/lib/api';

interface SignalsPageProps {
  newsletters: Newsletter[];
  articles: Article[];
  error?: string;
}

export default function SignalsPage({ newsletters, articles, error }: SignalsPageProps) {
  const [activeTab, setActiveTab] = useState<'newsletters' | 'articles'>('newsletters');
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  // Combine all signals to extract unique tags
  const allSignals = [...newsletters, ...articles];
  const allTags = [...new Set(allSignals.flatMap(signal => signal.tags || []))];
  
  // Filter signals based on search and tags
  const filteredNewsletters = newsletters.filter(newsletter => {
    const matchesSearch = !searchTerm || 
      newsletter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      newsletter.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      newsletter.publisher.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = !selectedTag || (newsletter.tags && newsletter.tags.includes(selectedTag));
    
    return matchesSearch && matchesTag;
  });
  
  const filteredArticles = articles.filter(article => {
    const matchesSearch = !searchTerm || 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.source.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = !selectedTag || (article.tags && article.tags.includes(selectedTag));
    
    return matchesSearch && matchesTag;
  });
  
  // Handle viewing signal details
  const handleViewDetails = (signal: Signal) => {
    setSelectedSignal(signal);
  };
  
  // Handle closing signal details
  const handleCloseDetails = () => {
    setSelectedSignal(null);
  };
  
  // Handle tag selection
  const handleTagClick = (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag);
  };
  
  return (
    <Layout currentSection="signals">
      <Head>
        <title>Signals | Patrick Stephens</title>
        <meta name="description" content="Recommended newsletters and articles that I find interesting and valuable." />
      </Head>
      
      <div className="container mx-auto px-4 pb-12">
        {error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
            <p>{error}</p>
          </div>
        ) : (
          <>
            {/* Hero section */}
            <div className="py-8 mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-steel-blue mb-3">Signals</h1>
              <p className="text-lg text-gray-600 max-w-2xl">
                Discover newsletters and articles that I've found particularly interesting and valuable.
                These are resources that have helped me grow personally and professionally.
              </p>
            </div>
            
            {/* Search and filters */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                {/* Search input */}
                <div className="flex-grow">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search signals..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute right-3 top-2.5 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Tab navigation */}
                <div className="flex rounded-lg overflow-hidden border border-gray-300">
                  <button
                    className={`px-4 py-2 ${
                      activeTab === 'newsletters' 
                        ? 'bg-steel-blue text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveTab('newsletters')}
                  >
                    Newsletters ({filteredNewsletters.length})
                  </button>
                  <button
                    className={`px-4 py-2 ${
                      activeTab === 'articles' 
                        ? 'bg-steel-blue text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveTab('articles')}
                  >
                    Articles ({filteredArticles.length})
                  </button>
                </div>
              </div>
              
              {/* Tags */}
              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleTagClick(tag)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        selectedTag === tag
                          ? 'bg-steel-blue text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                  {selectedTag && (
                    <button
                      onClick={() => setSelectedTag(null)}
                      className="px-3 py-1 rounded-full text-sm text-red-600 bg-red-100 hover:bg-red-200"
                    >
                      Clear filter
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="mt-6">
              {activeTab === 'newsletters' ? (
                <NewsletterList 
                  newsletters={filteredNewsletters} 
                  onViewDetails={handleViewDetails}
                />
              ) : (
                <ArticleList 
                  articles={filteredArticles} 
                  onViewDetails={handleViewDetails}
                />
              )}
            </div>
            
            {/* Signal detail modal */}
            {selectedSignal && (
              <SignalDetail 
                signal={selectedSignal} 
                onClose={handleCloseDetails}
              />
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<SignalsPageProps> = async () => {
  try {
    // Fetch newsletters and articles
    const [newsletters, articles] = await Promise.all([
      api.signals.getAllNewsletters(),
      api.signals.getAllArticles()
    ]);
    
    return {
      props: {
        newsletters,
        articles
      },
      // Revalidate every 6 hours
      revalidate: 6 * 60 * 60
    };
  } catch (error) {
    console.error('Error fetching signals data:', error);
    
    return {
      props: {
        newsletters: [],
        articles: [],
        error: 'Failed to load signals data. Please try again later.'
      },
      // On error, revalidate more frequently
      revalidate: 60 * 60
    };
  }
};