import React, { useState } from 'react';
import { optionalUrlRule } from '../../../../core/validation';
import { FormFieldError } from '../../../../shared/components/ui/FormFieldError';

interface UploadPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAvatar: (url: string) => Promise<void>;
  currentAvatar?: string;
  submitting?: boolean;
}

export const UploadPhotoModal: React.FC<UploadPhotoModalProps> = ({
  isOpen,
  onClose,
  onSaveAvatar,
  currentAvatar,
  submitting = false,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(currentAvatar || '/avatar_meghana.png');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [urlError, setUrlError] = useState<string>('');

  if (!isOpen) return null;

  const presets = [
    '/avatar_meghana.png',
    '/avatar_akhil.png',
    '/avatar_sravanthi.png',
  ];

  const handleSave = async () => {
    setUrlError('');
    const trimmed = customUrl.trim();

    if (trimmed) {
      const check = optionalUrlRule('Image URL').safeParse(trimmed);
      if (!check.success) {
        setUrlError(check.error.errors[0]?.message || 'Enter a valid image URL starting with http:// or https://');
        return;
      }
    }

    const chosen = trimmed || selectedPreset;
    await onSaveAvatar(chosen);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-photo-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in font-sans"
    >
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden text-left">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/10">
          <div>
            <h3 id="upload-photo-modal-title" className="text-base font-bold text-gray-900 dark:text-white">
              Update Profile Photo
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Choose an avatar preset or provide an image URL.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg"
          >
            <i className="fa-solid fa-xmark text-sm" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Preset options */}
          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Avatar Presets
            </p>
            <div className="flex items-center gap-4">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedPreset(preset);
                    setCustomUrl('');
                    setUrlError('');
                  }}
                  className={`relative p-1 rounded-full transition-all ${
                    selectedPreset === preset && !customUrl
                      ? 'ring-4 ring-blue-600 scale-105'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={preset}
                    alt={`Avatar option ${idx + 1}`}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Custom URL */}
          <div>
            <label htmlFor="photo-custom-url" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Or Image URL
            </label>
            <input
              id="photo-custom-url"
              type="url"
              placeholder="https://example.com/photo.png"
              aria-invalid={Boolean(urlError)}
              aria-describedby={urlError ? 'photo-url-error' : undefined}
              value={customUrl}
              onChange={(e) => {
                setCustomUrl(e.target.value);
                if (urlError) setUrlError('');
              }}
              className={`w-full px-3.5 py-2 bg-gray-50 dark:bg-neutral-950 border ${
                urlError ? 'border-rose-500 focus:border-rose-500' : 'border-gray-200 dark:border-white/10 focus:border-blue-500'
              } rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none`}
            />
            <FormFieldError id="photo-url-error" error={urlError} />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin text-xs" aria-hidden="true" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Apply Photo</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
