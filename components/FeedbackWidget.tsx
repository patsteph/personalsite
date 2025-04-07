import { useState, FormEvent, ChangeEvent } from 'react';
import { FiMessageSquare } from 'react-icons/fi'; // Message icon instead of light bulb

const FeedbackWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      // Send to your API endpoint
      await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          feedback,
          page: window.location.pathname,
          timestamp: new Date().toISOString()
        }),
      });
      
      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setFeedback('');
        setCategory('');
      }, 3000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };
  
  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-steel-blue text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:bg-accent"
          aria-label="Open feedback form"
        >
          <FiMessageSquare size={24} />
        </button>
      ) : (
        <div className="bg-white p-4 rounded-lg shadow-xl w-72 animate-scaleIn">
          {!submitted ? (
            <form onSubmit={handleSubmit}>
              <h3 className="font-bold mb-2">Share your thoughts</h3>
              <select
                value={category}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value)}
                className="w-full mb-2 p-2 border rounded"
                required
              >
                <option value="">Select category</option>
                <option value="functionality">Functionality</option>
                <option value="problems">Problems</option>
                <option value="content">Content Suggestions</option>
                <option value="design">Design Feedback</option>
                <option value="feature">Feature Requests</option>
              </select>
              <textarea
                value={feedback}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFeedback(e.target.value)}
                className="w-full p-2 border rounded mb-2"
                placeholder="Your feedback (max 500 characters)"
                maxLength={500}
                rows={4}
                required
              />
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-steel-blue text-white rounded hover:bg-accent"
                >
                  Submit
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-4">
              <p className="font-medium text-green-600 mb-2">Thank you for your feedback!</p>
              <p className="text-sm text-gray-600">Your input helps us improve.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeedbackWidget;
