import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { DelbydelGame } from './game/DelbydelGame'
import { Landing } from './landingPage/Landing'
import { MapMemoPage } from './mapMemo/MapMemoPage'
import { MapMemo } from './mapMemo/MapMemo'

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/mapmemo"
          element={
            <MapMemoPage>
              <MapMemo />
            </MapMemoPage>
          }
        />
        <Route path="/game" element={<DelbydelGame />} />
      </Routes>
    </BrowserRouter>
  )
}
