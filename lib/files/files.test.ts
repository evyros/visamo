import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { sniffType } from "./rules";
import { fileIdIn, filePath, thumbnailPath } from "./storage";
import { makeThumbnail } from "./thumbnail";

const CASE = "0b6f3a52-4c1e-4f7a-9d55-1f0a2b3c4d5e";
const FILE = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

/** A one-page PDF with a filled rectangle, written by hand. */
function tinyPdf() {
  const content = "0 0.5 0.5 rg 50 50 200 300 re f";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 400] /Contents 4 0 R >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  let body = "%PDF-1.4\n";
  const offsets = objects.map((object, i) => {
    const offset = body.length;
    body += `${i + 1} 0 obj\n${object}\nendobj\n`;
    return offset;
  });
  const xref = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  body += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(body);
}

describe("sniffType", () => {
  it("reads the type from the contents", async () => {
    const png = await sharp({ create: { width: 4, height: 4, channels: 3, background: "#fff" } })
      .png()
      .toBuffer();
    const jpeg = await sharp(png).jpeg().toBuffer();
    expect(sniffType(tinyPdf())).toBe("application/pdf");
    expect(sniffType(png)).toBe("image/png");
    expect(sniffType(jpeg)).toBe("image/jpeg");
  });

  it("rejects anything else, whatever the name says", () => {
    expect(sniffType(new TextEncoder().encode("<html>not a pdf</html>"))).toBeNull();
    expect(sniffType(new Uint8Array())).toBeNull();
  });
});

describe("storage paths", () => {
  it("puts a file and its thumbnail in the same folder, under its case", () => {
    expect(filePath(CASE, FILE)).toBe(`cases/${CASE}/files/${FILE}/original`);
    expect(thumbnailPath(CASE, FILE)).toBe(`cases/${CASE}/files/${FILE}/thumbnail`);
  });

  it("accepts only an original's path in the given case", () => {
    expect(fileIdIn(filePath(CASE, FILE), CASE)).toBe(FILE);
    expect(fileIdIn(filePath(CASE, FILE), "another-case")).toBeNull();
    expect(fileIdIn(thumbnailPath(CASE, FILE), CASE)).toBeNull();
    expect(fileIdIn(`cases/${CASE}/files/not-a-uuid/original`, CASE)).toBeNull();
    expect(fileIdIn(`cases/${CASE}/files/${FILE}/original/../../x`, CASE)).toBeNull();
  });
});

describe("makeThumbnail", () => {
  it("makes a small JPEG of a PDF's first page", async () => {
    const thumbnail = await makeThumbnail(tinyPdf(), "application/pdf");
    expect(thumbnail && sniffType(thumbnail)).toBe("image/jpeg");
    const { width, height } = await sharp(thumbnail!).metadata();
    expect(width).toBe(320);
    // The page's 3:4 shape is kept.
    expect(height).toBe(427);
    // The teal rectangle (0, 0.5, 0.5) stays teal: the page's colors aren't swapped.
    const { data } = await sharp(thumbnail!)
      .extract({ left: 160, top: 213, width: 1, height: 1 })
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect(data[0]).toBeLessThan(40);
    expect(data[1]).toBeGreaterThan(100);
    expect(data[2]).toBeGreaterThan(100);
  });

  it("shrinks a large photo, and never enlarges a small one", async () => {
    const big = await sharp({ create: { width: 3000, height: 4000, channels: 3, background: "#123" } })
      .jpeg()
      .toBuffer();
    const small = await sharp({ create: { width: 100, height: 80, channels: 3, background: "#123" } })
      .png()
      .toBuffer();
    expect((await sharp((await makeThumbnail(big, "image/jpeg"))!).metadata()).width).toBe(320);
    expect((await sharp((await makeThumbnail(small, "image/png"))!).metadata()).width).toBe(100);
  });

  it("gives null for a file it can't read, instead of failing the upload", async () => {
    const broken = new TextEncoder().encode("%PDF-1.4 this is not really a pdf");
    expect(await makeThumbnail(broken, "application/pdf")).toBeNull();
    expect(await makeThumbnail(new Uint8Array([0xff, 0xd8, 0xff, 0x00]), "image/jpeg")).toBeNull();
  });
});
