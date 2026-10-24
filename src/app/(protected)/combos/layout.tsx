import { ProductsProvider } from '../products/_context/products-provider'
import { ProductsDialogs } from '../products/_components/dialogs/products-dialogs'
import { COMBOS_SCREEN } from '../products/_constants/product-screen'

/** Màn combo dùng lại toàn bộ màn hàng hoá, chỉ khác bộ lọc / loại tạo mới (COMBOS_SCREEN). */
export default function CombosLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProductsProvider screen={COMBOS_SCREEN}>
      {children}
      <ProductsDialogs />
    </ProductsProvider>
  )
}
