import React from 'react';
import { BrandMark } from '../BrandMark';

interface SetupHeaderProps {
  intensityLabel?: string;
}

export const SetupHeader: React.FC<SetupHeaderProps> = ({ intensityLabel }) => {
  return (
    <header className="h-14 grid grid-cols-3 items-center px-4">
      <div className="justify-self-start">
        <BrandMark />
      </div>
      <div className="justify-self-center font-display text-xl font-bold text-white">
        SETUP
      </div>
      <div className="justify-self-end">
        {intensityLabel && (
          <span className="rounded-pill bg-bg-800/80 px-3 py-1 text-sm font-semibold text-white">
            {intensityLabel}
          </span>
        )}
      </div>
    </header>
  );
};
