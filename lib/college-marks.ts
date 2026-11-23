import { COLLEGE_MARKS_AMERICAS } from "./college-marks-americas";
import { COLLEGE_MARKS_ASIA } from "./college-marks-asia";

export interface CollegeMark {
  src: string;
  sourceUrl: string;
  attribution?: string;
  originalUrl?: string;
  license?: string;
  licenseUrl?: string;
}

export function getCollegeMark(affiliationId: string): CollegeMark | undefined {
  return COLLEGE_MARKS_ASIA[affiliationId] ?? COLLEGE_MARKS_AMERICAS[affiliationId];
}
