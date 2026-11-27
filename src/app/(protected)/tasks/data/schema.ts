import { z } from "zod"

// Schema phẳng, không quan hệ: dữ liệu tasks hiện là mẫu tĩnh.
export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  category: z.string(),
  priority: z.string(),
})

export type Task = z.infer<typeof taskSchema>
