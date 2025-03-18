import { MainLayout } from "@/components/main-layout"
import { HashtagPage } from "@/components/hashtag-page"

export default function HashtagPageRoute({ params }: { params: { tag: string } }) {
  return (
    <MainLayout>
      <HashtagPage tag={params.tag} />
    </MainLayout>
  )
}

