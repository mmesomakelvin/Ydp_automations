import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'
import { ProductPage } from '@/components/ProductPage'
import { DataShapePage } from '@/components/DataShapePage'
import { DesignPage } from '@/components/DesignPage'
import { SectionsPage } from '@/components/SectionsPage'
import { SectionPage } from '@/components/SectionPage'
import { ScreenDesignPage, ScreenDesignFullscreen } from '@/components/ScreenDesignPage'
import { ShellDesignPage, ShellDesignFullscreen } from '@/components/ShellDesignPage'
import { ExportPage } from '@/components/ExportPage'
import LiveApp from '@/app/LiveApp'

/**
 * Design OS planning routes. These are the internal planning tool (roadmap,
 * specs, screen designs, export packages) and are development-only — the
 * deployed site serves the product, not the workspace used to plan it.
 */
const planningRoutes: RouteObject[] = [
  { path: '/', element: <ProductPage /> },
  { path: '/data-shape', element: <DataShapePage /> },
  { path: '/design', element: <DesignPage /> },
  { path: '/sections', element: <SectionsPage /> },
  { path: '/sections/:sectionId', element: <SectionPage /> },
  {
    path: '/sections/:sectionId/screen-designs/:screenDesignName',
    element: <ScreenDesignPage />,
  },
  {
    path: '/sections/:sectionId/screen-designs/:screenDesignName/fullscreen',
    element: <ScreenDesignFullscreen />,
  },
  { path: '/shell/design', element: <ShellDesignPage /> },
  { path: '/shell/design/fullscreen', element: <ShellDesignFullscreen /> },
  { path: '/export', element: <ExportPage /> },
  // The live product, reachable alongside the planning tool in development.
  { path: '/app', element: <LiveApp /> },
]

/**
 * Production routes: the YDP Mentorship Hub only. Serving it from the root
 * keeps mentors and mentees on the product, and leaving the planning pages out
 * of the route table keeps them out of the shipped bundle entirely.
 */
const productionRoutes: RouteObject[] = [
  { path: '/', element: <LiveApp /> },
  { path: '*', element: <Navigate to="/" replace /> },
]

export const router = createBrowserRouter(
  import.meta.env.PROD ? productionRoutes : planningRoutes,
)
