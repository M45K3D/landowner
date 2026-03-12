export interface Property {
  id: number;
  title_number: string;
  tenure: string | null;
  property_address: string | null;
  postcode: string | null;
  proprietor_name: string;
  company_number: string | null;
  date_added: string | null;
  proprietorship_cat: string | null;
}

export interface CompanyGroupData {
  company_name: string;
  company_number: string | null;
  properties: Property[];
}

export interface SearchStats {
  total_titles: number;
  total_companies: number;
  freehold_count: number;
  leasehold_count: number;
}
