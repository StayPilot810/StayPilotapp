export type BlogSection = {
  heading?: string
  paragraphs: string[]
  bullets?: string[]
  /** Paragraphes affichés après la liste à puces (si présente). */
  afterBullets?: string[]
}

export type BlogArticle = {
  indexLabel: string
  title: string
  lead: string[]
  sections: BlogSection[]
  conclusion: string[]
}

export type BlogPageCopy = {
  blogBackLink: string
  blogPageTitle: string
  blogPageSubtitle: string
  blogConclusionLabel: string
  articles: BlogArticle[]
}
