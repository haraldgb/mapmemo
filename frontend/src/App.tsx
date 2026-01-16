import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Landing } from './pages/Landing'
import { MapMemoPage } from './mapMemo/MapMemoPage'
import { MapMemo } from './mapMemo/MapMemo'
import { MapMemoV2 } from './mapMemo/MapMemoV2'

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/mapmemov1"
          element={
            <MapMemoPage>
              <MapMemo />
            </MapMemoPage>
          }
        />
        <Route
          path="/mapmemov2"
          element={
            <MapMemoPage>
              <MapMemoV2 />
            </MapMemoPage>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
