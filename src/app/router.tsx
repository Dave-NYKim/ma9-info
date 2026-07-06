import { createHashRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '@pages/login'
import { BattersPage } from '@pages/batters'
import { BatterEditPage } from '@pages/batter-edit'
import { PitchersPage } from '@pages/pitchers'
import { PitcherEditPage } from '@pages/pitcher-edit'
import { PotentialsPage } from '@pages/potentials'
import { AuthGuard } from './auth-guard'

export const router = createHashRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <AuthGuard />,
    children: [
      { index: true, element: <Navigate to="/batters" replace /> },
      { path: 'batters', element: <BattersPage /> },
      { path: 'batters/new', element: <BatterEditPage /> },
      { path: 'batters/:id', element: <BatterEditPage /> },
      { path: 'pitchers', element: <PitchersPage /> },
      { path: 'pitchers/new', element: <PitcherEditPage /> },
      { path: 'pitchers/:id', element: <PitcherEditPage /> },
      { path: 'potentials', element: <PotentialsPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/batters" replace /> },
])
