import { z } from "zod";
import { PLAN_FEATURE_OPTIONS } from "../_constants/plan-features";

const VALID_FEATURE_KEYS = PLAN_FEATURE_OPTIONS.map((f) => f.key) as [
  string,
  ...string[],
];

// -1 = unlimited; any value below that is invalid
const limitField = z
  .number({ error: "Phải là số" })
  .int("Phải là số nguyên")
  .min(-1, "Dùng -1 cho không giới hạn");

export const planFormSchema = z.object({
  planName: z.string().min(1, "Tên gói là bắt buộc"),
  description: z.string().optional(),
  price: z.number({ error: "Phải là số" }).min(0, "Giá không được âm"),
  maxBranches: limitField,
  maxUsers: limitField,
  maxProducts: limitField,
  trialDays: z
    .number({ error: "Phải là số" })
    .int("Phải là số nguyên")
    .min(0, "Không được âm"),
  features: z.array(z.enum(VALID_FEATURE_KEYS)),
  // Textarea: one bullet per line; split into an array on submit.
  displayFeaturesText: z.string().optional(),
  isPopular: z.boolean(),
  isActive: z.boolean(),
});

export type PlanFormValues = z.infer<typeof planFormSchema>;
