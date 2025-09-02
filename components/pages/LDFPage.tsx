
import React from 'react';

const LDFPage: React.FC = () => {
  return (
    <div className="w-full h-[80vh] bg-charcoal-slate rounded-xl overflow-hidden border border-champagne-gold/10 shadow-lg">
      <iframe
        src="https://luxurydealfinder.netlify.app/"
        title="Luxury Deal Finder"
        className="w-full h-full"
        style={{ border: 'none' }}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
};

export default LDFPage;
