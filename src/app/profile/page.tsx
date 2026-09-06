'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import {
  User,
  Save,
  Edit,
  Shield,
  Key,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';
import PatreonSection from '@/components/auth/PatreonSection';
import PatreonBadge from '@/components/PatreonBadge';
import { validateGw2ApiKeyInBrowser } from '@/lib/gw2-client-validate';
import AltAccountsManager from '@/components/account/AltAccountsManager';

export default function ProfilePage() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  usePageTitle('pageTitles.profile', t('profile.title'));
  const [isEditing, setIsEditing] = useState(false);
  const [preferences, setPreferences] = useState({
    notifications: {
      priceAlerts: true,
      eventReminders: true,
      buildUpdates: false,
    }
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // Username change state
  const [newUsername, setNewUsername] = useState<string>('');
  const [showUsernameConfirm, setShowUsernameConfirm] = useState(false);

  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: ''
  });
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: ''
  });
  useEffect(() => {
    setNewUsername(user?.username || '');
  }, [user?.username]);

  // API Key states
  const [apiKey, setApiKey] = useState('');
  const [isApiKeyLoading, setIsApiKeyLoading] = useState(false);
  const [isApiKeyValid, setIsApiKeyValid] = useState<boolean | null>(null);
  const [apiKeyMessage, setApiKeyMessage] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [accountName, setAccountName] = useState<string>('');
  const [copyMessage, setCopyMessage] = useState('');
  const [showDeleteApiKeyModal, setShowDeleteApiKeyModal] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Cargar preferencias cuando el usuario se carga
  useEffect(() => {
    if (user?.preferences) {
      setPreferences({
        notifications: {
          priceAlerts: user.preferences.notifications?.priceAlerts ?? true,
          eventReminders: user.preferences.notifications?.eventReminders ?? true,
          buildUpdates: user.preferences.notifications?.buildUpdates ?? false,
        }
      });
    }
  }, [user?.preferences]);

  // Cargar datos del usuario (resumen + API key). Nombre de cuenta vía browser→GW2.
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) return;

      setIsApiKeyLoading(true);

      try {
        const summaryResponse = await fetch(`/api/users/${user.id}/summary`);
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          const hasKey = !!summaryData.hasApiKey;
          setHasApiKey(hasKey);

          if (hasKey) {
            try {
              const apiKeyResponse = await fetch(`/api/users/${user.id}/api-key?user_id=${user.id}`, {
                cache: 'no-store',
              });
              if (apiKeyResponse.ok) {
                const apiKeyData = await apiKeyResponse.json();
                if (apiKeyData.apiKey) {
                  setApiKey(apiKeyData.apiKey);
                  try {
                    localStorage.setItem('gw2_api_key', apiKeyData.apiKey);
                  } catch { /* ignore */ }

                  const accountRes = await fetch(
                    `https://api.guildwars2.com/v2/account?access_token=${encodeURIComponent(apiKeyData.apiKey)}`
                  );
                  if (accountRes.ok) {
                    const acct = await accountRes.json();
                    if (acct?.name) {
                      setAccountName(String(acct.name));
                      try {
                        sessionStorage.setItem(
                          'gw2_account_info',
                          JSON.stringify({ id: acct.id, name: acct.name })
                        );
                      } catch { /* ignore */ }
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Error loading API key:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsApiKeyLoading(false);
      }
    };

    loadUserData();
  }, [user?.id]);

  const memberSinceDate = user?.createdAt
    ? new Date(user.createdAt)
    : (user?.joinDate ? new Date(user.joinDate) : null);

  const locale = lang === 'es' ? 'es-ES' : lang === 'de' ? 'de-DE' : lang === 'fr' ? 'fr-FR' : 'en-US';

  const handleSave = async () => {
    try {
      const { getDbService } = await import('@/lib/database-switch');
      const dbService = await getDbService();

      if (user?.id) {
        const updates: { preferences?: typeof preferences; password?: string } = {};

        // Guardar preferencias
        updates.preferences = preferences;

        // Validar y cambiar contraseña si se proporcionaron datos
        if (passwordData.newPassword || passwordData.confirmPassword) {
          updates.password = passwordData.newPassword;
        }

        await dbService.updateUser(user.id, updates);

        // Actualizar localStorage
        const updatedUser = {
          ...user,
          preferences,
          ...(updates.password && { password: updates.password })
        };
        localStorage.setItem('gw2_user', JSON.stringify(updatedUser));

        // Limpiar campos de contraseña
        setPasswordData({
          newPassword: '',
          confirmPassword: ''
        });

        setIsEditing(false);
        setShowPasswordConfirm(false);

        if (updates.password) {
          setSuccessModal({
            isOpen: true,
            title: t('profile.password.success', 'Contraseña cambiada con éxito'),
            message: t('profile.password.success', 'Contraseña cambiada con éxito')
          });
        } else {
          setSuccessModal({
            isOpen: true,
            title: t('profile.saveSuccess'),
            message: t('profile.saveSuccess')
          });
        }
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert(t('profile.saveError'));
    }
  };

  const handlePasswordSaveClick = () => {
    if (!passwordData.newPassword) {
      alert(t('profile.passwordRequired'));
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorModal({
        isOpen: true,
        title: t('profile.password.error.title', 'Error'),
        message: t('profile.passwordsNoMatch')
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert(t('profile.passwordTooShort'));
      return;
    }

    setShowPasswordConfirm(true);
  };

  const handleSaveUsername = async () => {
    try {
      if (!user?.id) return;
      const trimmed = newUsername.trim();
      if (!trimmed) {
        alert(t('profile.username.required', 'El nombre de usuario es requerido'));
        return;
      }
      if (trimmed.length < 3) {
        alert(t('profile.username.tooShort', 'Mínimo 3 caracteres'));
        return;
      }
      const { getDbService } = await import('@/lib/database-switch');
      const dbService = await getDbService();
      await dbService.updateUser(user.id, { username: trimmed });
      const updatedUser = { ...user, username: trimmed };
      localStorage.setItem('gw2_user', JSON.stringify(updatedUser));
      setShowUsernameConfirm(false);
      alert(t('profile.username.updated', 'Nombre de usuario actualizado'));
    } catch (e) {
      console.error('Error updating username', e);
      alert(t('profile.username.updateError', 'No se pudo actualizar el nombre de usuario'));
    }
  };

  // API Key functions — validar en el browser (CF Workers reciben 429 de ArenaNet).
  const validateApiKey = async (key: string) => {
    const result = await validateGw2ApiKeyInBrowser(key);
    if (result.ok === false) {
      return {
        ok: false as const,
        error: result.error,
        missingPermissions: result.missingPermissions,
        gw2Status: result.gw2Status,
        gw2Error: result.gw2Error,
      };
    }
    return {
      ok: true as const,
      apiKey: result.apiKey,
      accountName: result.accountInfo?.name,
      permissions: result.permissions,
    };
  };

  const handleSaveApiKey = async () => {
    if (!user?.id) {
      setApiKeyMessage(t('profile.apiKey.accessRequired', 'Access Required'));
      return;
    }

    setIsApiKeyLoading(true);
    setApiKeyMessage('');

    try {
      const result = await validateApiKey(apiKey);
      setIsApiKeyValid(result.ok);

      if (result.ok) {
        const cleanKey = result.apiKey;
        const response = await fetch(`/api/users/${user.id}/api-key?user_id=${user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ apiKey: cleanKey }),
        });

        if (response.ok) {
          try {
            localStorage.setItem('gw2_api_key', cleanKey);
            if (result.accountName) {
              sessionStorage.setItem(
                'gw2_account_info',
                JSON.stringify({ name: result.accountName })
              );
            }
          } catch { /* ignore */ }
          setApiKey(cleanKey);
          if (result.accountName) setAccountName(result.accountName);
          setHasApiKey(true);
          setApiKeyMessage(t('profile.apiKey.saved', 'API key saved successfully'));
          try {
            const confirmResp = await fetch(`/api/users/${user.id}/api-key?user_id=${user.id}`, {
              cache: 'no-store',
            });
            if (confirmResp.ok) {
              const confirmData = await confirmResp.json();
              setHasApiKey(!!confirmData.hasApiKey);
              if (confirmData.apiKey) setApiKey(confirmData.apiKey);
            }
            const summaryResp = await fetch(`/api/users/${user.id}/summary`, { cache: 'no-store' });
            if (summaryResp.ok) {
              const summaryData = await summaryResp.json();
              setHasApiKey(!!summaryData.hasApiKey);
            }
          } catch { /* ignore */ }
        } else {
          const errorData = await response.json().catch(() => ({}));
          setApiKeyMessage(errorData.error || t('profile.apiKey.errorSave', 'Error saving API key'));
        }
      } else if (result.missingPermissions?.length) {
        setApiKeyMessage(
          `${t('profile.apiKey.missingPermissions', 'Faltan permisos')}: ${result.missingPermissions.join(', ')}`
        );
      } else if (result.gw2Status === 429 || result.error?.includes?.('rate limit')) {
        setApiKeyMessage(
          t('profile.apiKey.rateLimited', 'La API de GW2 está saturada. Espera unos segundos e inténtalo de nuevo.')
        );
      } else if (result.gw2Status) {
        const detail =
          typeof result.gw2Error === 'object' && result.gw2Error && 'text' in (result.gw2Error as object)
            ? String((result.gw2Error as { text?: string }).text)
            : typeof result.gw2Error === 'string'
              ? result.gw2Error
              : '';
        setApiKeyMessage(
          `${t('profile.apiKey.invalid', 'Invalid API key. Check permissions.')} (GW2 ${result.gw2Status}${detail ? `: ${detail}` : ''})`
        );
      } else {
        setApiKeyMessage(t('profile.apiKey.invalid', 'Invalid API key. Check permissions.'));
      }
    } catch {
      setIsApiKeyValid(false);
      setApiKeyMessage(t('profile.apiKey.errorValidate', 'Error validating API key'));
    } finally {
      setIsApiKeyLoading(false);
    }
  };

  const handleDeleteApiKey = async () => {
    if (!user?.id) {
      setApiKeyMessage(t('profile.apiKey.accessRequired', 'Access Required'));
      return;
    }

    try {
      const response = await fetch(`/api/users/${user.id}/api-key?user_id=${user.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Clear all API key related data
        setApiKey('');
        setAccountName('');
        setIsApiKeyValid(null);
        setHasApiKey(false);
        try {
          localStorage.removeItem('gw2_api_key');
          sessionStorage.removeItem('gw2_api_key');
        } catch { /* ignore */ }
        setApiKeyMessage('');
        setShowApiKey(false);

        // Show success message
        setApiKeyMessage(t('profile.apiKey.deleted', 'API key deleted successfully'));
        setTimeout(() => setApiKeyMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setApiKeyMessage(errorData.error || t('profile.apiKey.errorDelete', 'Error deleting API key'));
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
      setApiKeyMessage(t('profile.apiKey.errorDelete', 'Error deleting API key'));
    }

    // Close modal
    setShowDeleteApiKeyModal(false);
  };

  const handleCopyApiKey = async () => {
    if (!apiKey) {
      setApiKeyMessage(t('profile.apiKey.noCopy', 'No API key to copy'));
      setTimeout(() => setApiKeyMessage(''), 2000);
      return;
    }

    try {
      await navigator.clipboard.writeText(apiKey);
      setCopyMessage(t('profile.apiKey.copied', 'Copied!'));
      setTimeout(() => setCopyMessage(''), 2000);
    } catch (error) {
      console.error('Failed to copy API key:', error);
      setCopyMessage(t('profile.apiKey.copyError', 'Failed to copy'));
      setTimeout(() => setCopyMessage(''), 2000);
    }
  };

  const toggleShowApiKey = () => {
    setShowApiKey(!showApiKey);
  };


  return (
    <ProtectedRoute>
      <div className="min-h-screen">

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/account"
            className="mb-6 inline-flex items-center text-blue-400 hover:text-blue-300">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('account.back', 'Back to My Account')}
          </Link>

          {/* Header Hero */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12">
            <div className="relative inline-block">
              <h1 className="text-5xl font-black text-white mb-4 tracking-tight">
                {t('profile.title')}
              </h1>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full"></div>
            </div>
            <p className="text-xl text-gray-300 mt-6 max-w-2xl mx-auto">
              {t('profile.subtitle')}
            </p>
          </motion.div>

          {/* User Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8">
            <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 shadow-2xl">
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
                {/* Avatar Section */}
                <div className="text-center lg:text-left">
                  <div className="relative inline-block">
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/20">
                      <User className="w-16 h-16 text-white" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-gray-900 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <h2 className="mt-4 mb-2 flex flex-wrap items-center justify-center gap-2 text-3xl font-black tracking-tight text-white lg:justify-start">
                    {user?.username}
                    <PatreonBadge />
                  </h2>
                  <p className="text-gray-400 text-lg">{user?.email}</p>
                </div>

                {/* User Stats */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center lg:text-left">
                    <div className="text-2xl font-bold text-blue-400 mb-1">
                      {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString('es-ES') : 'N/A'}
                    </div>
                    <div className="text-gray-400 text-sm font-medium uppercase tracking-wider">{t('profile.lastAccess')}</div>
                  </div>
                  <div className="text-center lg:text-left">
                    <div className="text-2xl font-bold text-purple-400 mb-1">
                      {memberSinceDate
                        ? memberSinceDate.toLocaleDateString(locale, {
                          year: 'numeric',
                          month: 'short'
                        })
                        : 'N/A'}
                    </div>
                    <div className="text-gray-400 text-sm font-medium uppercase tracking-wider">{t('profile.memberSince')}</div>
                  </div>
                  <div className="text-center lg:text-left">
                    <div className="text-2xl font-bold text-green-400 mb-1">
                      {hasApiKey ? t('profile.apiKey.connected', 'Connected') : t('profile.apiKey.notConnected', 'Not Connected')}
                    </div>
                    <div className="text-gray-400 text-sm font-medium uppercase tracking-wider">{t('profile.apiKey.gw2Api', 'GW2 API')}</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Username Settings */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="space-y-6">
              <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 shadow-2xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <Edit className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">{t('profile.username.title', 'Cambiar nombre de usuario')}</h3>
                    <p className="text-gray-400">{t('profile.username.subtitle', 'Este es el nombre visible en la plataforma')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-gray-300 text-sm font-semibold mb-2">
                      {t('profile.username.label', 'Nombre de usuario')}
                    </label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder={t('profile.username.placeholder', 'Tu nuevo nombre...')}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <button
                      onClick={() => setShowUsernameConfirm(true)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <Save className="w-4 h-4" />
                      <span>{t('profile.username.save', 'Guardar')}</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
            {/* Password Settings */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6">

              {/* Password Settings Card */}
              <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 shadow-2xl">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">{t('profile.changePassword')}</h3>
                    <p className="text-gray-400">{t('profile.passwordSubtitle', 'Update your account security')}</p>
                  </div>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="ml-auto group inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                    <Edit className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                    <span>{isEditing ? t('profile.cancel') : t('profile.edit')}</span>
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-300 text-sm font-semibold mb-3">
                        {t('profile.newPassword')}
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          disabled={!isEditing}
                          placeholder={t('profile.newPasswordPlaceholder')}
                          className="w-full px-4 py-4 pr-12 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 transition-all duration-300"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          disabled={!isEditing}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-300 text-sm font-semibold mb-3">
                        {t('profile.confirmPassword')}
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          disabled={!isEditing}
                          placeholder={t('profile.confirmPasswordPlaceholder')}
                          className="w-full px-4 py-4 pr-12 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 transition-all duration-300"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={!isEditing}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-end pt-4">
                      <button
                        onClick={handlePasswordSaveClick}
                        className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                        <Save className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                        <span>{t('profile.saveChanges')}</span>
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* API Key Settings */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6">
              
              <AltAccountsManager />

            </motion.div>
          </div>

          {/* Patreon Section */}
          <div className="mt-8">
            <PatreonSection />
          </div>
        </main>


        {/* Username Confirmation Modal */}
        {showUsernameConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full mx-4 border border-gray-700/50 shadow-xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Edit className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {t('profile.username.confirm.title', 'Confirmar cambio de nombre')}
                </h3>
              </div>
              <p className="text-gray-300 mb-6">
                {t('profile.username.confirm.message', '¿Deseas cambiar tu nombre a {username}?').replace('{username}', newUsername.trim())}
              </p>
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={() => setShowUsernameConfirm(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                >
                  {t('profile.username.confirm.cancel', 'Cancelar')}
                </button>
                <button
                  onClick={handleSaveUsername}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{t('profile.username.confirm.accept', 'Confirmar')}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Password Confirmation Modal */}
        {showPasswordConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full mx-4 border border-gray-700/50 shadow-xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-yellow-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {t('profile.password.confirm.title', 'Confirmar cambio de contraseña')}
                </h3>
              </div>
              <p className="text-gray-300 mb-6">
                {t('profile.password.confirm.message', '¿Estás seguro de que deseas cambiar tu contraseña?')}
              </p>
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={() => setShowPasswordConfirm(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                >
                  {t('profile.password.confirm.cancel', 'Cancelar')}
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{t('profile.password.confirm.accept', 'Confirmar')}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Error Modal */}
        {errorModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full mx-4 border border-gray-700/50 shadow-xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {errorModal.title}
                </h3>
              </div>
              <p className="text-gray-300 mb-6">
                {errorModal.message}
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setErrorModal({ ...errorModal, isOpen: false })}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </div>
        )}


        {/* Success Modal */}
        {successModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full mx-4 border border-gray-700/50 shadow-xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {successModal.title}
                </h3>
              </div>
              <p className="text-gray-300 mb-6">
                {successModal.message}
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setSuccessModal({ ...successModal, isOpen: false })}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </ProtectedRoute >
  );
}