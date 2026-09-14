import React, { useState } from 'react';
import { ChevronDown, Plus, Store } from '../ui/Icons';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

// Only rendered when an owner has more than one business — most accounts
// never see this, matching the app's original single-business behavior.
const BusinessSwitcher: React.FC = () => {
  const { businesses, activeBusinessId, setActiveBusinessId, createBusiness } = useAuth();
  const { addToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');

  if (businesses.length <= 1) return null;

  const active = businesses.find(b => b.id === activeBusinessId);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createBusiness(newName.trim());
      setNewName('');
      setIsCreating(false);
      setIsOpen(false);
    } catch (err: any) {
      addToast('error', err.message || 'Could not create business');
    }
  };

  return (
    <div className="relative mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors"
      >
        <span className="flex items-center gap-2 truncate">
          <Store size={16} className="text-orange-500 flex-shrink-0" />
          <span className="truncate text-sm font-semibold">{active?.name}</span>
        </span>
        <ChevronDown size={16} className={`transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 z-40 overflow-hidden">
          {businesses.map(b => (
            <button
              key={b.id}
              onClick={() => {
                setActiveBusinessId(b.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${b.id === activeBusinessId ? 'text-orange-600 font-semibold' : 'text-slate-700'}`}
            >
              {b.name}
            </button>
          ))}
          <div className="border-t border-gray-100 p-2">
            {isCreating ? (
              <form onSubmit={handleCreate} className="flex gap-1">
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="New business name"
                  className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded"
                />
                <button type="submit" className="px-2 py-1.5 bg-slate-900 text-white rounded text-sm font-bold">
                  Add
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-slate-500 hover:text-slate-800"
              >
                <Plus size={14} /> Add Business
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessSwitcher;
