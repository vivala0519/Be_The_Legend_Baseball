import type { CollegeMark } from './college-marks';

const CC_BY_SA_4 = 'https://creativecommons.org/licenses/by-sa/4.0/';
const PD_TEXT_MARK = 'Public domain (Commons PD-textlogo); trademark rights may apply';
const PD_US_MARK = 'Public domain in the United States (Commons); trademark rights may apply';

export const COLLEGE_MARKS_AMERICAS: Record<string, CollegeMark> = {
  'college-us-vanderbilt': {
    src: '/college-marks/us-vanderbilt.webp',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Vanderbilt_Commodores_(2022)_logo.svg',
    originalUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Vanderbilt_Commodores_%282022%29_logo.svg',
    attribution: 'Vanderbilt University',
    license: PD_TEXT_MARK,
  },
  'college-us-lsu': {
    src: '/college-marks/us-lsu.webp',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:LSU_Athletics_logo.svg',
    originalUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/LSU_Athletics_logo.svg',
    attribution: 'Louisiana State University; SVG by Andrew c',
    license: PD_TEXT_MARK,
  },
  'college-us-florida': {
    src: '/college-marks/us-florida.webp',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Florida_Gators_alternate_logo.svg',
    originalUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Florida_Gators_alternate_logo.svg',
    attribution: 'Florida Gators',
    license: PD_TEXT_MARK,
  },
  'college-us-texas': {
    src: '/college-marks/us-texas.webp',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Texas_Longhorns_logo.svg',
    originalUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Texas_Longhorns_logo.svg',
    attribution: 'University of Texas at Austin Athletics',
    license: PD_US_MARK,
  },
  'college-us-stanford': {
    src: '/college-marks/us-stanford.webp',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Stanford_Cardinal_logo.svg',
    originalUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Stanford_Cardinal_logo.svg',
    attribution: 'Stanford University',
    license: PD_US_MARK,
  },
  'college-us-oregon-state': {
    src: '/college-marks/us-oregon-state.webp',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Oregon_State_text_logo.svg',
    originalUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Oregon_State_text_logo.svg',
    attribution: 'Oregon State University',
    license: PD_TEXT_MARK,
  },
  'college-do-uasd': {
    src: '/college-marks/do-uasd.webp',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Universidad_Autonoma_de_Santo_Domingo.svg',
    originalUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Universidad_Autonoma_de_Santo_Domingo.svg',
    attribution: 'Universidad Autónoma de Santo Domingo; resized and converted to WebP',
    license: 'CC BY-SA 4.0 (Commons)',
    licenseUrl: CC_BY_SA_4,
  },
  'college-do-unapec': {
    src: '/college-marks/do-unapec.webp',
    sourceUrl: 'https://unapec.edu.do/',
    originalUrl: 'https://unapec.edu.do/media/7567/logo.png',
    attribution: 'Universidad APEC',
  },
  'college-do-pucmm': {
    src: '/college-marks/do-pucmm.webp',
    sourceUrl: 'https://pucmm.edu.do/',
    originalUrl: 'https://pucmm.edu.do/wp-content/uploads/2026/07/pucmm-logo.svg',
    attribution: 'Pontificia Universidad Católica Madre y Maestra',
  },
  'college-do-utesa': {
    src: '/college-marks/do-utesa.webp',
    sourceUrl: 'https://www.utesa.edu/home/index.php',
    originalUrl: 'https://www.utesa.edu/home/img/logo2024.png',
    attribution: 'Universidad Tecnológica de Santiago',
  },
  'college-do-oym': {
    src: '/college-marks/do-oym.webp',
    sourceUrl: 'https://www.udoym.edu.do/',
    originalUrl: 'https://www.udoym.edu.do/wp-content/uploads/2020/10/logo_universidad.png',
    attribution: 'Universidad Dominicana O&M',
  },
  'college-ve-ucv': {
    src: '/college-marks/ve-ucv.webp',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Logo_Universidad_Central_de_Venezuela.svg',
    originalUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f4/Logo_Universidad_Central_de_Venezuela.svg',
    attribution: 'Universidad Central de Venezuela; Commons upload by Salvadoroff from Seeklogo; resized and converted to WebP',
    license: 'CC BY-SA 4.0 (Commons)',
    licenseUrl: CC_BY_SA_4,
  },
  'college-ve-unexpo': {
    src: '/college-marks/ve-unexpo.webp',
    sourceUrl: 'https://poz.unexpo.org/web/index.html',
    originalUrl: 'https://poz.unexpo.org/web/assets/images/stories/xheader.png',
    attribution: 'Universidad Nacional Experimental Politécnica Antonio José de Sucre',
  },
  'college-ve-ujgh': {
    src: '/college-marks/ve-ujgh.webp',
    sourceUrl: 'https://www.ujgh.edu.ve/sobre-ujgh/',
    originalUrl: 'https://www.ujgh.edu.ve/wp-content/uploads/2024/06/cropped-Favicon_UJGH-270x270.jpg',
    attribution: 'Universidad Dr. José Gregorio Hernández',
  },
  'college-ve-uc': {
    src: '/college-marks/ve-uc.webp',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:UC_logo.png',
    originalUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/UC_logo.png',
    attribution: 'Universidad de Carabobo; resized and converted to WebP',
    license: 'CC0 1.0 (Commons)',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
  },
};
