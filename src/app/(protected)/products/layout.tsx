import { ProductsProvider } from './_context/products-provider'
import { ProductsDialogs } from './_components/dialogs/products-dialogs'
import { PRODUCTS_SCREEN } from './_constants/product-screen'

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProductsProvider screen={PRODUCTS_SCREEN}>
      {children}
      <ProductsDialogs />
    </ProductsProvider>
  )
}
