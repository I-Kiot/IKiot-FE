// [Layout – Categories]
import { CategoriesProvider } from './_context/categories-provider'
import { CategoriesDialogs } from './_components/dialogs/categories-dialogs'

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return (
    <CategoriesProvider>
      {children}
      <CategoriesDialogs />
    </CategoriesProvider>
  )
}
