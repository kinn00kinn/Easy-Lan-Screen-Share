import React from 'react';
import { Link } from 'react-router-dom';

function HomeScreen() {
  return (
    <>
      <h1>P2P Screen Share</h1>
      <p className="subtitle">サーバー不要・同一LAN内向け画面共有ツール</p>
      <div className="button-container">
        <Link to="/share" className="button primary-button">画面を配信する</Link>
        <Link to="/view" className="button secondary-button">配信を視聴する</Link>
      </div>
    </>
  );
}

export default HomeScreen;