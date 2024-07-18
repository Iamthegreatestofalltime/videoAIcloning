'use client';

import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const DataContainer = ({ username, platforms, userId }) => {
  const [data, setData] = useState({});
  const [editingCell, setEditingCell] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePlatform, setActivePlatform] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState({});
  const [columnOrder, setColumnOrder] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (platforms.length > 0) {
      setActivePlatform(platforms[0]);
      fetchData(platforms[0]);
    }
  }, [platforms, userId]);

  const refreshToken = async () => {
    try {
      const response = await axios.post('/api/refresh-token', { userId });
      const newToken = response.data.token;
      localStorage.setItem('userData', JSON.stringify({ ...JSON.parse(localStorage.getItem('userData')), token: newToken }));
      return newToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  };

  const fetchData = async (platform) => {
    try {
      setIsLoading(true);
      let userData = JSON.parse(localStorage.getItem('userData'));
      let token = userData.token;
  
      // Check if token is expired
      const decodedToken = jwtDecode(token);
      if (decodedToken.exp * 1000 < Date.now()) {
        console.log('Token expired, attempting to refresh...');
        token = await refreshToken();
      }
  
      const response = await axios.get(`/api/data`, {
        params: { userId, platform },
        headers: { 'Authorization': `Bearer ${token}` }
      });
  
      setData(prevData => ({...prevData, [platform]: response.data}));
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.error('Authentication failed. Please log in again.');
        // Implement logout logic here
      } else {
        console.error('Error fetching data:', error.response ? error.response.data : error.message);
        setError(error.response ? error.response.data.error : 'Failed to load data. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (platform, index, key, value) => {
    setEditingCell({ platform, index, key, value });
  };

  const handleSave = async (platform, index, key, value) => {
    const newData = [...data[platform]];
    newData[index][key] = value;
    setData(prevData => ({...prevData, [platform]: newData}));
    setEditingCell(null);
  
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      const token = userData.token;
  
      await axios.post('/api/data', 
        { userId, platform, data: newData },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error saving data:', error.response ? error.response.data : error.message);
    }
  };

  const truncateText = (text, maxLength = 100) => {
    if (typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data || Object.keys(data).length === 0) return <div>No data available</div>;

  const toggleColumnVisibility = (platform, column) => {
    setVisibleColumns(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [column]: !prev[platform]?.[column]
      }
    }));
  };

  const moveColumn = (platform, dragIndex, hoverIndex) => {
    const newOrder = [...columnOrder[platform]];
    const [reorderedItem] = newOrder.splice(dragIndex, 1);
    newOrder.splice(hoverIndex, 0, reorderedItem);
    setColumnOrder(prev => ({ ...prev, [platform]: newOrder }));
  };

  const DraggableHeader = ({ column, index, moveColumn }) => {
    const [, drag] = useDrag({
      type: 'COLUMN',
      item: { index },
    });

    const [, drop] = useDrop({
      accept: 'COLUMN',
      hover(item, monitor) {
        if (!ref.current) return;
        const dragIndex = item.index;
        const hoverIndex = index;
        if (dragIndex === hoverIndex) return;
        moveColumn(dragIndex, hoverIndex);
        item.index = hoverIndex;
      },
    });

    const ref = React.useRef(null);
    drag(drop(ref));

    return (
      <th ref={ref} className="border-b border-r border-gray-700 text-left p-2 bg-gray-900 sticky top-0">
        {column}
        <button onClick={() => toggleColumnVisibility(activePlatform, column)} className="ml-2">
          {visibleColumns[activePlatform]?.[column] ? '👁️' : '👁️‍🗨️'}
        </button>
      </th>
    );
  };

  const renderTable = (platform) => {
    const platformData = data[platform];
    if (!platformData || platformData.length === 0) return null;

    const keys = columnOrder[platform] || Object.keys(platformData[0]);
    const filteredData = platformData.filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    return (
      <DndProvider backend={HTML5Backend}>
        <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
          <table className="min-w-full bg-gray-800 text-white border-collapse">
            <thead>
              <tr>
                {keys.map((key, index) => (
                  visibleColumns[platform]?.[key] !== false && (
                    <DraggableHeader
                      key={key}
                      column={key}
                      index={index}
                      moveColumn={(dragIndex, hoverIndex) => moveColumn(platform, dragIndex, hoverIndex)}
                    />
                  )
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, rowIndex) => (
                <tr key={rowIndex}>
                  {keys.map((key) => (
                    visibleColumns[platform]?.[key] !== false && (
                      <td key={key} className="border-b border-r border-gray-700 p-2">
                        {editingCell && editingCell.platform === platform && editingCell.index === rowIndex && editingCell.key === key ? (
                          <textarea
                            value={editingCell.value}
                            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                            onBlur={() => handleSave(platform, rowIndex, key, editingCell.value)}
                            className="bg-gray-700 text-white w-full min-h-[100px] resize-vertical"
                            autoFocus
                          />
                        ) : (
                          <div
                            onClick={() => handleEdit(platform, rowIndex, key, item[key])}
                            className="cursor-pointer hover:bg-gray-700 transition-colors duration-200 min-h-[30px]"
                          >
                            {truncateText(String(item[key]))}
                          </div>
                        )}
                      </td>
                    )
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DndProvider>
    );
  };

  return (
    <div className="overflow-x-auto">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        {platforms.map(platform => (
          <button
            key={platform}
            onClick={() => setActivePlatform(platform)}
            className={`px-4 py-2 rounded ${activePlatform === platform ? 'bg-blue-600 text-white' : 'bg-gray-300 text-black'}`}
          >
            {platform}
          </button>
        ))}
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 bg-gray-700 text-white rounded"
        />
      </div>
      {activePlatform && renderTable(activePlatform)}
    </div>
  );
};

export default DataContainer;