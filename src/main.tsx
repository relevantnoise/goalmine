import React from "react";
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Force rebuild - bundled Firebase v2

const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);