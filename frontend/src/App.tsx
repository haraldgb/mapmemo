import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Landing } from './pages/Landing'
import { MapMemoPage } from './mapMemo/MapMemoPage'

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/mapmemo" element={<MapMemoPage />} />
      </Routes>
    </BrowserRouter>
  )
}
