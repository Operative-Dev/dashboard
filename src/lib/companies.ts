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
    postbridgeAccountIds: [50441, 50442, 51056, 51057, 51058], // @novistartuptips, @novi.startup.idea, @novistartup, @noviapp7, @noviai91
    postbridgeApiKey: 'pb_live_Paed5uuR1qdGnYux2qoXty',
    platforms: ['tiktok', 'instagram'],
    color: '#3b82f6', // blue
    status: 'active',
  },
  {
    id: 'thoughtful',
    name: 'Thoughtful',
    slug: 'thoughtful',
    postbridgeAccountIds: [52269, 50430, 51812, 52268], // @solobuilder7, @newtoolwhodis, @fractionalpm5, @foundermode22
    postbridgeApiKey: 'pb_live_JyMJsnUzEW8DzGpeSrYuk1',
    platforms: ['tiktok', 'instagram'],
    color: '#f59e0b', // amber
    status: 'active',
  },
  {
    id: 'landtrust',
    name: 'LandTrust',
    slug: 'landtrust',
    postbridgeAccountIds: [52784, 52785, 52786], // @senditoutdoors22 — tiktok, instagram, youtube
    postbridgeApiKey: 'pb_live_FmhcTL43yqcqWmMGNTw85f',
    platforms: ['tiktok', 'instagram', 'youtube'],
    color: '#16a34a', // green (outdoors)
    status: 'onboarding',
  },
  {
    id: 'hoot',
    name: 'Hoot',
    slug: 'hoot',
    postbridgeAccountIds: [52787, 52788, 52789], // @snackit73 — tiktok, instagram, youtube
    postbridgeApiKey: 'pb_live_FmhcTL43yqcqWmMGNTw85f',
    platforms: ['tiktok', 'instagram', 'youtube'],
    color: '#8b5cf6', // violet
    status: 'onboarding',
  },
  {
    id: 'hexbook',
    name: 'HexBook',
    slug: 'hexbook',
    postbridgeAccountIds: [], // TBD — awaiting account creation
    postbridgeApiKey: '', // TBD — needs PostBridge onboarding
    platforms: ['tiktok'],
    color: '#ef4444', // red (party/cocktails)
    status: 'onboarding',
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