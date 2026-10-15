// bidi-js ships no types. Only what lib/letters/pdf.ts uses.
declare module "bidi-js" {
  type EmbeddingLevels = {
    levels: Uint8Array;
    paragraphs: { start: number; end: number; level: number }[];
  };
  type Bidi = {
    getEmbeddingLevels(text: string, direction?: "ltr" | "rtl" | "auto"): EmbeddingLevels;
    getReorderedString(text: string, levels: EmbeddingLevels, start?: number, end?: number): string;
  };
  export default function bidiFactory(): Bidi;
}
