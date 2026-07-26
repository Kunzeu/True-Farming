"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Users,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useI18n } from "@/contexts/I18nContext";

export default function AltParkingPage() {
  const { t } = useI18n();
  usePageTitle("pageTitles.altParking", "Alt Parking");

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          {/* Hero Section */}
          <div className="mb-8">
            {/* Botón de regreso */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 bg-gray-900/80 hover:bg-gray-800/90 border border-cyan-500/30 text-white rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg w-fit"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("altParking.backToHome", "Volver al Inicio")}
              </Link>
            </motion.div>

            {/* Título centrado */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6"
            >
              <div className="w-20 h-20 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg flex items-center justify-center overflow-hidden">
                <Users className="h-10 w-10 sm:h-8 sm:w-8 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-center">
                <span
                  className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
                  style={{
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {t("altParking.title", "Alt Parking")}
                </span>
              </h1>
            </motion.div>

            {/* Subtítulo centrado */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center px-4"
            >
              <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
                {t("altParking.subtitle", "Guía completa para optimizar el uso de personajes alternativos en Guild Wars 2. Maximiza tus recompensas diarias")}
              </p>
            </motion.div>
          </div>

          {/* Información General */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-xl p-6 mb-6 border border-slate-600/50">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-white mb-2">
                {t("altParking.generalInfo.title", "¿Qué es Alt Parking?")}
              </h2>
            </div>
            <div className="grid lg:grid-cols-3 gap-6 text-justify">
              <div className="lg:col-span-2">
                <p className="text-gray-300 leading-relaxed mb-4">
                  {t("altParking.generalInfo.description1", "Alt Parking es una estrategia de optimización donde colocas personajes alternativos en ubicaciones específicas para recoger recompensas diarias y semanales automáticamente.")}
                </p>
                <p className="text-gray-300 leading-relaxed mb-6">
                  {t("altParking.generalInfo.description2", "Esta técnica te permite maximizar tus recompensas sin invertir tiempo activo de juego, simplemente posicionando tus alts en los lugares correctos.")}
                </p>
                
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  {t("altParking.generalInfo.benefits", "Beneficios:")}
                </h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>{t("altParking.generalInfo.benefit1", "Múltiples recompensas diarias")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>{t("altParking.generalInfo.benefit2", "Optimización del tiempo de juego")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>{t("altParking.generalInfo.benefit4", "Máximo aprovechamiento de alts")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>{t("altParking.generalInfo.benefit5", "Recompensas pasivas")}</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Ubicaciones Populares */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center border border-blue-500/30 overflow-hidden">
                <MapPin className="h-6 w-6 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-blue-400">
                {t("altParking.popularLocations.title", "Ubicaciones Populares")}
              </h2>
            </div>
            
            {/* Draconis Mons Card */}
            <Link href="/alt-parking/draconis-mons">
              <div className="bg-gradient-to-r from-slate-800/30 to-slate-700/30 backdrop-blur-sm rounded-lg p-4 border border-slate-600/30 hover:border-purple-500/50 transition-all duration-300 hover:bg-slate-700/40 cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                        Draconis Mons
                      </h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-1">Draconis Mons</p>
                    <p className="text-gray-300 text-sm">
                      {t("altParking.locations.draconisMonsDescription", "Ubicación ideal para recoger recompensas diarias. Excelente para principiantes.")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Users className="w-3 h-3" />
                        <span>453</span>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

        </div>
      </div>
    </>
  );
}
