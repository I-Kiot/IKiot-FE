"use client";

import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  listPlans,
  groupPlansByTier,
  type Plan,
  type PlanTierGroup,
} from "@/lib/api/subscription";

const formatVnd = (amount: number) =>
  amount === 0 ? "Miễn phí" : `${amount.toLocaleString("vi-VN")}đ`;

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listPlans()
      .then((data) => active && setPlans(data))
      .catch(() => active && setPlans([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const tiers = useMemo(() => groupPlansByTier(plans), [plans]);
  const hasAnyYearly = useMemo(
    () => plans.some((p) => p.billingCycle === "YEARLY"),
    [plans],
  );

  const signUpHref = (plan: Plan) => {
    if (plan.price === 0) return "/sign-up";
    const yearly = isYearly && plan.billingCycle !== "YEARLY";
    return `/sign-up?plan=${yearly ? `${plan.planCode}_YEARLY` : plan.planCode}`;
  };

  // Pick the plan to show for a tier based on the monthly/yearly toggle.
  const selectedOf = (group: PlanTierGroup): Plan | undefined =>
    isYearly && group.yearly ? group.yearly : group.monthly;

  return (
    <section id="pricing" className="py-24 sm:py-32 bg-muted/70">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-12">
          <Badge variant="outline" className="mb-4">
            Gói dịch vụ iKiot
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Bảng giá dịch vụ hợp lý
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Phù hợp với mọi quy mô từ 1 cửa hàng bán lẻ cho đến chuỗi phân phối
            lớn.
          </p>

          {/* Billing Toggle */}
          {hasAnyYearly && (
            <>
              <div className="flex items-center justify-center mb-2">
                <ToggleGroup
                  type="single"
                  value={isYearly ? "yearly" : "monthly"}
                  onValueChange={(value) => setIsYearly(value === "yearly")}
                  className="bg-secondary text-secondary-foreground border-none rounded-full p-1 cursor-pointer shadow-none"
                >
                  <ToggleGroupItem
                    value="monthly"
                    className="data-[state=on]:bg-background data-[state=on]:border-border border-transparent border px-6 !rounded-full data-[state=on]:text-foreground hover:bg-transparent cursor-pointer transition-colors"
                  >
                    Hàng tháng
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="yearly"
                    className="data-[state=on]:bg-background data-[state=on]:border-border border-transparent border px-6 !rounded-full data-[state=on]:text-foreground hover:bg-transparent cursor-pointer transition-colors"
                  >
                    Hàng năm
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <p className="text-sm text-muted-foreground">
                <span className="text-primary font-semibold">
                  Tiết kiệm hơn 20%
                </span>{" "}
                khi đăng ký thanh toán hàng năm
              </p>
            </>
          )}
        </div>

        {/* Pricing Cards */}
        {loading ? (
          <div className="mx-auto flex max-w-6xl items-center justify-center rounded-xl border py-24 text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin" />
            Đang tải bảng giá...
          </div>
        ) : tiers.length === 0 ? (
          <div className="mx-auto max-w-6xl rounded-xl border py-16 text-center text-muted-foreground">
            Hiện chưa có gói dịch vụ nào.
          </div>
        ) : (
          <div className="mx-auto max-w-6xl">
            <div className="rounded-xl border">
              <div className="grid lg:grid-cols-3">
                {tiers.map((group, index) => {
                  const plan = selectedOf(group);
                  if (!plan) return null;

                  const isTrial = plan.price === 0;
                  const prevGroup = tiers[index - 1];
                  const prevName =
                    prevGroup && selectedOf(prevGroup)?.planName;
                  const includesPrevious =
                    !isTrial && prevName ? `Bao gồm gói ${prevName} và` : null;

                  return (
                    <div
                      key={group.tier}
                      className={`p-8 grid grid-rows-subgrid row-span-4 gap-6 ${
                        plan.isPopular
                          ? "my-2 mx-4 rounded-xl bg-card border-transparent shadow-xl ring-1 ring-foreground/10 backdrop-blur"
                          : ""
                      }`}
                    >
                      {/* Plan Header */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg font-medium tracking-tight">
                            {plan.planName}
                          </span>
                          {plan.isPopular && (
                            <Badge variant="secondary" className="text-xs">
                              Phổ biến
                            </Badge>
                          )}
                        </div>
                        <div className="text-muted-foreground text-balance text-sm">
                          {plan.description}
                        </div>
                      </div>

                      {/* Pricing */}
                      <div>
                        <div className="text-4xl font-bold mb-1">
                          {formatVnd(plan.price)}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          {isTrial
                            ? `${plan.trialDays} ngày dùng thử`
                            : plan.billingCycle === "YEARLY"
                              ? `Mỗi năm (~${formatVnd(Math.round(plan.price / 12))}/tháng)`
                              : "Mỗi tháng"}
                        </div>
                      </div>

                      {/* CTA Button */}
                      <div>
                        <Button
                          className={`w-full cursor-pointer my-2 ${
                            plan.isPopular
                              ? "shadow-md border-[0.5px] border-white/25 shadow-black/20 bg-primary ring-1 ring-primary/15 text-primary-foreground hover:bg-primary/90"
                              : "shadow-sm shadow-black/15 border border-transparent bg-background text-foreground ring-1 ring-foreground/10 hover:bg-muted/50"
                          }`}
                          variant={plan.isPopular ? "default" : "secondary"}
                          asChild
                        >
                          <Link href={signUpHref(plan)}>
                            {isTrial
                              ? "Bắt đầu dùng thử"
                              : `Đăng ký gói ${plan.planName}`}
                          </Link>
                        </Button>
                      </div>

                      {/* Features */}
                      <div>
                        <ul role="list" className="space-y-3 text-sm">
                          {includesPrevious && (
                            <li className="flex items-center gap-3 font-medium">
                              {includesPrevious}:
                            </li>
                          )}
                          {(plan.displayFeatures ?? []).map(
                            (feature, featureIndex) => (
                              <li
                                key={featureIndex}
                                className="flex items-center gap-3"
                              >
                                <Check
                                  className="text-muted-foreground size-4 flex-shrink-0"
                                  strokeWidth={2.5}
                                />
                                <span>{feature}</span>
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Enterprise Note */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            Bạn cần gói tính năng tùy chỉnh hoặc có câu hỏi thắc mắc?{" "}
            <Button
              variant="link"
              className="p-0 h-auto cursor-pointer"
              asChild
            >
              <a href="#contact">Liên hệ với đội ngũ của chúng tôi</a>
            </Button>
          </p>
        </div>
      </div>
    </section>
  );
}
