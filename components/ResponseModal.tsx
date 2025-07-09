'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';

interface Prayer {
  id: string;
  title: string;
  content: string;
  categoryText_en: string;
  categoryText_ko: string;
}

interface ResponseModalProps {
  prayer: Prayer;
  locale: string;
  onClose: () => void;
  onSubmit: (content: string, isShared: boolean) => Promise<void>;
}

export default function ResponseModal({
  prayer,
  locale,
  onClose,
  onSubmit,
}: ResponseModalProps) {
  const t = useTranslations('MyPrayersPage');
  const [responseContent, setResponseContent] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [posting, setPosting] = useState(false);

  const handleSubmit = async () => {
    if (!responseContent.trim()) return;
    setPosting(true);
    await onSubmit(responseContent, isShared);
    setPosting(false);
    setResponseContent('');
    setIsShared(false);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-8 max-w-xl w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-3xl font-extrabold mb-6 text-gray-900">{prayer.title}</h3>
        <p className="mb-6 text-gray-800 whitespace-pre-wrap leading-relaxed">{prayer.content}</p>
        <p className="text-sm text-gray-600 mb-8">
          {t('category')}: {locale === 'ko' ? prayer.categoryText_ko : prayer.categoryText_en}
        </p>

        <label className="block font-semibold mb-3 text-gray-900">
          {t('responseContent')}
        </label>
        <textarea
          className="w-full border border-gray-400 rounded-lg p-4 mb-6 resize-y text-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          rows={5}
          placeholder={t('responsePlaceholder')}
          value={responseContent}
          onChange={(e) => setResponseContent(e.target.value)}
          disabled={posting}
        />

        <label className="flex items-center space-x-3 mb-6 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isShared}
            onChange={() => setIsShared(!isShared)}
            className="form-checkbox h-6 w-6 text-indigo-600 rounded focus:ring-indigo-500"
            disabled={posting}
          />
          <span className="text-gray-900 font-medium">{t('shareConsent')}</span>
        </label>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 text-gray-900 rounded-xl hover:bg-gray-300 transition font-semibold"
            disabled={posting}
          >
            {t('close')}
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-semibold disabled:opacity-60"
            disabled={posting || !responseContent.trim()}
          >
            {posting ? t('posting') : t('submitResponse')}
          </button>
        </div>
      </div>
    </div>
  );
}
