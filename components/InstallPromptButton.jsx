'use client';
import { useEffect, useState } from 'react';

export default function InstallPromptButton() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setPromptEvent(e);
      setShowHelp(false);
    };
    const onInstalled = () => { setInstalled(true); setShowHelp(false); };
    const mediaStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    if (mediaStandalone || window.navigator.standalone) setInstalled(true);
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  const onClick = async () => {
    if (promptEvent) {
      try {
        promptEvent.prompt();
        await promptEvent.userChoice;
      } catch (_) {}
      setPromptEvent(null);
    } else {
      setShowHelp((v) => !v);
    }
  };

  const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

  return (
    <div className="grid gap-2">
      <button className="btn btn-outline w-full" onClick={onClick}>
        Instalar app
      </button>
      {showHelp && (
        <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md p-2">
          {isAndroid ? (
            <>
              <div className="font-semibold mb-1">Como instalar no Android:</div>
              <div>• Abra o menu (⋮) do Chrome</div>
              <div>• Toque em “Instalar app” (ou “Adicionar à tela inicial”)</div>
            </>
          ) : isIOS ? (
            <>
              <div className="font-semibold mb-1">Como instalar no iOS (Safari):</div>
              <div>• Toque em Compartilhar</div>
              <div>• “Adicionar à Tela de Início”</div>
            </>
          ) : (
            <>
              <div className="font-semibold mb-1">Como instalar:</div>
              <div>• Procure a opção “Instalar app” no menu do navegador</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
