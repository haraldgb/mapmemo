import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Landing } from './pages/Landing'
import { MapMemo } from './mapMemo/MapMemo'

export const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/mapmemo" element={<MapMemo />} />
    </Routes>
  </BrowserRouter>
)
