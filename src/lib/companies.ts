export interface Company {
  id: string;
  name: string;
  slug: string;
  postbridgeAccountIds: number[]; // PostBridge account IDs belonging to this company
  postbridgeApiKey: string; // PostBridge API key for this company (empty = not onboarded)
  platforms: string[];
  color: string; // accent color for the company
  status: 'active' | 'onboarding' | 'paused';
}

export const companies: Company[] = [
  {
    id: 'woz',
    name: 'Woz',
    slug: 'woz',
    postbridgeAccountIds: [47791, 47792, 47793, 47796, 47852],
    postbridgeApiKey: 'pb_live_3xh1Ms7WDVTy3XG7f1wdDk',
    platforms: ['tiktok'],
    color: '#10b981', // emerald
    status: 'active',
  },
  {
    id: 'novi',
    name: 'Novi',
    slug: 'novi',
    postbridgeAccountIds: [],
    postbridgeApiKey: 'pb_live_Paed5uuR1qdGnYux2qoXty',
    platforms: ['tiktok', 'instagram'],
    color: '#3b82f6', // blue
    status: 'active',
  },
  {
    id: 'thoughtful',
    name: 'Thoughtful',
    slug: 'thoughtful',
    postbridgeAccountIds: [50426, 50430], // @solobuilder7, @newtoolwhodis
    postbridgeApiKey: 'pb_live_JyMJsnUzEW8DzGpeSrYuk1',
    platforms: ['tiktok', 'instagram'],
    color: '#f59e0b', // amber
    status: 'active',
  },
];

export function getCompanyBySlug(slug: string): Company | null {
  return companies.find(company => company.slug === slug) || null;
}

export function getCompanyAccountIds(companySlug: string): number[] {
  if (companySlug === 'all') {
    return companies.flatMap(company => company.postbridgeAccountIds);
  }
  
  const company = getCompanyBySlug(companySlug);
  return company ? company.postbridgeAccountIds : [];
}