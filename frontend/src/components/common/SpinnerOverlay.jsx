import React from 'react';

const SpinnerOverlay = () => {
  return (
    <div className="fixed inset-0 bg-slate-50 bg-opacity-40 flex items-center justify-center z-50">
      <div className="loader border-4 border-t-blue-500 rounded-full w-12 h-12 animate-spin"></div>
    </div>
  );
};

export default SpinnerOverlay;
