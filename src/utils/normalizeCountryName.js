// Helper function to normalize country names for matching (shared by GDP and Spending maps)
const nameMap = {
  'United States of America': 'United States',
  'United States': 'United States',
  'USA': 'United States',
  'Russia': 'Russian Federation',
  'Russian Federation': 'Russian Federation',
  'South Korea': 'Korea, Rep.',
  'Korea, Republic of': 'Korea, Rep.',
  'North Korea': 'Korea, Dem. People\'s Rep.',
  'Democratic People\'s Republic of Korea': 'Korea, Dem. People\'s Rep.',
  'Iran': 'Iran, Islamic Rep.',
  'Venezuela': 'Venezuela, RB',
  'Egypt': 'Egypt, Arab Rep.',
  'Yemen': 'Yemen, Rep.',
  'Syria': 'Syrian Arab Republic',
  'Laos': 'Lao PDR',
  'Vietnam': 'Viet Nam',
  'Congo': 'Congo, Rep.',
  'Democratic Republic of the Congo': 'Congo, Dem. Rep.',
  'Tanzania': 'Tanzania',
  'Macedonia': 'North Macedonia',
  'Czech Republic': 'Czechia',
  'Slovakia': 'Slovak Republic',
  'The Bahamas': 'Bahamas, The',
  'The Gambia': 'Gambia, The',
  'Ivory Coast': 'Cote d\'Ivoire',
  'Cape Verde': 'Cabo Verde',
  'Swaziland': 'Eswatini',
  'Myanmar': 'Myanmar',
  'Burma': 'Myanmar',
  'East Timor': 'Timor-Leste',
  'Timor-Leste': 'Timor-Leste',
  'Brunei': 'Brunei Darussalam',
  'Kyrgyzstan': 'Kyrgyz Republic',
  'Palestine': 'West Bank and Gaza',
  'West Bank and Gaza': 'West Bank and Gaza',
  'Turkey': 'Turkiye',
  'Türkiye': 'Turkiye'
};

export function normalizeCountryName(name) {
  return nameMap[name] || name;
}
