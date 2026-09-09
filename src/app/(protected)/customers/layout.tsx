// [Layout – Customers]
import { CustomersProvider } from './_context/customers-provider'
import { CustomersDialogs } from './_components/dialogs/customers-dialogs'

export default function CustomersLayout({ children }: { children: React.ReactNode }) {
  return (
    <CustomersProvider>
      {children}
      <CustomersDialogs />
    </CustomersProvider>
  )
}
