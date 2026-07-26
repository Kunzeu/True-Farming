/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/**/*.{astro,js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
    },
  },
  plugins: [],
  // Optimizaciones para reducir el tamaño del CSS
  corePlugins: {
    // Deshabilitar plugins que no se usan frecuentemente
    preflight: true, // Mantener para reset CSS
    container: false, // Deshabilitar si no se usa
    accessibility: true, // Mantener para accesibilidad
    pointerEvents: true, // Mantener para interactividad
    resize: false, // Deshabilitar si no se usa
    userSelect: true, // Mantener para UX
    appearance: true, // Mantener para formularios
    outline: true, // Mantener para accesibilidad
    ringOffsetWidth: true, // Mantener para focus rings
    ringOffsetColor: true, // Mantener para focus rings
    ringOpacity: true, // Mantener para focus rings
    ringColor: true, // Mantener para focus rings
    ringWidth: true, // Mantener para focus rings
    ringOffset: true, // Mantener para focus rings
    ring: true, // Mantener para focus rings
    boxShadow: true, // Mantener para diseño
    boxShadowColor: true, // Mantener para diseño
    opacity: true, // Mantener para transiciones
    backgroundBlendMode: false, // Deshabilitar si no se usa
    backgroundClip: false, // Deshabilitar si no se usa
    backgroundImage: true, // Mantener para gradientes
    backgroundOpacity: true, // Mantener para transparencias
    backgroundPosition: true, // Mantener para posicionamiento
    backgroundRepeat: true, // Mantener para repetición
    backgroundSize: true, // Mantener para dimensiones
    gradientColorStops: true, // Mantener para gradientes
    gradientColorStopPositions: true, // Mantener para gradientes
    backdropBlur: false, // Deshabilitar si no se usa
    backdropBrightness: false, // Deshabilitar si no se usa
    backdropContrast: false, // Deshabilitar si no se usa
    backdropGrayscale: false, // Deshabilitar si no se usa
    backdropHueRotate: false, // Deshabilitar si no se usa
    backdropInvert: false, // Deshabilitar si no se usa
    backdropOpacity: false, // Deshabilitar si no se usa
    backdropSaturate: false, // Deshabilitar si no se usa
    backdropSepia: false, // Deshabilitar si no se usa
    blur: false, // Deshabilitar si no se usa
    brightness: false, // Deshabilitar si no se usa
    contrast: false, // Deshabilitar si no se usa
    dropShadow: false, // Deshabilitar si no se usa
    grayscale: false, // Deshabilitar si no se usa
    hueRotate: false, // Deshabilitar si no se usa
    invert: false, // Deshabilitar si no se usa
    saturate: false, // Deshabilitar si no se usa
    sepia: false, // Deshabilitar si no se usa
    filter: false, // Deshabilitar si no se usa
    backdropFilter: false, // Deshabilitar si no se usa
  },
  // Configuración para optimizar el purging
  future: {
    hoverOnlyWhenSupported: true,
  },
  // Configuración de purging más agresiva
  safelist: [
    // Mantener clases dinámicas y de animación
    'animate-fade-in',
    'prose',
    'prose-invert',
    'line-clamp-1',
    'line-clamp-2',
    'line-clamp-3',
    // Mantener clases de gradientes que podrían ser generadas dinámicamente
    'bg-gradient-to-r',
    'bg-gradient-to-l',
    'bg-gradient-to-t',
    'bg-gradient-to-b',
    'bg-gradient-to-tr',
    'bg-gradient-to-tl',
    'bg-gradient-to-br',
    'bg-gradient-to-bl',
  ],
};

export default config;
