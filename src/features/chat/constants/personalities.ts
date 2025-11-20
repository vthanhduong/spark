export interface PersonalityOption {
  slug: string
  name: string
  description: string
}

export const PERSONALITY_OPTIONS: PersonalityOption[] = [
  {
    slug: 'markiai',
    name: 'Marki AI',
    description: 'Trợ lý AI thân thiện của NYTX Team, hỗ trợ lập trình và công nghệ.',
  },
  {
    slug: 'sieumatday',
    name: 'Siêu mất dạy',
    description: 'Nhân vật hài hước với phong cách châm biếm và ngôn ngữ thô tục.',
  },
  {
    slug: 'vinhyet',
    name: 'Vinh yet',
    description: 'Nhân vật đầy mỉa mai với biểu tượng yêu thương và ngôn ngữ táo bạo.',
  },
]

export const DEFAULT_PERSONALITY_SLUG = PERSONALITY_OPTIONS[0].slug
