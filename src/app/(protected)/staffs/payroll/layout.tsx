import { PayrollProvider } from './_context/payroll-provider'
import { PayrollDialogs } from './_components/dialogs/payroll-dialogs'

export default function PayrollLayout({ children }: { children: React.ReactNode }) {
  return (
    <PayrollProvider>
      {children}
      <PayrollDialogs />
    </PayrollProvider>
  )
}
