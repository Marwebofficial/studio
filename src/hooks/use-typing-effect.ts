"use client"

import { useState, useEffect } from 'react';

export function useTypingEffect(text: string, speed: number = 20) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!text) {
        setDisplayedText('');
        return;
    }

    // If speed is 0, display text immediately
    if (speed === 0) {
        setDisplayedText(text);
        return;
    }

    setDisplayedText(''); 
    
    let i = 0;
    const intervalId = setInterval(() => {
      setDisplayedText(text.substring(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(intervalId);
      }
    }, speed);

    return () => clearInterval(intervalId);
    
  }, [text, speed]);

  return displayedText;
}

    