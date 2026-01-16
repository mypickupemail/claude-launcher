'use client';

import { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { playSound, preloadSounds, initAudio, type SoundName } from '@/lib/sounds';

interface SoundContextValue {
  play: (sound: SoundName) => void;
}

const SoundContext = createContext<SoundContextValue>({
  play: () => {},
});

export function useSounds() {
  return useContext(SoundContext);
}

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);

  // Initialize audio on first user interaction
  const handleFirstInteraction = useCallback(() => {
    if (!initialized.current) {
      initialized.current = true;
      initAudio();
      preloadSounds();
    }
  }, []);

  useEffect(() => {
    // Listen for first interaction
    const events = ['click', 'keydown', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleFirstInteraction, { once: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleFirstInteraction);
      });
    };
  }, [handleFirstInteraction]);

  const play = useCallback((sound: SoundName) => {
    playSound(sound);
  }, []);

  return (
    <SoundContext.Provider value={{ play }}>
      {children}
    </SoundContext.Provider>
  );
}
