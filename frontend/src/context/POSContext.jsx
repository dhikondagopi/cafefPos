import React, { createContext, useState, useContext } from 'react';

const POSContext = createContext(null);

export const POSProvider = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTable, setActiveTable] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  const value = {
    searchTerm,
    setSearchTerm,
    activeTable,
    setActiveTable,
    activeOrder,
    setActiveOrder,
    refreshTrigger,
    triggerRefresh
  };

  return <POSContext.Provider value={value}>{children}</POSContext.Provider>;
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};
