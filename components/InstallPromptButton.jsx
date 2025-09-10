'use client';
import { useEffect, useState } from 'react';

export default function InstallPromptButton() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setPromptEvent(e);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!promptEvent || installed) return null;

  const onClick = async () => {
    promptEvent.prompt();
    try { await promptEvent.userChoice; } catch (_) {}
    setPromptEvent(null);
  };

  return (
    <button className="btn btn-outline w-full" onClick={onClick}>
      Instalar app
    </button>
  );
}

