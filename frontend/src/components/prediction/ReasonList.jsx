import React from 'react';

const ReasonList = ({ reasons }) => {
  if (!reasons || reasons.length === 0) return null;

  return (
    <ul className="space-y-2.5">
      {reasons.map((reason, idx) => (
        <li key={idx} className="flex items-start gap-2.5">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-gray-700 text-sm leading-snug">{reason}</span>
        </li>
      ))}
    </ul>
  );
};

export default ReasonList;
