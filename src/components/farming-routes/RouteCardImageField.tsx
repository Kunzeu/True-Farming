'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';

interface RouteCardImageFieldProps {
  value: string;
  onChange: (url: string) => void;
  token: string | null;
  farmId?: string;
  farmName?: string;
  inputClassName?: string;
  labelClassName?: string;
}

export default function RouteCardImageField({
  value,
  onChange,
  token,
  farmId,
  farmName,
  inputClassName = 'w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 font-mono text-sm',
  labelClassName = 'block text-sm font-medium text-gray-300 mb-2',
}: RouteCardImageFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    if (!token) {
      setError('Inicia sesión como admin o moderador para subir imágenes.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (farmId) formData.append('farmId', farmId);
      if (farmName) formData.append('farmName', farmName);

      const response = await fetch('/api/farms/upload-image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Error al subir la imagen');
      }

      onChange(data.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Error al subir la imagen');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <label className={labelClassName}>Imagen de fondo de la card</label>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleUpload(file);
          }}
        />
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg border border-purple-500/40 bg-purple-950/40 px-3 py-2 text-sm text-purple-200 transition hover:bg-purple-900/50 disabled:opacity-60"
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {isUploading ? 'Subiendo…' : 'Subir imagen'}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300 transition hover:bg-red-950/40"
          >
            <Trash2 className="h-4 w-4" />
            Quitar
          </button>
        )}
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClassName} mt-2`}
        placeholder="/images/routes/mi-ruta.webp"
      />

      <p className="mt-1 text-xs text-gray-400">
        JPG, PNG, WebP o GIF (máx. 3 MB). Se guarda en{' '}
        <code className="text-gray-300">public/images/routes/</code> y se ve como fondo completo de la card.
      </p>

      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}

      {value && (
        <div className="mt-3 overflow-hidden rounded-xl border border-purple-500/30">
          <div className="relative h-28 w-full overflow-hidden rounded-lg bg-[#080b16]">
            {/* img: remote route image URL */}
            <img
              src={value}
              alt=""
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#080b16] from-[38%] via-[#080b16]/90 via-[55%] to-[#080b16]/25" />
            <div className="absolute left-3 top-3 flex items-center gap-1.5 text-xs text-gray-400">
              <ImagePlus className="h-3.5 w-3.5" />
              Vista previa del fondo de la card
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
