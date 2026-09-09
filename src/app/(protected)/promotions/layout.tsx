// [Layout – Promotions]
import { PromotionsProvider } from './_context/promotions-provider'
import { PromotionsDialogs } from './_components/dialogs/promotions-dialogs'

export default function PromotionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <PromotionsProvider>
      {children}
      <PromotionsDialogs />
    </PromotionsProvider>
  )
}
