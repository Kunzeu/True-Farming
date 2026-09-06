'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Trash2, Eye, Shield, Database, User, Settings } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';

interface UserData {
  personalInfo: {
    id: string;
    email: string;
    username: string;
    role: string;
    createdAt: string;
    lastLogin: string;
    isActive: boolean;
  };
  preferences: {
    theme: string;
    language: string;
    notifications: {
      priceAlerts: boolean;
      eventReminders: boolean;
      buildUpdates: boolean;
    };
  };
  activity: {
    loginCount: number;
    lastActivity: string;
    featuresUsed: string[];
  };
}

export default function DataManagementPage() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useI18n();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  usePageTitle('pageTitles.dataManagement', 'Data Management');

  useEffect(() => {
    if (isAuthenticated && user) {
      // Simulate loading user data
      setTimeout(() => {
        setUserData({
          personalInfo: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role || 'user',
            createdAt: user.joinDate || new Date().toISOString(),
            lastLogin: user.lastLogin || new Date().toISOString(),
            isActive: user.isActive || true,
          },
          preferences: {
            theme: user.preferences?.theme || 'dark',
            language: user.preferences?.language || 'es',
            notifications: {
              priceAlerts: user.preferences?.notifications?.priceAlerts ?? true,
              eventReminders: user.preferences?.notifications?.eventReminders ?? true,
              buildUpdates: user.preferences?.notifications?.buildUpdates ?? false,
            },
          },
          activity: {
            loginCount: Math.floor(Math.random() * 100) + 1,
            lastActivity: new Date().toISOString(),
            featuresUsed: ['Trading Post', 'Farming Routes', 'Salvaging Calculator', 'Festivals'],
          },
        });
        setIsLoading(false);
      }, 1000);
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  const handleDownloadData = () => {
    if (!userData) return;

    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `truefarming-data-${user?.username}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would call the API to delete the account
      console.log('Account deletion requested for:', user.id);
      
      // For now, just show success message
      alert('Account deletion request submitted. You will receive a confirmation email.');
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Error deleting account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen tf-site-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">{t('dataManagement.accessDenied', 'Access Denied')}</h1>
          <p className="text-gray-300 mb-6">{t('dataManagement.loginRequired', 'You need to be logged in to access this page.')}</p>
          <Link
            href="/login"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            {t('dataManagement.goToLogin', 'Go to Login')}
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen tf-site-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen tf-site-bg">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{t('auth.backToHome')}</span>
            </Link>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <h1 className="text-3xl font-bold text-white mb-2">{t('dataManagement.title', 'Data Management')}</h1>
            <p className="text-gray-300">{t('dataManagement.subtitle', 'Manage your personal data and privacy settings')}</p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-8"
        >
          {/* Data Overview */}
          <div className="bg-slate-800/50 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              {t('dataManagement.overview', 'Your Data Overview')}
            </h2>
            <p className="text-gray-300 mb-4">
              {t('dataManagement.overviewDesc', 'Here\'s what data we have about you and how it\'s being used.')}
            </p>
            
            {userData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">{t('dataManagement.personalInfo', 'Personal Information')}</h3>
                  <p className="text-white text-lg font-semibold">3 {t('dataManagement.items', 'items')}</p>
                  <p className="text-gray-400 text-sm">{t('dataManagement.personalInfoDesc', 'Email, username, account status')}</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">{t('dataManagement.preferences', 'Preferences')}</h3>
                  <p className="text-white text-lg font-semibold">1 {t('dataManagement.settings', 'settings')}</p>
                  <p className="text-gray-400 text-sm">{t('dataManagement.preferencesDesc', 'Language')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Data Details */}
          {userData && (
            <div className="bg-slate-800/50 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-green-400" />
                {t('dataManagement.detailedData', 'Detailed Data')}
              </h2>
              
              {/* Personal Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-400" />
                  {t('dataManagement.personalInfo', 'Personal Information')}
                </h3>
                <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t('dataManagement.email', 'Email')}:</span>
                    <span className="text-white">{userData.personalInfo.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t('dataManagement.username', 'Username')}:</span>
                    <span className="text-white">{userData.personalInfo.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t('dataManagement.accountCreated', 'Account Created')}:</span>
                    <span className="text-white">{new Date(userData.personalInfo.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-purple-400" />
                  {t('dataManagement.preferences', 'Preferences')}
                </h3>
                <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t('dataManagement.language', 'Language')}:</span>
                    <span className="text-white">{userData.preferences.language.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-slate-800/50 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-400" />
              {t('dataManagement.actions', 'Data Actions')}
            </h2>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleDownloadData}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {t('dataManagement.downloadData', 'Download My Data')}
                </button>
                
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('dataManagement.deleteAccount', 'Delete My Account')}
                </button>
              </div>
              
              <p className="text-sm text-gray-400">
                {t('dataManagement.rightsDesc', 'You have the right to access, download, and delete your personal data at any time. Account deletion is permanent and cannot be undone.')}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6"
          >
            <h3 className="text-xl font-bold text-white mb-4">{t('dataManagement.deleteAccountTitle', 'Delete Account')}</h3>
            <p className="text-gray-300 mb-6">
              {t('dataManagement.deleteConfirm', 'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                disabled={isDeleting}
              >
                {t('dataManagement.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {t('dataManagement.deleting', 'Deleting...')}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    {t('dataManagement.deleteAccount', 'Delete Account')}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
