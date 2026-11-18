export type Mode = "ai" | "local";

export type Position = "GK" | "CB" | "LB" | "RB" | "CDM" | "CM" | "CAM" | "LW" | "RW" | "ST";

export type Broad = "GK" | "DF" | "MF" | "FW";

export interface Attributes {
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
}

export interface Player {
  id: string;
  name: string;
  nation: string; // 3 harfli ülke kodu
  club: string;
  league: string;
  position: Position;
  broad: Broad;
  age: number;
  ovr: number;
  attrs: Attributes;
  value: number; // milyon ₺
  photo: string | null; // yerel fotoğraf yolu (varsa)
  auto?: boolean; // kategori zorunluluğu için otomatik eklenen oyuncu
}

// Ham veri satırı: [isim, ülke, kulüp, mevki, yaş, overall]
export type PlayerRow = [string, string, string, Position, number, number];
