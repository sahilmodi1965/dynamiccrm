import React from 'react';

export default function ContactCard({ contact, rank }: { contact: any, rank: number }) {
  const isPrimary = rank === 0;
  
  return (
    <div className={`flex items-center gap-3 p-3 border rounded-lg ${isPrimary ? 'bg-orange-500/10 border-orange-500/30' : 'bg-gray-900 border-gray-800'}`}>
      <div className="flex-1">
        <p className="font-semibold text-sm text-white">{contact.contactName || 'Unknown Contact'}</p>
        <p className="text-xs text-gray-400">{contact.title || 'No Title Provided'}</p>
      </div>
      
      <div className="flex flex-col items-end gap-1">
        {contact.isDecisionMaker && (
          <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide">
            Decision Maker
          </span>
        )}
        <span className="bg-gray-800 text-gray-300 text-[10px] px-2 py-0.5 rounded">
          {contact.level}
        </span>
      </div>
    </div>
  );
}
