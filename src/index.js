import React from "react";
import ReactDOM from "react-dom/client";
// 変更点: HashRouter を BrowserRouter に変更
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./App.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    {/* 変更点: ここも BrowserRouter に変更 */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
