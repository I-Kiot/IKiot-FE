// [Dialogs – Roles orchestrator]
'use client'

import { useRoles } from '../../_context/roles-provider'
import { RolesDeleteDialog } from './roles-delete-dialog'
import { RolesMutateDialog } from './roles-mutate-dialog'

export function RolesDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useRoles()

  function close() {
    setOpen(null)
    // Giữ currentRow thêm một nhịp để nội dung không nhấp nháy trong lúc dialog đóng.
    setTimeout(() => setCurrentRow(null), 300)
  }

  return (
    <>
      <RolesMutateDialog
        key={`role-add`}
        open={open === 'add'}
        onOpenChange={(value) => (value ? setOpen('add') : close())}
      />
      {currentRow && (
        <>
          <RolesMutateDialog
            key={`role-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={(value) => (value ? setOpen('edit') : close())}
            currentRow={currentRow}
          />
          <RolesDeleteDialog
            key={`role-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={(value) => (value ? setOpen('delete') : close())}
            currentRow={currentRow}
          />
        </>
      )}
    </>
  )
}
