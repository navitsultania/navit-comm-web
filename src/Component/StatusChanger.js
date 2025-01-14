import React, { createContext, useEffect, useRef } from 'react';
import axios from 'axios';
import { apiUrl } from '../Environment/Environment';

const StatusChnager = createContext();

const VisibilityProvider = ({ children }) => {
const timeoutRef = useRef(null);
  const hitApi = (action) => {
    debugger;
    const token = localStorage.getItem('token');
     axios.post(`${apiUrl}/ChatMessage/status/${action}`,null, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }).catch(error => {
        console.error('Error occurred: when get offline/online', error);
        // Optionally, log the component name or other context
      });;
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      timeoutRef.current = setTimeout(() => {
        hitApi('offline');
      }, 30000); // 30 seconds
    } else {
      clearTimeout(timeoutRef.current);
      hitApi('online');
    }
  };

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <StatusChnager.Provider value={{}}>
      {children}
    </StatusChnager.Provider>
  );
};

export { VisibilityProvider, StatusChnager };