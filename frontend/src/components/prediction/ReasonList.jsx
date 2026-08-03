import React from 'react';

const ReasonList = ({ reasons }) => {
  if (!reasons || reasons.length === 0) return null;
  return (
    <ul className="space-y-2.5">
      {reasons.map((reason, idx) => (
        <li key={idx} className="flex items-start gap-3">
          <span className="w-5 h-5 rounded-full bg-black text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
            {idx + 1}
          </span>
          <span className="text-gray-700 text-sm leading-snug">{reason}</span>
        </li>
      ))}
    </ul>
  );
};

export default ReasonList;
