import React from 'react';
import { SQUARE_CONFIG } from '../../utils/squareConfig';

// Temporary debugging component for production Square issues
export const SquareDebugInfo: React.FC = () => {
  return (
    <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4'>
      <h3 className='text-lg font-medium text-yellow-800 mb-2'>🔧 Square Debug Info (Remove in Production)</h3>
      <div className='text-sm text-yellow-700 space-y-1'>
        <div>
          <strong>Environment:</strong> {import.meta.env.MODE}
        </div>
        <div>
          <strong>API Base URL:</strong> {import.meta.env.VITE_API_BASE_URL}
        </div>
        <div>
          <strong>Square App ID:</strong> {SQUARE_CONFIG.applicationId.substring(0, 10)}...
        </div>
        <div>
          <strong>Square Location ID:</strong> {SQUARE_CONFIG.locationId.substring(0, 10)}...
        </div>
        <div>
          <strong>Square Environment:</strong> {SQUARE_CONFIG.environment}
        </div>
        <div>
          <strong>Available Env Vars:</strong>{' '}
          {Object.keys(import.meta.env)
            .filter((key) => key.startsWith('VITE_'))
            .join(', ')}
        </div>
      </div>
      <button
        onClick={() => {
          console.log('Full import.meta.env:', import.meta.env);
          console.log('Square Config:', SQUARE_CONFIG);
        }}
        className='mt-2 px-3 py-1 bg-yellow-200 hover:bg-yellow-300 rounded text-yellow-800 text-xs'
      >
        Log Full Config to Console
      </button>
    </div>
  );
};

export default SquareDebugInfo;
