// [Layout – Roles]
import { RolesDialogs } from './_components/dialogs/roles-dialogs'
import { RolesProvider } from './_context/roles-provider'

export default function RolesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RolesProvider>
      {children}
      <RolesDialogs />
    </RolesProvider>
  )
}
