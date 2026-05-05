export interface Country {
  name: string;
  code: string; // ISO 3166-1 alpha-2
}

export const COUNTRIES: Country[] = [
  { name: "Afghanistan", code: "AF" }, { name: "Argentina", code: "AR" },
  { name: "Australia", code: "AU" }, { name: "Austria", code: "AT" },
  { name: "Bangladesh", code: "BD" }, { name: "Belgium", code: "BE" },
  { name: "Brazil", code: "BR" }, { name: "Canada", code: "CA" },
  { name: "Chile", code: "CL" }, { name: "China", code: "CN" },
  { name: "Colombia", code: "CO" }, { name: "Czech Republic", code: "CZ" },
  { name: "Denmark", code: "DK" }, { name: "Egypt", code: "EG" },
  { name: "Ethiopia", code: "ET" }, { name: "Finland", code: "FI" },
  { name: "France", code: "FR" }, { name: "Germany", code: "DE" },
  { name: "Ghana", code: "GH" }, { name: "Greece", code: "GR" },
  { name: "Hungary", code: "HU" }, { name: "India", code: "IN" },
  { name: "Indonesia", code: "ID" }, { name: "Iran", code: "IR" },
  { name: "Iraq", code: "IQ" }, { name: "Ireland", code: "IE" },
  { name: "Israel", code: "IL" }, { name: "Italy", code: "IT" },
  { name: "Japan", code: "JP" }, { name: "Jordan", code: "JO" },
  { name: "Kenya", code: "KE" }, { name: "Malaysia", code: "MY" },
  { name: "Mexico", code: "MX" }, { name: "Morocco", code: "MA" },
  { name: "Netherlands", code: "NL" }, { name: "New Zealand", code: "NZ" },
  { name: "Nigeria", code: "NG" }, { name: "Norway", code: "NO" },
  { name: "Pakistan", code: "PK" }, { name: "Peru", code: "PE" },
  { name: "Philippines", code: "PH" }, { name: "Poland", code: "PL" },
  { name: "Portugal", code: "PT" }, { name: "Romania", code: "RO" },
  { name: "Russia", code: "RU" }, { name: "Saudi Arabia", code: "SA" },
  { name: "Singapore", code: "SG" }, { name: "South Africa", code: "ZA" },
  { name: "South Korea", code: "KR" }, { name: "Spain", code: "ES" },
  { name: "Sweden", code: "SE" }, { name: "Switzerland", code: "CH" },
  { name: "Taiwan", code: "TW" }, { name: "Thailand", code: "TH" },
  { name: "Turkey", code: "TR" }, { name: "Ukraine", code: "UA" },
  { name: "United Arab Emirates", code: "AE" },
  { name: "United Kingdom", code: "GB" },
  { name: "United States", code: "US" },
  { name: "Venezuela", code: "VE" }, { name: "Vietnam", code: "VN" },
];

export function countryCode(name: string | null | undefined): string | null {
  if (!name) return null;
  return COUNTRIES.find((c) => c.name.toLowerCase() === name.toLowerCase())?.code ?? null;
}
