import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { useTheme } from '../../../../hooks/useTheme';

interface NotesPreviewProps {
  notes?: string;
  maxLength?: number;
  className?: string;
}

const NotesPreview: React.FC<NotesPreviewProps> = ({ notes, maxLength = 30, className = '' }) => {
  const { theme } = useTheme();
  const [showTooltip, setShowTooltip] = useState(false);

  if (!notes || notes.trim().length === 0) {
    return (
      <div
        className={`flex items-center ${className} ${theme === 'light' ? 'text-gray-400' : 'text-platinum-silver/40'}`}
      >
        <FileText size={14} className='opacity-30' />
        <span className='text-xs ml-1'>No notes</span>
      </div>
    );
  }

  const truncatedNotes = notes.length > maxLength ? `${notes.substring(0, maxLength)}...` : notes;

  const isTruncated = notes.length > maxLength;

  return (
    <div
      className={`relative flex items-start gap-1 ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <FileText
        size={14}
        className={`mt-0.5 flex-shrink-0 ${theme === 'light' ? 'text-blue-600/60' : 'text-champagne-gold/60'}`}
      />
      <span className={`text-xs leading-relaxed ${theme === 'light' ? 'text-gray-700' : 'text-platinum-silver/80'}`}>
        {truncatedNotes}
      </span>

      {/* Tooltip for full notes */}
      {isTruncated && showTooltip && (
        <div
          className={`absolute bottom-full left-0 mb-2 w-64 p-3 border rounded-lg shadow-xl z-50 ${
            theme === 'light' ? 'bg-white border-gray-300' : 'bg-obsidian-black border-champagne-gold/20'
          }`}
        >
          <div
            className={`text-xs leading-relaxed whitespace-pre-wrap ${
              theme === 'light' ? 'text-gray-700' : 'text-platinum-silver'
            }`}
          >
            {notes}
          </div>
          {/* Arrow pointer */}
          <div
            className={`absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${
              theme === 'light' ? 'border-t-gray-300' : 'border-t-champagne-gold/20'
            }`}
          ></div>
        </div>
      )}
    </div>
  );
};

export default NotesPreview;
