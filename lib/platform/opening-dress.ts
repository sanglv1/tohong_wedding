import { templateById, type CatalogId } from './templates'

export type OpeningPace = 'cham' | 'vua' | 'nhanh'
export type PetalShape = 'giot' | 'tron' | 'la'

export type OpeningDress = {
  seal: string
  sealDeep: string
  heart: string
  petal: string
  flash: string
  pace: OpeningPace
  petalShape: PetalShape
}

/** Cùng một cách mở, mỗi mẫu một màu giấy và một nhịp. */
const DRESS: Record<CatalogId, OpeningDress> = {
  'trang-dat': dress('#e8c88a', '#b8860b', '#5a1018', '#e8c88a', '#fff6e4', 'vua', 'giot'),
  'sang-nhung': dress('#f0d5c8', '#c9a27a', '#8d4d5c', '#f3c9cf', '#fff8f3', 'cham', 'giot'),
  'hong-dao': dress('#e7a3b5', '#c45b78', '#4a1520', '#e7a3b5', '#fff1f4', 'vua', 'giot'),
  'dat-nung': dress('#c45c3e', '#8a3b28', '#f8f1e7', '#e7b199', '#fff4ec', 'cham', 'giot'),
  'song-hy': dress('#c4364a', '#8d1b30', '#f8f1e7', '#f0a8b0', '#fff1f2', 'vua', 'giot'),
  'thu-tay': dress('#a56b32', '#6b4318', '#f8f1e7', '#e6c79a', '#f8f1e4', 'cham', 'la'),
  'man-chin': dress('#8a4564', '#5c2a42', '#f8f1e7', '#d7a3b8', '#fdf6f8', 'vua', 'giot'),
  'gam-do': dress('#6a1020', '#3d0a14', '#f6d5d0', '#c47a88', '#f8e8ea', 'cham', 'giot'),
  'sen-trang': dress('#8fbfae', '#3d6b5a', '#f4faf7', '#c5e0d4', '#f4faf7', 'cham', 'tron'),
  'bien-cat': dress('#7eb8c9', '#3d7d90', '#f7fcfd', '#b7dce6', '#f3fbfd', 'vua', 'tron'),
  'vuon-hong': dress('#c45b78', '#8a304c', '#fffafb', '#d46a8c', '#fff0f4', 'vua', 'giot'),
  'dao-tien': dress('#d4846a', '#8f4e32', '#fffaf7', '#e7a07a', '#fff6f0', 'cham', 'giot'),
  'hoa-nhai': dress('#d9c4b0', '#8a7460', '#3a3428', '#cbbba6', '#fffdf8', 'nhanh', 'la'),
  'song-biec': dress('#2f7f93', '#1a4e5c', '#f8fcfd', '#1f6d80', '#e7f5f8', 'cham', 'la'),
  'rung-xanh': dress('#3d6a4a', '#244833', '#f4faf6', '#8fbf9a', '#f3f8f4', 'vua', 'la'),
  'dem-vang': dress('#c9a36a', '#8a7040', '#1a1610', '#e8c88a', '#f8efd8', 'cham', 'giot'),
  'son-vang': dress('#c4a15a', '#8a7040', '#3a2a12', '#e6d3a1', '#fff8e8', 'vua', 'giot'),
  'nha-tho': dress('#cfc3a4', '#a89878', '#3a3428', '#e4dcc8', '#fffdf8', 'cham', 'la'),
  'la-oliu': dress('#6d7c45', '#3f4c22', '#fbfcf7', '#b7c48a', '#f7f8f1', 'vua', 'la'),
  'hoang-hon': dress('#c45c3e', '#8f5b22', '#fffaf6', '#e0a07a', '#fff3e8', 'nhanh', 'giot'),
  'tre-truc': dress('#2a7560', '#1a4a3c', '#f4faf7', '#8fbfae', '#f2faf7', 'nhanh', 'la'),
  'sang-trang': dress('#e7e0d4', '#cfc4b4', '#3a342c', '#e7e0d4', '#fffaf3', 'vua', 'la'),
  'anh-sang': dress('#d9c4b0', '#8a7060', '#2a211c', '#d9c4b0', '#fffef8', 'nhanh', 'giot'),
  'giay-do': dress('#e4d7c0', '#b7a48a', '#3a3428', '#e4d7c0', '#f6f0e4', 'cham', 'la'),
  'kinh-mo': dress('#9bb4cc', '#3d6488', '#f7fbff', '#c5d6e6', '#eef4fb', 'nhanh', 'tron'),
  'no-lua': dress('#e7a3b5', '#a53d5f', '#fffafb', '#f2c9d3', '#fff0f4', 'vua', 'giot'),
  'muc-nhat': dress('#8b98a8', '#5c6b7e', '#fbfcfd', '#c5ced6', '#eef1f4', 'cham', 'la'),
  'ban-mai': dress('#e6d7b8', '#b89a62', '#3a2e18', '#f0e2bc', '#fff6df', 'vua', 'giot'),
  'net-han': dress('#b7c0cb', '#6d7b8a', '#1c2430', '#d5dbe2', '#f4f7fa', 'nhanh', 'la'),
  'suong-som': dress('#c5cad8', '#8b90a8', '#2a2e3a', '#e4e6f0', '#f7f8fc', 'cham', 'tron'),
  'muc-tau': dress('#8b1e1e', '#5c1014', '#f7f1e4', '#c45c4c', '#f8efe4', 'cham', 'la'),
  'dem-sao': dress('#9bb0d4', '#3d4f7a', '#070b16', '#d6e2ff', '#eef3ff', 'cham', 'tron'),
  'san-khau': dress('#e8c56b', '#8a3048', '#14080e', '#f6e27a', '#fff6d8', 'nhanh', 'giot'),
  'gach-bong': dress('#c45c3e', '#6a2e24', '#f4f1ea', '#e7b199', '#fff4ec', 'vua', 'tron'),
  'cung-dinh': dress('#e6c36a', '#8a1824', '#f6e7c1', '#e6c36a', '#fff6df', 'cham', 'giot'),
  'song-nhe': dress('#0e7490', '#0c3d4c', '#f4fbfd', '#7ec8d6', '#e7f6f8', 'vua', 'la'),
  'den-long': dress('#e8a040', '#8a4e12', '#0c1410', '#f0c27a', '#fff3d8', 'nhanh', 'giot'),
  'bao-xuan': dress('#9a3412', '#5c2410', '#f4efe6', '#e7c4a8', '#fff8ef', 'nhanh', 'la'),
  'so-tay': dress('#1d4e89', '#163a66', '#f7f1e4', '#9bb7d4', '#f4f8fc', 'cham', 'la'),
  'kinh-manh': dress('#44403c', '#292524', '#f4f2ef', '#d6d3d1', '#fafaf9', 'vua', 'tron'),
}

function dress(
  seal: string,
  sealDeep: string,
  heart: string,
  petal: string,
  flash: string,
  pace: OpeningPace,
  petalShape: PetalShape,
): OpeningDress {
  return { seal, sealDeep, heart, petal, flash, pace, petalShape }
}

export function openingDress(templateId: string): OpeningDress {
  return DRESS[templateById(templateId).id]
}

export const PACE_SCALE: Record<OpeningPace, number> = {
  cham: 1.9,
  vua: 1,
  nhanh: 0.75,
}
