import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

export async function buildCertificatePdf(
  userName: string,
  courseName: string,
  tutorName: string,
  _certId: string,
  issuedAt: Date,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width;   // 841.89
    const H = doc.page.height;  // 595.28
    const cx = W / 2;

    const purple     = '#7c3aed';
    const darkIndigo = '#1e1b4b';
    const gray       = '#6b7280';
    const lightGray  = '#9ca3af';
    const dark       = '#374151';

    // ── White background ──────────────────────────────────────────────────
    doc.rect(0, 0, W, H).fill('#ffffff');

    // ── Corner triangle fills ─────────────────────────────────────────────
    const cs = 100;
    doc.path(`M 0 0 L ${cs} 0 L 0 ${cs} Z`).fill('rgba(124,58,237,0.06)');
    doc.path(`M 0 0 L ${cs * 0.6} 0 L 0 ${cs * 0.6} Z`).fill('rgba(124,58,237,0.09)');
    doc.path(`M ${W} 0 L ${W - cs} 0 L ${W} ${cs} Z`).fill('rgba(124,58,237,0.06)');
    doc.path(`M ${W} 0 L ${W - cs * 0.6} 0 L ${W} ${cs * 0.6} Z`).fill('rgba(124,58,237,0.09)');
    doc.path(`M 0 ${H} L ${cs} ${H} L 0 ${H - cs} Z`).fill('rgba(124,58,237,0.06)');
    doc.path(`M 0 ${H} L ${cs * 0.6} ${H} L 0 ${H - cs * 0.6} Z`).fill('rgba(124,58,237,0.09)');
    doc.path(`M ${W} ${H} L ${W - cs} ${H} L ${W} ${H - cs} Z`).fill('rgba(124,58,237,0.06)');
    doc.path(`M ${W} ${H} L ${W - cs * 0.6} ${H} L ${W} ${H - cs * 0.6} Z`).fill('rgba(124,58,237,0.09)');

    // ── Outer border ──────────────────────────────────────────────────────
    doc.rect(18, 18, W - 36, H - 36).lineWidth(2.5).stroke(purple);
    doc.rect(26, 26, W - 52, H - 52).lineWidth(0.7).stroke('rgba(124,58,237,0.28)');

    // ── Logo + "IZ Academy" — top left ───────────────────────────────────
    const logoPath = path.resolve(__dirname, '../../../frontend/public/iz-logo.png');
    const logoY = 38;
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 46, logoY, { height: 32 });
      doc.fillColor(purple).fontSize(14).font('Helvetica-Bold')
         .text('IZ Academy', 84, logoY + 8, { characterSpacing: 0.5 });
    } else {
      doc.fillColor(purple).fontSize(14).font('Helvetica-Bold')
         .text('IZ Academy', 46, logoY + 8, { characterSpacing: 0.5 });
    }

    // ── Platform label ────────────────────────────────────────────────────
    doc.fillColor(purple).fontSize(10).font('Helvetica-Bold')
       .text('PLATEFORME IZ ACADEMY', 0, 96, {
         align: 'center', width: W, characterSpacing: 4,
       });

    // ── Main title ────────────────────────────────────────────────────────
    doc.fillColor(darkIndigo).fontSize(32).font('Helvetica-Bold')
       .text('CERTIFICAT DE RÉUSSITE', 0, 120, {
         align: 'center', width: W, characterSpacing: 2,
       });

    // ── Divider with diamond ──────────────────────────────────────────────
    const divY = 168;
    const divHalf = 170;
    doc.moveTo(cx - divHalf, divY).lineTo(cx - 10, divY).lineWidth(1.2).stroke(purple);
    doc.moveTo(cx + 10, divY).lineTo(cx + divHalf, divY).lineWidth(1.2).stroke(purple);
    doc.save().translate(cx, divY).rotate(45).rect(-4.5, -4.5, 9, 9).fill(purple).restore();

    // ── "Ce certificat est décerné à" ─────────────────────────────────────
    doc.fillColor(gray).fontSize(13).font('Helvetica')
       .text('Ce certificat est décerné à', 0, 186, { align: 'center', width: W });

    // ── Recipient name ────────────────────────────────────────────────────
    doc.fillColor(purple).fontSize(36).font('Helvetica-Bold')
       .text(userName, 80, 212, { align: 'center', width: W - 160 });

    // ── "pour avoir complété..." ──────────────────────────────────────────
    doc.fillColor(gray).fontSize(13).font('Helvetica')
       .text('pour avoir complété avec succès la formation', 0, 264, { align: 'center', width: W });

    // ── Course name ───────────────────────────────────────────────────────
    doc.fillColor(darkIndigo).fontSize(19).font('Helvetica-Bold')
       .text(courseName, 120, 288, { align: 'center', width: W - 240 });

    // ── Footer separator ──────────────────────────────────────────────────
    const sepY = H - 118;
    doc.moveTo(56, sepY).lineTo(W - 56, sepY).lineWidth(0.8).stroke('rgba(124,58,237,0.22)');

    // ── Footer ────────────────────────────────────────────────────────────
    const footerY = sepY + 18;
    const colW = 220;

    const dateStr = issuedAt.toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });

    // Left — Date
    doc.fillColor(lightGray).fontSize(8).font('Helvetica')
       .text('DATE DE DÉLIVRANCE', 56, footerY, { width: colW, characterSpacing: 1.5 });
    doc.fillColor(dark).fontSize(13).font('Helvetica-Bold')
       .text(dateStr, 56, footerY + 16, { width: colW });

    // Right — Instructor signature
    const rightX = W - 56 - colW;
    doc.fillColor('#4c1d95').fontSize(16).font('Helvetica-Oblique')
       .text(tutorName, rightX, footerY, { width: colW, align: 'right' });
    doc.moveTo(rightX, footerY + 26)
       .lineTo(rightX + colW, footerY + 26)
       .lineWidth(1).stroke(purple);
    doc.fillColor(lightGray).fontSize(8).font('Helvetica')
       .text('FORMATEUR CERTIFIÉ', rightX, footerY + 32, {
         width: colW, align: 'right', characterSpacing: 1.5,
       });

    doc.end();
  });
}
