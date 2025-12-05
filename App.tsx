import React, { useState } from 'react';
import { View, ViewState } from './types';
import Dashboard from './components/Dashboard';
import Library from './components/Library';
import Movies from './components/Movies';
import StudyRoom from './components/StudyRoom';
import Archive from './components/Archive';
import Courses from './components/Courses';

const App: React.FC = () => {
  const [currentViewState, setCurrentViewState] = useState<ViewState>({ view: View.DASHBOARD });

  const setView = (view: View, params?: any) => {
    setCurrentViewState({ view, params });
  };

  const renderView = () => {
    switch (currentViewState.view) {
      case View.DASHBOARD:
        return <Dashboard onChangeView={setView} />;
      case View.LIBRARY:
        return <Library onBack={() => setView(View.DASHBOARD)} />;
      case View.MOVIES:
        return <Movies onBack={() => setView(View.DASHBOARD)} />;
      case View.STUDY:
        return <StudyRoom onBack={() => setView(View.DASHBOARD)} initialTab={currentViewState.params?.tab} />;
      case View.ARCHIVE:
        return <Archive onBack={() => setView(View.DASHBOARD)} />;
      case View.COURSES:
        return <Courses onBack={() => setView(View.DASHBOARD)} />;
      default:
        return <Dashboard onChangeView={setView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {renderView()}
    </div>
  );
};

export default App;