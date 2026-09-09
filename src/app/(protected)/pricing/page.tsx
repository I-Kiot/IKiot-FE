import { PageHeader } from "@/components/page-header"
import { PricingPlans } from "@/components/pricing-plans"
import { FeaturesGrid } from "./components/features-grid"
import { FAQSection } from "./components/faq-section"

// Import data
import featuresData from "./data/features.json"
import faqsData from "./data/faqs.json"

export default function PricingPage() {
  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/dashboard' },
          { label: 'Gói dịch vụ' },
        ]}
        title="Gói dịch vụ"
        description="Chọn gói phù hợp với quy mô kinh doanh của bạn"
      />
      {/* Pricing Cards */}
      <section className='pb-12' id='pricing'>
        <PricingPlans mode="pricing" />
      </section>

      {/* Features Section */}
      <FeaturesGrid features={featuresData} />

      {/* FAQ Section */}
      <FAQSection faqs={faqsData} />
    </div>
  )
}
