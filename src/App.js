import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomeScreen from './screens/HomeScreen';
import ShareScreen from './screens/ShareScreen';
import ViewScreen from './screens/ViewScreen';

function App() {
  return (
    <div className="container">
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/share" element={<ShareScreen />} />
        <Route path="/view" element={<ViewScreen />} />
      </Routes>
    </div>
  );
}

export default App;