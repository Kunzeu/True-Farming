'use client';

import { useI18n } from '@/contexts/I18nContext';
import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen tf-site-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icono principal */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-32 h-32">
            <Image
              src="/images/icons/icoon.webp"
              alt="True Farming Logo"
              width={128}
              height={128}
              className="w-full h-full object-contain"
              unoptimized
              priority
            />
          </div>
        </div>

        {/* Título principal */}
        <h1 className="text-4xl font-bold text-white mb-4">
          {t('error404.title')}
        </h1>

        {/* Subtítulo con el mensaje solicitado */}
        <h2 className="text-xl text-red-400 mb-6 font-semibold">
          {t('error404.subtitle')}
        </h2>

        {/* Descripción */}
        <p className="text-gray-300 mb-8 text-lg">
          {t('error404.description')}
        </p>

        {/* Botón para volver al inicio */}
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          {t('error404.backHome')}
        </Link>

        {/* Decoración adicional */}
        <div className="mt-12 flex justify-center space-x-2">
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}
