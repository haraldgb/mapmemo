import { BrowserRouter, Route, Routes } from 'react-router-dom'
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
      </Routes>
    </BrowserRouter>
  )
}
