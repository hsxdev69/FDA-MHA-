export interface DistrictInfo {
  name: string;
  lat: number;
  lng: number;
}

export const MAHARASHTRA_DISTRICTS: DistrictInfo[] = [
  { name: "Mumbai", lat: 19.076, lng: 72.8777 },
  { name: "Thane", lat: 19.2183, lng: 72.9781 },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
  { name: "Nashik", lat: 19.9975, lng: 73.7898 },
  { name: "Nagpur", lat: 21.1458, lng: 79.0882 },
  { name: "Chhatrapati Sambhajinagar", lat: 19.8762, lng: 75.3433 },
  { name: "Kolhapur", lat: 16.705, lng: 74.2433 },
  { name: "Solapur", lat: 17.6599, lng: 75.9064 },
  { name: "Amravati", lat: 20.9374, lng: 77.7796 },
  { name: "Satara", lat: 17.6805, lng: 74.0183 },
  { name: "Ahmednagar", lat: 19.0952, lng: 74.7496 },
  { name: "Sangli", lat: 16.8524, lng: 74.5815 },
  { name: "Raigad", lat: 18.5158, lng: 73.1822 },
  { name: "Jalgaon", lat: 21.0077, lng: 75.5626 },
  { name: "Nanded", lat: 19.1383, lng: 77.321 },
];

export const DEFAULT_OFFICERS = [
  { username: "fdaofficer", fullName: "CVO (HQ)", department: "State Vigilance HQ" },
  { username: "shinde.pune", fullName: "Officer Shinde", department: "Pune Division" },
  { username: "patil.mumbai", fullName: "Officer Patil", department: "Mumbai Division" },
  { username: "deshmukh.nagpur", fullName: "Officer Deshmukh", department: "Nagpur Division" },
  { username: "jadhav.nashik", fullName: "Officer Jadhav", department: "Nashik Division" },
];

export function inferDistrict(location: string, explicit?: string | null): string {
  if (explicit && explicit.trim()) return explicit.trim();
  const loc = (location || "").toLowerCase();
  for (const d of MAHARASHTRA_DISTRICTS) {
    if (loc.includes(d.name.toLowerCase())) return d.name;
  }
  if (loc.includes("aurangabad") || loc.includes("sambhajinagar")) {
    return "Chhatrapati Sambhajinagar";
  }
  return "Pune";
}

export function districtCoords(name: string): DistrictInfo {
  const found = MAHARASHTRA_DISTRICTS.find(
    (d) => d.name.toLowerCase() === name.toLowerCase(),
  );
  return found ?? { name, lat: 18.5204, lng: 73.8567 };
}
