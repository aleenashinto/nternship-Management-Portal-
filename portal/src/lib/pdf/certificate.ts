import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const n = parseInt(clean.length === 6 ? clean : "4B3A9B", 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

export async function generateCertificatePdfBytes(params: {
  internName: string;
  programTitle: string;
  organisation: string;
  bodyText: string;
  startDate: Date;
  endDate: Date;
  issueDate: Date;
  certificateNumber: string;
  signatoryName: string;
  signatoryTitle: string;
  accentColor: string;
}): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([841.89, 595.28]); // Landscape A4
  const { width, height } = page.getSize();

  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontItalic = await pdf.embedFont(StandardFonts.HelveticaOblique);

  const brand = hexToRgb(params.accentColor || "#4B3A9B");
  const dark = rgb(0.12, 0.1, 0.18);
  const gray = rgb(0.4, 0.4, 0.48);

  // Outer decorative border
  page.drawRectangle({
    x: 28,
    y: 28,
    width: width - 56,
    height: height - 56,
    borderColor: brand,
    borderWidth: 3,
  });
  page.drawRectangle({
    x: 36,
    y: 36,
    width: width - 72,
    height: height - 72,
    borderColor: brand,
    borderWidth: 0.8,
  });

  const centerText = (text: string, y: number, size: number, font = fontRegular, color = dark) => {
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - w) / 2, y, size, font, color });
  };

  centerText(params.organisation.toUpperCase(), height - 105, 16, fontBold, brand);
  centerText("CERTIFICATE OF INTERNSHIP COMPLETION", height - 150, 26, fontBold, dark);
  centerText("This is proudly presented to", height - 205, 13, fontItalic, gray);

  centerText(params.internName, height - 255, 32, fontBold, brand);

  centerText(params.bodyText, height - 305, 14, fontRegular, dark);
  centerText(params.programTitle, height - 338, 20, fontBold, dark);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  centerText(
    `Internship Duration: ${fmt(params.startDate)} to ${fmt(params.endDate)}`,
    height - 378,
    12,
    fontRegular,
    gray,
  );

  // Footer: Certificate ID & Issue Date on left, Authorised Signatory on right
  page.drawText(`Certificate ID: ${params.certificateNumber}`, {
    x: 75,
    y: 95,
    size: 11,
    font: fontBold,
    color: dark,
  });
  page.drawText(`Issue Date: ${fmt(params.issueDate)}`, {
    x: 75,
    y: 78,
    size: 11,
    font: fontRegular,
    color: gray,
  });

  page.drawLine({
    start: { x: width - 275, y: 112 },
    end: { x: width - 75, y: 112 },
    thickness: 1,
    color: brand,
  });
  page.drawText(params.signatoryName, {
    x: width - 260,
    y: 94,
    size: 12,
    font: fontBold,
    color: dark,
  });
  page.drawText(params.signatoryTitle, {
    x: width - 260,
    y: 78,
    size: 10,
    font: fontRegular,
    color: gray,
  });

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}
