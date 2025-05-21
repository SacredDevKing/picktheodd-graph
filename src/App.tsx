import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ChartPage from './pages/ChartPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChartPage />}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
