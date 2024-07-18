"use client"

import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';

const platforms = ['instagram', 'tiktok', 'linkedin', 'facebook', 'twitter'];

export default function SocialMedia() {
    const [userInput, setUserInput] = useState('');
    const [platform, setPlatform] = useState('instagram');
    const [generatedContent, setGeneratedContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [userId, setUserId] = useState(null);
  
    useEffect(() => {
      // Retrieve userData from localStorage
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      setUserId(userData.userId || null);
    }, []);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      setGeneratedContent('');
    
      try {
        const response = await fetch('/api/videoscript', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userInput, platform, userId }),
        });
    
        if (!response.ok) {
          throw new Error('Failed to generate content');
        }
    
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
    
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          setGeneratedContent(prevContent => prevContent + chunk);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-100">
      <Navigation className="w-64 bg-gray-800" />
      <main className="flex-1 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-blue-400">Social Media Content Generator</h1>
          <form onSubmit={handleSubmit} className="mb-8">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full p-4 border border-gray-700 rounded-lg mb-4 bg-gray-800 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {platforms.map(p => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Enter context for your content..."
              className="w-full p-4 border border-gray-700 rounded-lg mb-4 bg-gray-800 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="6"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300 ease-in-out disabled:bg-blue-800 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Generating...' : 'Generate Content'}
            </button>
          </form>
          {generatedContent && (
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-semibold mb-4 text-blue-400">Generated Content:</h2>
              <pre className="whitespace-pre-wrap bg-gray-700 p-4 rounded-lg text-gray-300">{generatedContent}</pre>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}