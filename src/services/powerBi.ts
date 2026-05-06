export const POWER_BI_BASE_URL =
  'https://app.powerbi.com/view?r=eyJrIjoiYThhZjFjNDktNmQxNi00YTA0LWJhZTktOTY5ODQwODA4MzdhIiwidCI6ImI1YWYyNDUxLWUyMWItNGFhMi1iNGI1LWRjNTkwNzkwOGRkOCJ9';

export const POWER_BI_PAGES = {
  analytics: 'Executive Summary (PC)',
  stales: {
    stales: 'Stales',
    recommendation: 'Recommendation',
    projectedRisk: 'Projected Risk',
  },
  damages: {
    causal: 'Damages - Causal',
    recommendation: 'Damages - Recommendation',
  },
} as const;

export const getPowerBiUrl = (pageName: string) =>
  `${POWER_BI_BASE_URL}&pageName=${encodeURIComponent(pageName)}`;
