import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const InstallPWA = ({ mode = 'button' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode (installed PWA)
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      toast.success('🎉 NS Choco Delight installed successfully!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback instruction for browser if prompt isn't buffered yet
      toast('To install: click the Install icon ⊕ / ⋮ menu in your browser address bar!', {
        icon: '📲',
        duration: 5000,
      });
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) return null;

  if (mode === 'banner' && isInstallable) {
    return (
      <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-50 bg-choco-900 text-cream p-4 rounded-2xl shadow-2xl border border-gold-500/30 flex items-center justify-between gap-4 max-w-md animate-bounce-short">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📲</span>
          <div>
            <p className="font-semibold text-sm">Install NS Choco App</p>
            <p className="text-choco-300 text-xs">Add to your home screen for quick access</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            id="pwa-banner-install-btn"
            className="btn-gold py-2 px-4 text-xs font-bold"
          >
            Install
          </button>
          <button
            onClick={() => setIsInstallable(false)}
            className="text-choco-400 hover:text-cream text-sm px-1.5 py-1"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleInstallClick}
      id="pwa-nav-install-btn"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold-500/20 border border-gold-500/40 text-gold-400 hover:bg-gold-500 hover:text-choco-900 text-xs font-semibold rounded-xl transition-all duration-300 shadow-sm"
      title="Install App on Desktop / Mobile"
    >
      <span className="text-sm">📲</span>
      <span>Install App</span>
    </button>
  );
};

export default InstallPWA;
