
"use client"

import { useState, useEffect } from 'react';

export function useTypingEffect(text: string, speed: number = 20, isInstant: boolean = false) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!text) {
        setDisplayedText('');
        return;
    }

    if (isInstant || speed === 0) {
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
    
  }, [text, speed, isInstant]);

  return displayedText;
}

    

    