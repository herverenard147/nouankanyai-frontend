import { Outlet } from 'react-router-dom'

export function PublicLayout() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-accent-cta focus:px-4 focus:py-2 focus:text-white"
      >
        Aller au contenu
      </a>
      <Outlet />
    </>
  )
}
