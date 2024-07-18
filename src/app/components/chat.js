'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';

const Chat = ({ username, platforms, userId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const platform = platforms[0]; // Using the first platform

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    console.log(platform);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input, username, platform, userId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let aiMessage = { text: '', sender: 'ai' };
      setMessages(prev => [...prev, aiMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        try {
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.trim() !== '') {
              const jsonLine = JSON.parse(line);
              if (jsonLine.response) {
                aiMessage.text += jsonLine.response;
                setMessages(prev => [...prev.slice(0, -1), { ...aiMessage }]);
              }
            }
          }
        } catch (jsonError) {
          // If JSON parsing fails, treat the chunk as plain text
          aiMessage.text += chunk;
          setMessages(prev => [...prev.slice(0, -1), { ...aiMessage }]);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 bg-gray-900">
        <h2 className="text-2xl font-bold text-center text-white">AI Chat ({platform})</h2>
      </div>
      <div className="h-96 overflow-y-auto space-y-4 p-4 bg-gray-800">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              message.sender === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-200'
            }`}>
              {message.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 bg-gray-900">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-grow px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button 
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
            disabled={isLoading}
          >
            <Send className="w-4 h-4 mr-2" />
            Send
          </button>
        </form>
      </div>
      <style jsx>{`
        .loading-dots {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .loading-dots span {
          width: 8px;
          height: 8px;
          margin: 0 4px;
          background-color: #fff;
          border-radius: 50%;
          display: inline-block;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
        .loading-dots span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
      `}</style>
    </div>
  );
};

export default Chat;