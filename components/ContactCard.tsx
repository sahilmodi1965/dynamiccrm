import React, { useState } from 'react';

export default function ContactCard({ contact, rank }: { contact: any, rank: number }) {
  const [isDNC, setIsDNC] = useState(contact.doNotContact || false);
  
  let tierLabel = 'Tertiary';
  if (rank === 0) tierLabel = 'Primary';
  if (rank === 1) tierLabel = 'Secondary';

  return (
    <div className={`flex items-center gap-3 p-3 border rounded-lg transition-all ${
      isDNC ? 'bg-red-900/10 border-red-500/30 opacity-50' : 
      rank === 0 ? 'bg-orange-500/10 border-orange-500/30' : 
      'bg-gray-900 border-gray-800'
    }`}>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className={`font-semibold text-sm ${isDNC ? 'text-red-400 line-through' : 'text-white'}`}>
            {contact.contactName || 'Unknown Contact'}
          </p>
          {!isDNC && <span className="text-[10px] text-gray-500 uppercase tracking-wide">{tierLabel}</span>}
        </div>
        <p className="text-xs text-gray-400">
          {contact.title || 'No Title Provided'} {contact.department !== 'Unknown' && `• ${contact.department}`}
        </p>
      </div>
      
      <div className="flex flex-col items-end gap-1">
        {!isDNC && contact.isDecisionMaker && (
          <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide">
            Decision Maker
          </span>
        )}
        <div className="flex gap-2">
          <span className="bg-gray-800 text-gray-300 text-[10px] px-2 py-0.5 rounded">
            {contact.level}
          </span>
          <button 
            onClick={() => setIsDNC(!isDNC)}
            className={`text-[10px] px-2 py-0.5 rounded border ${isDNC ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'hover:bg-gray-800 text-gray-500 border-gray-700'}`}
          >
            {isDNC ? 'DNC Active' : 'Mark DNC'}
          </button>
        </div>
      </div>
    </div>
  );
}
