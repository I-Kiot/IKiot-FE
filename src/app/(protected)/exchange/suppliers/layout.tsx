// [Layout – Suppliers]
import { SuppliersProvider } from './_context/suppliers-provider'
import { SuppliersDialogs } from './_components/dialogs/suppliers-dialogs'

export default function SuppliersLayout({ children }: { children: React.ReactNode }) {
  return (
    <SuppliersProvider>
      {children}
      <SuppliersDialogs />
    </SuppliersProvider>
  )
}
