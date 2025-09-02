
import React from 'react';

const TPEPage: React.FC = () => {
  return (
    <div className="w-full h-[80vh] bg-charcoal-slate rounded-xl overflow-hidden border border-champagne-gold/10 shadow-lg">
      <iframe
        src="https://targetpriceeval.netlify.app/"
        title="Target Price Evaluator"
        className="w-full h-full"
        style={{ border: 'none' }}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
};

export default TPEPage;
