import { ProductsProvider } from './_context/products-provider'
import { ProductsDialogs } from './_components/dialogs/products-dialogs'

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProductsProvider>
      {children}
      <ProductsDialogs />
    </ProductsProvider>
  )
}
