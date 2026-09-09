import { PageHeader } from "@/components/page-header"
import { FAQList } from "./components/faq-list"
import { FeaturesGrid } from "./components/features-grid"

// Import data
import categoriesData from "./data/categories.json"
import faqsData from "./data/faqs.json"
import featuresData from "./data/features.json"

export default function FAQsPage() {
  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/dashboard' },
          { label: 'Câu hỏi thường gặp' },
        ]}
        title="Câu hỏi thường gặp"
        description="Tìm câu trả lời cho các thắc mắc phổ biến về iKiot"
      />
      <FAQList faqs={faqsData} categories={categoriesData} />
      <FeaturesGrid features={featuresData} />
    </div>
  )
}
