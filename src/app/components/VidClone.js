'use client';

import React, { useState, useRef } from 'react';
import axios from 'axios';

export default function VidClone() {
    const [audioFile, setAudioFile] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const videoRef = useRef(null);

    const handleAudioChange = (e) => {
        setAudioFile(e.target.files[0]);
    };

    const handleVideoChange = (e) => {
        setVideoFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setResult(null);
        setError(null);

        const formData = new FormData();
        formData.append('audio', audioFile);
        formData.append('video', videoFile);

        try {
            const response = await axios.post('http://127.0.0.1:5000/api/process-video', formData, {
                responseType: 'blob',
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            const contentType = response.headers['content-type'];
            if (contentType === 'application/json') {
                // If the response is JSON, it's probably an error message
                const reader = new FileReader();
                reader.onload = () => {
                    const errorData = JSON.parse(reader.result);
                    setError(`Server error: ${errorData.error || 'Unknown error'}`);
                };
                reader.readAsText(response.data);
            } else {
                // If it's not JSON, it should be the video file
                const url = URL.createObjectURL(new Blob([response.data]));
                setResult(url);
            }
        } catch (error) {
            console.error('Error:', error);
            if (error.response) {
                if (error.response.data instanceof Blob) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        try {
                            const errorData = JSON.parse(reader.result);
                            setError(`Server error: ${errorData.error || 'Unknown error'}`);
                        } catch (e) {
                            setError(`Server error: ${error.response.statusText}`);
                        }
                    };
                    reader.readAsText(error.response.data);
                } else {
                    setError(`Server error: ${error.response.data.error || error.response.statusText}`);
                }
            } else if (error.request) {
                setError('No response received from server. Please try again.');
            } else {
                setError(`Error: ${error.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto bg-gray-800 p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center">Video Clone</h2>
            <form onSubmit={handleSubmit}>
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
                <div className="mb-6">
                    <label htmlFor="videoInput" className="block text-sm font-medium mb-2">Video Input</label>
                    <input
                        type="file"
                        id="videoInput"
                        onChange={handleVideoChange}
                        accept="video/*"
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:opacity-50"
                    disabled={isLoading}
                >
                    {isLoading ? 'Processing...' : 'Clone Video'}
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
                    <video ref={videoRef} controls src={result} className="w-full mt-2" />
                    <a
                        href={result}
                        download="processed_video.mp4"
                        className="block mt-4 text-center bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-300"
                    >
                        Download Video
                    </a>
                </div>
            )}
        </div>
    );
}