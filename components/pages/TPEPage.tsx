import React from 'react';
import { useTheme } from '../../hooks/useTheme';

const TPEPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className={`w-full h-[80vh] rounded-xl overflow-hidden border shadow-lg ${
        isDark ? 'bg-charcoal-slate border-champagne-gold/10' : 'bg-white border-gray-200'
      }`}
    >
      <iframe
        src='https://targetpriceeval.netlify.app/'
        title='Target Price Evaluator'
        className='w-full h-full'
        style={{ border: 'none' }}
        sandbox='allow-scripts allow-same-origin allow-forms allow-popups'
      />
    </div>
  );
};

export default TPEPage;
