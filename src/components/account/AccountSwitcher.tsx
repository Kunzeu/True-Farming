'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Check, Settings, ChevronDown } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import Link from 'next/link';
import { validateGw2ApiKeyInBrowser } from '@/lib/gw2-client-validate';

export default function AccountSwitcher() {
  const { user, updateUser } = useAuth();
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const resolveLegacyNames = async () => {
      if (!user) return;
      
      const apiKeys = user.preferences?.apiKeys || [];
      const currentKey = user.gw2ApiKey;
      
      const hasLegacyNames = apiKeys.some(k => k.name === 'Main Account (Legacy)');
      const missingMainKey = currentKey && !apiKeys.some(k => k.key === currentKey);

      if (!hasLegacyNames && !missingMainKey) return;

      let newApiKeys = [...apiKeys];
      
      if (missingMainKey) {
        newApiKeys.unshift({
          id: 'legacy-main-key',
          name: 'Main Account (Legacy)',
          key: currentKey
        });
      }

      let updated = false;

      for (let i = 0; i < newApiKeys.length; i++) {
        if (newApiKeys[i].name === 'Main Account (Legacy)') {
          const result = await validateGw2ApiKeyInBrowser(newApiKeys[i].key);
          if (result.ok && result.accountInfo?.name) {
            newApiKeys[i].name = result.accountInfo.name;
            updated = true;
          }
        }
      }

      if (updated) {
        await updateUser({
          preferences: {
            ...user.preferences,
            apiKeys: newApiKeys
          }
        });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('tf-auth-change'));
        }
      }
    };

    resolveLegacyNames();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) return null;

  const apiKeys = user.preferences?.apiKeys || [];
  
  const currentKey = user.gw2ApiKey;
  
  const displayApiKeys = [...apiKeys];
  if (currentKey && !apiKeys.some(k => k.key === currentKey)) {
    displayApiKeys.unshift({
      id: 'legacy-main-key',
      name: t('profile.apiKey.legacyAccount', 'Main Account (Legacy)'),
      key: currentKey
    });
  }

  const currentAccountName = displayApiKeys.find(k => k.key === currentKey)?.name || 
                             (currentKey ? t('settings.gw2Api.mainAccount', 'Main Account') : t('settings.gw2Api.noAccount', 'No Account'));

  const handleSwitchAccount = async (key: string) => {
    if (key === currentKey || isUpdating) return;
    
    setIsUpdating(true);
    try {
      await updateUser({ gw2ApiKey: key });
      setIsOpen(false);
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to switch account:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-sm text-slate-300 transition hover:border-amber-400/25 hover:bg-white/[0.07] hover:text-white"
        title={t('settings.gw2Api.switchAccount', 'Switch Account')}
      >
        <span className="hidden xl:inline-block max-w-[200px] truncate font-medium">
          {currentAccountName}
        </span>
        <ChevronDown className={`hidden xl:block h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-md shadow-2xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-800 bg-gray-800/50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {t('settings.gw2Api.switchAccount', 'Switch Account')}
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {displayApiKeys.length > 0 ? (
              displayApiKeys.map((account) => {
                const isActive = account.key === currentKey;
                return (
                  <button
                    key={account.id}
                    onClick={() => handleSwitchAccount(account.key)}
                    disabled={isUpdating}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                      isActive 
                        ? 'bg-cyan-900/20 text-cyan-400' 
                        : 'hover:bg-gray-800 text-gray-300 hover:text-white'
                    }`}
                  >
                    <div className="flex flex-col overflow-hidden pr-2">
                      <span className="font-medium truncate">{account.name}</span>
                      <span className="text-xs opacity-60 truncate font-mono mt-0.5">
                      </span>
                    </div>
                    {isActive && <Check className="w-4 h-4 flex-shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">
                {t('settings.gw2Api.noAltAccounts', 'No alternative accounts added yet.')}
              </div>
            )}
          </div>
          
          <div className="border-t border-gray-800 p-2 bg-gray-800/30 flex flex-col gap-1">
            <Link 
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700/50 rounded transition-colors"
            >
              <Settings className="w-4 h-4" />
              {t('settings.gw2Api.manageAccounts', 'Manage Accounts')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
