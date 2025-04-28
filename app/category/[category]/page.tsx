import { MainLayout } from "@/components/main-layout"
import { CategoryPage } from "@/components/category-page"

export default function CategoryPageRoute({ params }: { params: { category: string } }) {
  return (
    <MainLayout>
      <CategoryPage category={params.category} />
    </MainLayout>
  )
}

