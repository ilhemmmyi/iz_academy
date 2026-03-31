import PDFDocument from 'pdfkit';

/**
 * Generate a certificate PDF buffer.
 * All text is handled with built-in Helvetica fonts so no font loading is required.
 */
export async function buildCertificatePdf(
  userName: string,
  courseName: string,
  tutorName: string,
  certId: string,
  issuedAt: Date,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width;
    const H = doc.page.height;

    // Background
    doc.rect(0, 0, W, H).fill('#0f172a');

    // Outer gold border
    doc.rect(22, 22, W - 44, H - 44).lineWidth(3).stroke('#f59e0b');
    doc.rect(30, 30, W - 60, H - 60).lineWidth(1).stroke('#fbbf24');

    // Corner ornament circles
    const corners: [number, number][] = [
      [34, 34], [W - 34, 34], [34, H - 34], [W - 34, H - 34],
    ];
    for (const [cx, cy] of corners) {
      doc.circle(cx, cy, 10).fillAndStroke('#0f172a', '#f59e0b');
    }

    // Academy name
    doc
      .fillColor('#f59e0b')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('IZ ACADEMY', 0, 60, { align: 'center', width: W, characterSpacing: 5 });

    // Title
    doc
      .fillColor('#ffffff')
      .fontSize(34)
      .font('Helvetica-Bold')
      .text('CERTIFICAT DE REUSSITE', 0, 88, { align: 'center', width: W });

    // Title underline
    doc
      .moveTo(W / 2 - 190, 138)
      .lineTo(W / 2 + 190, 138)
      .lineWidth(1)
      .stroke('#f59e0b');

    // Awarded to label
    doc
      .fillColor('#94a3b8')
      .fontSize(13)
      .font('Helvetica')
      .text('Ce certificat est decerne a', 0, 154, { align: 'center', width: W });

    // Student name
    doc
      .fillColor('#f59e0b')
      .fontSize(30)
      .font('Helvetica-Bold')
      .text(userName, 60, 180, { align: 'center', width: W - 120 });

    // Has completed label
    doc
      .fillColor('#94a3b8')
      .fontSize(13)
      .font('Helvetica')
      .text('pour avoir complete avec succes la formation', 0, 226, { align: 'center', width: W });

    // Course name
    doc
      .fillColor('#ffffff')
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(courseName, 80, 252, { align: 'center', width: W - 160 });

    // Section divider
    doc
      .moveTo(W / 2 - 190, 306)
      .lineTo(W / 2 + 190, 306)
      .lineWidth(1)
      .stroke('#1e293b');

    // Three-column info row
    const rowY = 322;
    const colW = 200;

    // Left: date
    doc.fillColor('#475569').fontSize(9).font('Helvetica')
       .text('DATE DE DELIVRANCE', 60, rowY, { width: colW, characterSpacing: 1 });
    const dateStr = issuedAt.toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    doc.fillColor('#e2e8f0').fontSize(12).font('Helvetica-Bold')
       .text(dateStr, 60, rowY + 14, { width: colW });

    // Center: tutor + signature line
    const centerX = W / 2 - 75;
    doc.fillColor('#475569').fontSize(9).font('Helvetica')
       .text('FORMATEUR', centerX, rowY, { width: 150, align: 'center', characterSpacing: 1 });
    doc.fillColor('#e2e8f0').fontSize(12).font('Helvetica-Bold')
       .text(tutorName, centerX, rowY + 14, { width: 150, align: 'center' });
    doc.moveTo(W / 2 - 55, rowY + 50)
       .lineTo(W / 2 + 55, rowY + 50)
       .lineWidth(1)
       .stroke('#f59e0b');
    doc.fillColor('#f59e0b').fontSize(9).font('Helvetica-Bold')
       .text('IZ Academy', W / 2 - 55, rowY + 55, { width: 110, align: 'center' });

    // Right: cert ID
    const rightX = W - 60 - colW;
    const shortId = certId.slice(-14).toUpperCase();
    doc.fillColor('#475569').fontSize(9).font('Helvetica')
       .text('ID DU CERTIFICAT', rightX, rowY, { width: colW, align: 'right', characterSpacing: 1 });
    doc.fillColor('#e2e8f0').fontSize(11).font('Helvetica-Bold')
       .text('#' + shortId, rightX, rowY + 14, { width: colW, align: 'right' });

    doc.end();
  });
}
