'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Key, CheckCircle, AlertCircle, Trash2, ExternalLink, Plus, Save } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { motion, AnimatePresence } from 'framer-motion';
import { validateGw2ApiKeyInBrowser } from '@/lib/gw2-client-validate';

export default function AltAccountsManager() {
  const { user, updateUser } = useAuth();
  const { t } = useI18n();
  
  const [newKey, setNewKey] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isApiKeyLoading, setIsApiKeyLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const apiKeys = user?.preferences?.apiKeys || [];
  const currentKey = user?.gw2ApiKey;

  // Include the legacy main key if it's not in the array
  const displayApiKeys = [...apiKeys];
  if (currentKey && !apiKeys.some(k => k.key === currentKey)) {
    displayApiKeys.unshift({
      id: 'legacy-main-key',
      name: t('profile.apiKey.legacyAccount', 'Main Account (Legacy)'),
      key: currentKey
    });
  }

  const validateApiKey = async (key: string) => {
    const result = await validateGw2ApiKeyInBrowser(key);
    if (result.ok === false) {
      return { ok: false, ...result };
    }
    return { ok: true, ...result };
  };

  // Silently resolve "Main Account (Legacy)" to actual account name
  useEffect(() => {
    const resolveLegacyNames = async () => {
      if (!user) return;
      
      const hasLegacyNames = apiKeys.some(k => k.name === 'Main Account (Legacy)');
      const missingMainKey = currentKey && !apiKeys.some(k => k.key === currentKey);

      if (!hasLegacyNames && !missingMainKey) return;

      let newApiKeys = [...apiKeys];
      
      // If there's a missing main key, inject it temporarily to resolve it
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
          const result = await validateApiKey(newApiKeys[i].key);
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
  }, [user]);

  const handleAddAccount = async () => {
    if (!newKey.trim() || !user) return;
    if (displayApiKeys.some(k => k.key === newKey.trim())) {
      setMessage({ text: t('profile.apiKey.alreadyExists', 'This API key is already added.'), type: 'error' });
      return;
    }

    setIsApiKeyLoading(true);
    setMessage(null);

    try {
      const result = await validateApiKey(newKey.trim());

      if (result.ok && result.apiKey) {
        const cleanKey = result.apiKey;
        const accountName = result.accountInfo?.name || 'Unknown Account';
        
        const newApiKeys = [...apiKeys, { id: crypto.randomUUID(), name: accountName, key: cleanKey }];
        
        await updateUser({ 
          gw2ApiKey: apiKeys.length === 0 ? cleanKey : currentKey, // Set as main if it's the first one
          preferences: {
            ...user.preferences,
            apiKeys: newApiKeys
          }
        });
        
        setNewKey('');
        setIsAdding(false);
        setMessage({ text: t('profile.apiKey.added', 'Account added successfully!'), type: 'success' });
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('tf-auth-change'));
        }
      } else {
        setMessage({ text: t('profile.apiKey.invalid', 'Invalid API key. Check permissions.'), type: 'error' });
      }
    } catch (error) {
      console.error('Error adding account:', error);
      setMessage({ text: t('profile.apiKey.errorValidate', 'Error validating API key'), type: 'error' });
    } finally {
      setIsApiKeyLoading(false);
    }
  };

  const handleRemoveAccount = async (idToRemove: string) => {
    if (!user) return;
    
    // Handle legacy key removal
    if (idToRemove === 'legacy-main-key') {
      try {
        await updateUser({ gw2ApiKey: '' });
        setMessage({ text: t('profile.apiKey.removed', 'Account removed successfully.'), type: 'success' });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('tf-auth-change'));
          window.location.reload();
        }
      } catch (error) {
        console.error('Error removing legacy account:', error);
        setMessage({ text: t('profile.apiKey.errorRemove', 'Error removing account.'), type: 'error' });
      }
      return;
    }

    const accountToRemove = apiKeys.find(k => k.id === idToRemove);
    if (!accountToRemove) return;

    const newApiKeys = apiKeys.filter(k => k.id !== idToRemove);
    
    // If we removed the currently active account, switch to another one (if available), or clear it.
    let nextActiveKey = currentKey;
    if (accountToRemove.key === currentKey) {
      // If there's another account, set it as active, else clear
      nextActiveKey = newApiKeys.length > 0 ? newApiKeys[0].key : '';
    }

    try {
      await updateUser({
        gw2ApiKey: nextActiveKey,
        preferences: {
          ...user.preferences,
          apiKeys: newApiKeys
        }
      });
      setMessage({ text: t('profile.apiKey.removed', 'Account removed successfully.'), type: 'success' });
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('tf-auth-change'));
        if (accountToRemove.key === currentKey) {
          window.location.reload(); // Reload to clear contexts using the old key
        }
      }
    } catch (error) {
      console.error('Error removing account:', error);
      setMessage({ text: t('profile.apiKey.errorRemove', 'Error removing account.'), type: 'error' });
    }
  };

  const handleSetMain = async (key: string) => {
    if (!user || key === currentKey) return;
    try {
      await updateUser({ gw2ApiKey: key });
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error switching account:', error);
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Key className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">{t('profile.apiKey.title', 'Guild Wars 2 Accounts')}</h3>
            <p className="text-gray-400 text-sm">{t('profile.apiKey.subtitle', 'Manage your GW2 alt accounts')}</p>
          </div>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('profile.apiKey.addAccount', 'Add Account')}
          </button>
        )}
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-sm font-medium ${
          message.type === 'error' ? 'bg-red-900/20 text-red-400 border border-red-500/30' : 
          message.type === 'success' ? 'bg-green-900/20 text-green-400 border border-green-500/30' :
          'bg-blue-900/20 text-blue-400 border border-blue-500/30'
        }`}>
          {message.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      <div className="space-y-3">
        {displayApiKeys.length === 0 && !isAdding ? (
           <div className="bg-gradient-to-r from-gray-700/40 to-gray-800/40 rounded-xl p-4 border border-gray-600/30 text-center">
            <AlertCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">{t('profile.apiKey.noAccounts', 'No accounts connected yet. Add your first GW2 API Key.')}</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {displayApiKeys.map(acc => {
              const isActive = acc.key === currentKey;
              return (
                <div key={acc.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border ${
                  isActive ? 'bg-cyan-900/20 border-cyan-500/30' : 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/80 transition-colors'
                }`}>
                  <div className="flex items-center gap-3 mb-3 sm:mb-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-bold ${isActive ? 'text-cyan-400' : 'text-gray-200'}`}>{acc.name}</h4>
                        {isActive && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">
                            {t('profile.apiKey.active', 'Active')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">{acc.key.substring(0, 16)}...</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isActive && (
                      <button
                        onClick={() => handleSetMain(acc.key)}
                        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white text-xs font-medium rounded transition-colors"
                      >
                        {t('profile.apiKey.makeActive', 'Set Active')}
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveAccount(acc.id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                      title={t('profile.apiKey.delete', 'Delete API Key')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-gray-800/80 p-4 rounded-xl border border-gray-700 mt-4 space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-2">
                    {t('profile.apiKey.label', 'New API Key')}
                  </label>
                  <input
                    type="text"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder={t('profile.apiKey.placeholder', 'Enter your GW2 API key')}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                    disabled={isApiKeyLoading}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAddAccount}
                    disabled={isApiKeyLoading || !newKey.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isApiKeyLoading ? (
                      <span className="text-sm">{t('profile.apiKey.saving', 'Verifying...')}</span>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span className="text-sm">{t('profile.apiKey.save', 'Add Account')}</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsAdding(false);
                      setNewKey('');
                    }}
                    disabled={isApiKeyLoading}
                    className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    {t('common.cancel', 'Cancel')}
                  </button>
                  <a
                    href="https://account.arena.net/applications"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
