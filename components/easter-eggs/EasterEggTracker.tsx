import { useState, useEffect } from 'react';
import { useEasterEggs } from '@/lib/easter-eggs/manager';

type EasterEggTrackerProps = {
  showAll?: boolean; // If true, shows all eggs (admin mode). If false, only shows discovered eggs.
};

export default function EasterEggTracker({ showAll = false }: EasterEggTrackerProps) {
  const { getAllEggs, getDiscoveredCount, getTotalCount } = useEasterEggs();
  const [eggs, setEggs] = useState<ReturnType<typeof getAllEggs>>([]);
  
  useEffect(() => {
    const allEggs = getAllEggs();
    
    // Filter eggs based on the showAll prop
    const eggsToShow = showAll 
      ? allEggs 
      : allEggs.filter(egg => egg.discovered);
    
    setEggs(eggsToShow);
  }, [getAllEggs, showAll, getDiscoveredCount]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Easter Eggs</h2>
      
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Progress:</span>
          <span className="text-sm font-medium">
            {getDiscoveredCount()} / {getTotalCount()}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
          <div 
            className="bg-indigo-600 h-2.5 rounded-full" 
            style={{ width: `${(getDiscoveredCount() / getTotalCount()) * 100}%` }}
          ></div>
        </div>
      </div>

      {eggs.length > 0 ? (
        <ul className="space-y-3">
          {eggs.map(egg => (
            <li key={egg.id} className={`p-3 rounded-md ${egg.discovered ? 'bg-indigo-50' : 'bg-gray-50'}`}>
              <div className="flex items-start">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${egg.discovered ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-500'}`}>
                  {egg.discovered ? '✓' : '?'}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {egg.discovered || showAll ? egg.effect.name : 'Hidden Easter Egg'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {egg.discovered || showAll ? egg.effect.description : 'This Easter egg is waiting to be discovered!'}
                  </p>
                  {showAll && (
                    <div className="mt-2 text-xs text-gray-500">
                      <p><strong>ID:</strong> {egg.id}</p>
                      <p><strong>Trigger:</strong> {egg.trigger}{egg.triggerPattern && typeof egg.triggerPattern === 'string' ? ` (${egg.triggerPattern})` : ''}</p>
                      <p><strong>Status:</strong> {egg.enabled ? 'Enabled' : 'Disabled'}</p>
                      <p><strong>Discovered:</strong> {egg.discovered ? 'Yes' : 'No'}</p>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-500">No Easter eggs discovered yet!</p>
          <p className="text-sm text-gray-400 mt-1">Keep exploring the website to find them.</p>
        </div>
      )}
    </div>
  );
}
