// [Layout – Brands]
import { BrandsProvider } from './_context/brands-provider'
import { BrandsDialogs } from './_components/dialogs/brands-dialogs'

export default function BrandsLayout({ children }: { children: React.ReactNode }) {
  return (
    <BrandsProvider>
      {children}
      <BrandsDialogs />
    </BrandsProvider>
  )
}
