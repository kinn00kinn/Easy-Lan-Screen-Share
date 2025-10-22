import React from 'react';
import ReactDOM from 'react-dom/client';
// 変更点: BrowserRouterをHashRouterに変更
import { HashRouter } from 'react-router-dom';
import App from './App';
import './App.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* 変更点: HashRouterに変更し、basenameを削除 */}
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);