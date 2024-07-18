'use client';

import React, { useState } from 'react';
import axios from 'axios';

const IdeaGenerator = ({ username, platform, userId }) => {
  const [ideas, setIdeas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateIdeas = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      const token = userData.token;

      const response = await axios.post('/api/generate-ideas', 
        { username, platform, userId },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setIdeas(response.data.ideas);
    } catch (error) {
      console.error('Error generating ideas:', error);
      setError('Failed to generate ideas. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-blue-400">Content Idea Generator</h2>
      <button
        onClick={generateIdeas}
        disabled={isLoading}
        className={`px-6 py-2 rounded-md text-white font-semibold transition-colors duration-300 ${
          isLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
        }`}
      >
        {isLoading ? 'Generating Ideas...' : 'Generate Ideas'}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {ideas.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xl font-bold mb-2 text-white">Generated Ideas:</h3>
          <ul className="list-disc pl-5 text-gray-300">
            {ideas.map((idea, index) => (
              <li key={index} className="mb-2">{idea}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default IdeaGenerator;