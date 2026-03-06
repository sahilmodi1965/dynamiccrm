interface Company {
  name?: string
  companyName?: string
  [key: string]: any
}

function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function getCompanyName(company: Company): string {
  return company.name || company.companyName || ''
}

function similarity(a: string, b: string): number {
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return 1
  if (na.includes(nb) || nb.includes(na)) return 0.8
  let matches = 0
  for (let i = 0; i < Math.min(na.length, nb.length); i++) {
    if (na[i] === nb[i]) matches++
  }
  return matches / Math.max(na.length, nb.length)
}

export function deduplicateCompanies(companies: Company[], threshold = 0.8): Company[] {
  const unique: Company[] = []
  for (const company of companies) {
    const name = getCompanyName(company)
    if (name === '') continue
    const isDuplicate = unique.some(u => similarity(getCompanyName(u), name) >= threshold)
    if (isDuplicate === false) unique.push(company)
  }
  return unique
}

export function findBestMatch(name: string, list: Company[]): Company | null {
  let best: Company | null = null
  let bestScore = 0
  for (const item of list) {
    const score = similarity(name, getCompanyName(item))
    if (score > bestScore) {
      bestScore = score
      best = item
    }
  }
  return bestScore >= 0.7 ? best : null
}
