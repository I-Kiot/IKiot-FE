"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  initiateUpgrade,
  initiateRenewal,
  listPlans,
  type CurrentSubscription,
  type InitiateUpgradeResult,
  type Plan,
} from "@/lib/api/subscription";
import { PaymentDialog } from "./payment-dialog";

const TIER_ORDER = ["TRIAL", "PLUS", "PRO"] as const;

// Nội dung marketing (mô tả + bullet) và cờ nổi bật lấy động từ /plans.
const baseTier = (planCode: string) => planCode.replace(/_YEARLY$/, "");

const formatVnd = (amount: number) => `${amount.toLocaleString("vi-VN")}đ`;

interface UpgradePlanSectionProps {
  subscription: CurrentSubscription | null;
  /** Reloads the plan and invoices once a payment is confirmed. */
  onActivated: () => void | Promise<void>;
}

export function UpgradePlanSection({
  subscription,
  onActivated,
}: UpgradePlanSectionProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [isYearly, setIsYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [invoice, setInvoice] = useState<InitiateUpgradeResult | null>(null);

  const router = useRouter();
  const planParam = useSearchParams().get("plan");

  const currentPlanCode = subscription?.planCode ?? "TRIAL";
  const currentTier = baseTier(currentPlanCode);
  const currentTierIdx = TIER_ORDER.indexOf(
    currentTier as (typeof TIER_ORDER)[number],
  );

  const handleAction = async (
    action: "renew" | "upgrade",
    planCode: string,
  ) => {
    setLoadingPlan(planCode);
    try {
      const result =
        action === "renew"
          ? await initiateRenewal()
          : await initiateUpgrade(planCode);
      setInvoice(result);
      setDialogOpen(true);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          "Không thể khởi tạo thanh toán. Vui lòng thử lại.",
      );
    } finally {
      setLoadingPlan(null);
    }
  };

  const autoStartPendingUpgrade = (loadedPlans: Plan[]) => {
    if (!planParam) return;
    const planCode = planParam;

    router.replace("/settings/billing", { scroll: false });

    const target = loadedPlans.find((p) => p.planCode === planCode);
    if (!target || target.price === 0 || planCode === currentPlanCode) return;

    const targetIdx = TIER_ORDER.indexOf(
      baseTier(planCode) as (typeof TIER_ORDER)[number],
    );
    if (targetIdx === -1 || targetIdx < currentTierIdx) return;

    setIsYearly(target.billingCycle === "YEARLY");
    handleAction("upgrade", planCode);
  };

  useEffect(() => {
    let active = true;
    listPlans()
      .then((data) => {
        if (!active) return;
        setPlans(data);
        autoStartPendingUpgrade(data);
      })
      .catch(() => toast.error("Không thể tải danh sách gói dịch vụ."))
      .finally(() => {
        if (active) setPlansLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const tiers = useMemo(() => {
    return TIER_ORDER.map((tier) => ({
      tier,
      monthly: plans.find((p) => p.planCode === tier),
      yearly: plans.find((p) => p.planCode === `${tier}_YEARLY`),
    }));
  }, [plans]);

  const hasAnyYearly = useMemo(
    () => plans.some((p) => p.billingCycle === "YEARLY"),
    [plans],
  );

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Các gói dịch vụ</h3>
            <p className="text-sm text-muted-foreground">
              Nâng cấp để mở rộng tính năng và giới hạn sử dụng.
            </p>
          </div>

          {hasAnyYearly && (
            <ToggleGroup
              type="single"
              value={isYearly ? "yearly" : "monthly"}
              onValueChange={(value) =>
                value && setIsYearly(value === "yearly")
              }
              className="bg-secondary text-secondary-foreground rounded-full p-1 shadow-none"
            >
              <ToggleGroupItem
                value="monthly"
                className="data-[state=on]:bg-background px-5 !rounded-full cursor-pointer"
              >
                Hàng tháng
              </ToggleGroupItem>
              <ToggleGroupItem
                value="yearly"
                className="data-[state=on]:bg-background px-6 !rounded-full cursor-pointer"
              >
                Hàng năm
                <Badge variant="secondary" className="text-[10px]">
                  -20%
                </Badge>
              </ToggleGroupItem>
            </ToggleGroup>
          )}
        </div>

        {plansLoading ? (
          <div className="flex items-center justify-center rounded-xl border py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin mr-2" />
            Đang tải gói dịch vụ...
          </div>
        ) : (
          <div className="rounded-xl border">
            <div className="grid lg:grid-cols-3">
              {tiers.map(({ tier, monthly, yearly }) => {
                // TRIAL không có chu kỳ năm; các gói khác chọn theo toggle
                const selected =
                  tier !== "TRIAL" && isYearly && yearly ? yearly : monthly;
                if (!selected) return null;

                const tierIdx = TIER_ORDER.indexOf(tier);
                const isExactCurrent = selected.planCode === currentPlanCode;
                const isUpgradeTier = tierIdx > currentTierIdx;
                const isLowerTier = tierIdx < currentTierIdx;
                const isFree = selected.price === 0;
                const isLoading = loadingPlan === selected.planCode;
                const features = selected.displayFeatures ?? [];
                const isElevated =
                  isExactCurrent || (!!selected.isPopular && isUpgradeTier);

                // Xác định hành động + nhãn nút
                let label: string;
                let action: "renew" | "upgrade" | null = null;
                if (isExactCurrent) {
                  // Gói đang dùng đúng chu kỳ → cho gia hạn (trừ TRIAL)
                  if (tier === "TRIAL") {
                    label = "Gói hiện tại";
                  } else {
                    label = "Gia hạn";
                    action = "renew";
                  }
                } else if (isLowerTier || isFree) {
                  label = "Không khả dụng";
                } else if (isUpgradeTier) {
                  label = `Nâng cấp lên ${selected.planName}`;
                  action = "upgrade";
                } else {
                  // Cùng tier, khác chu kỳ
                  label = isYearly
                    ? "Chuyển sang gói năm"
                    : "Chuyển sang gói tháng";
                  action = "upgrade";
                }

                const disabled = action === null || isLoading;

                return (
                  <div
                    key={tier}
                    className={`p-8 grid grid-rows-subgrid row-span-4 gap-6 ${
                      isElevated
                        ? "my-2 mx-4 rounded-xl bg-card border-transparent shadow-xl ring-1 ring-foreground/10"
                        : ""
                    }`}
                  >
                    {/* Header */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-medium tracking-tight">
                          {tier === "TRIAL" ? "Dùng Thử" : selected.planName}
                        </span>
                        {isExactCurrent && (
                          <Badge className="rounded-full text-xs">
                            Đang sở hữu
                          </Badge>
                        )}
                        {selected.isPopular &&
                          !isExactCurrent &&
                          isUpgradeTier && (
                            <Badge
                              variant="secondary"
                              className="rounded-full text-xs"
                            >
                              Phổ biến
                            </Badge>
                          )}
                      </div>
                    </div>

                    {/* Price */}
                    <div>
                      <div className="text-4xl font-bold mb-1">
                        {isFree ? "Miễn phí" : formatVnd(selected.price)}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {tier === "TRIAL"
                          ? `${selected.trialDays} ngày dùng thử`
                          : selected.billingCycle === "YEARLY"
                            ? `Mỗi năm (~${formatVnd(Math.round(selected.price / 12))}/tháng)`
                            : "Mỗi tháng"}
                      </div>
                    </div>

                    {/* CTA */}
                    <div>
                      <Button
                        className={`w-full cursor-pointer my-2 ${
                          isExactCurrent
                            ? ""
                            : isElevated && !disabled
                              ? "shadow-md border-[0.5px] border-white/25 shadow-black/20 bg-primary ring-1 ring-primary/15 text-primary-foreground hover:bg-primary/90"
                              : "shadow-sm shadow-black/15 border border-transparent bg-background text-foreground ring-1 ring-foreground/10 hover:bg-muted/50"
                        }`}
                        variant={
                          isExactCurrent
                            ? "outline"
                            : isElevated && !disabled
                              ? "default"
                              : "secondary"
                        }
                        disabled={disabled}
                        onClick={() =>
                          action && handleAction(action, selected.planCode)
                        }
                      >
                        {isLoading && (
                          <Loader2 className="size-4 animate-spin mr-2" />
                        )}
                        {label}
                      </Button>
                    </div>

                    {/* Features */}
                    <div>
                      <ul role="list" className="space-y-3 text-sm">
                        {features.map((feature) => (
                          <li key={feature} className="flex items-center gap-3">
                            <Check
                              className="size-4 flex-shrink-0 text-muted-foreground"
                              strokeWidth={2.5}
                            />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <PaymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        invoice={invoice}
        onActivated={onActivated}
      />
    </>
  );
}
