import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import MovieDetail from './pages/MovieDetail';
import Upload from './pages/Upload';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"         element={<Home />} />
        <Route path="/movie/:id" element={<MovieDetail />} />
        <Route path="/upload"   element={<Upload />} />
      </Routes>
    </BrowserRouter>
  );
}
