'use client';

import React, { useState, useRef } from 'react';
import Navigation from '../components/Navigation';
import VidClone from '../components/VidClone';

export default function AIAvatar() {
    const [textInput, setTextInput] = useState('');
    const [audioFile, setAudioFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const audioRef = useRef(null);

    const handleTextChange = (e) => {
        setTextInput(e.target.value);
    };

    const handleAudioChange = (e) => {
        setAudioFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setResult(null);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('text', textInput);
            formData.append('audio', audioFile);

            const response = await fetch('/api/voice-clone', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to process');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setResult(url);
        } catch (error) {
            console.error('Error:', error);
            setError(error.message || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
            <Navigation />
            <div className="flex-1 p-8 ml-64">
                <h1 className="text-4xl font-bold mb-8 text-center">AI Avatar</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-2xl font-bold mb-6 text-center">Voice Clone</h2>
                        <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-lg shadow-lg">
                            <div className="mb-6">
                                <label htmlFor="textInput" className="block text-sm font-medium mb-2">Text Input</label>
                                <input
                                    type="text"
                                    id="textInput"
                                    value={textInput}
                                    onChange={handleTextChange}
                                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter your text here"
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label htmlFor="audioInput" className="block text-sm font-medium mb-2">Audio Input</label>
                                <input
                                    type="file"
                                    id="audioInput"
                                    onChange={handleAudioChange}
                                    accept="audio/*"
                                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:opacity-50"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Processing...' : 'Clone Voice'}
                            </button>
                        </form>
                        {error && (
                            <div className="mt-8 p-4 bg-red-600 rounded-lg">
                                <h2 className="text-xl font-bold mb-2">Error:</h2>
                                <p>{error}</p>
                            </div>
                        )}
                        {result && (
                            <div className="mt-8 p-4 bg-gray-700 rounded-lg">
                                <h2 className="text-xl font-bold mb-2">Result:</h2>
                                <audio ref={audioRef} controls src={result} className="w-full mt-2" />
                                <a
                                    href={result}
                                    download="cloned_voice.wav"
                                    className="block mt-4 text-center bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-300"
                                >
                                    Download Audio
                                </a>
                            </div>
                        )}
                    </div>
                    <div>
                        <VidClone />
                    </div>
                </div>
            </div>
        </div>
    );
}