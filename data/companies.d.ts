import { Company } from '@/lib/types'

declare module '@/data/companies.json' {
  const companies: Company[]
  export default companies
}
