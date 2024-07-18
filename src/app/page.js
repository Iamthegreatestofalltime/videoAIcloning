'use client';

import { useState, useEffect } from 'react';
import Chat from './components/chat';
import DataContainer from './components/DataContainer';
import axios from 'axios';
import IdeaGenerator from './components/IdeaGenerator';
import Navigation from './components/Navigation';

export default function Home() {
  const [username, setUsername] = useState('');
  const [localuser, setLocalUser] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [isLoading, setIsLoading] = useState(false);
  const [displayData, setDisplayData] = useState(false);
  const [userId, setUserId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [availablePlatforms, setAvailablePlatforms] = useState([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [token, setToken] = useState('');
  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    console.log('Component mounted');
    // Load data from localStorage only on the client side
    const lastUsername = localStorage.getItem('lastUsername');
    const lastPlatform = localStorage.getItem('lastPlatform');
    if (lastPlatform) {
      setPlatform(lastPlatform);
      setDisplayData(true);
    }

    // Load userId from localStorage
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
      console.log('userData:', userData);
      if (userData.userId) {
        setUserId(userData.userId);
        setToken(userData.token);
        console.log('userId set:', userData.userId);
        fetchAvailablePlatforms(userData.userId);
      } else {
        console.warn('User ID not found in userData object');
      }
    } else {
      console.warn('userData not found in localStorage');
    }
    if(userData.username){
      setLocalUser(userData.username);
    }
    else{
      console.warn("username in user data not found");
    }
  }, []);

  const fetchAvailablePlatforms = async (userId) => {
    try {
      const response = await fetch(`/api/available-platforms?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const platforms = await response.json();
      setAvailablePlatforms(platforms);
    } catch (error) {
      console.error('Error fetching available platforms:', error);
    }
  };

  const handlePlatformSelection = (platform) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleScrape = async (e) => {
    console.log('handleScrape function called'); // Add this line
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage('Starting scraping process...');

    try {
      if (!userId) {
        throw new Error('User ID not found. Please log in.');
      }

      setStatusMessage(`Sending request to scrape ${platform} for user ${username}...`);
      console.log(`Sending request to scrape ${platform} for user ${username} with userId ${userId}`);

      const response = await fetch(`/api/${platform}-scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, userId }),
      });

      setUsername('');

      setStatusMessage('Received response from server. Processing...');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Scraping failed');
      }

      const result = await response.json();
      console.log('Scraping result:', result);

      setStatusMessage(`Scraping completed. Found ${result.itemCount} items.`);
      setDisplayData(true);
      // Save username and platform to local storage
      localStorage.setItem('lastUsername', username);
      localStorage.setItem('lastPlatform', platform);
    } catch (error) {
      console.error('Error during scraping:', error);
      setStatusMessage(`Error: ${error.message}`);
      alert(error.message || 'An error occurred during scraping. Please try again.');
      setUsername('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <Navigation />
      <div className="flex-1 p-8 ml-64">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-extrabold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            AI Chat and Data Interface
          </h1>
          
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <form 
              onSubmit={(e) => {
                console.log('Form submitted');
                handleScrape(e);
              }} 
              className="flex flex-wrap items-center gap-4"
            >
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
              </select>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={`Enter ${platform} username`}
                className="flex-grow px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                className={`px-6 py-2 rounded-md text-white font-semibold transition-colors duration-300 ${
                  isLoading || !userId
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                }`}
                disabled={isLoading || !userId}
                onClick={() => console.log('Button clicked')}
              >
                {isLoading ? 'Scraping...' : 'Start Scraping'}
              </button>
            </form>
          </div>

          <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-blue-400">Available Data:</h2>
            <div className="flex flex-wrap gap-4">
              {availablePlatforms.map(platform => (
                <label key={platform} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.includes(platform)}
                    onChange={() => handlePlatformSelection(platform)}
                    className="form-checkbox h-5 w-5 text-blue-500 rounded focus:ring-blue-500 focus:ring-offset-gray-800"
                  />
                  <span className="ml-2 text-gray-300">{platform}</span>
                </label>
              ))}
            </div>
          </div>

          {displayData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-blue-400">AI Chat</h2>
                <Chat username={username} platforms={selectedPlatforms} userId={userId} />
              </div>
              <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-blue-400">Data Visualization</h2>
                <DataContainer username={username} platforms={selectedPlatforms} userId={userId} />
              </div>
            </div>
          )}
          {displayData && (
            <IdeaGenerator username={localuser} platform={platform} userId={userId} />
          )}
        </div>
      </div>
    </div>
  );
}