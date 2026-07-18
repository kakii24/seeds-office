import React, { useState } from 'react';
import NavBar from './NavBar.jsx';
import RegistrationView from '../window1/App.jsx';
import DistributionView from '../window2/App.jsx';
import AlertsView from '../alerts/AlertsView.jsx';

/**
 * Application shell: a single window with a top nav bar that switches between
 * the three views. All views stay mounted (the inactive one is display:none via
 * `hidden`) so in-progress form state is preserved and each view stays fresh
 * through the cross-view `onDataChanged` refresh.
 */
export default function App() {
  const [view, setView] = useState('registration');

  return (
    <div className="flex h-screen flex-col bg-canvas">
      <NavBar view={view} onChange={setView} />
      {/* Static (non-positioned) wrapper so the printable document's containing
          block stays the page and is never clipped during printing. */}
      <div className="flex-1 overflow-hidden">
        <div className={view === 'registration' ? 'h-full' : 'hidden'}>
          <RegistrationView />
        </div>
        <div className={view === 'distribution' ? 'h-full' : 'hidden'}>
          <DistributionView />
        </div>
        <div className={view === 'alerts' ? 'h-full' : 'hidden'}>
          <AlertsView />
        </div>
      </div>
    </div>
  );
}
