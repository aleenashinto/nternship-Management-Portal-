// Client-side official PDF Certificate Generator
// Builds a real, valid, printable Landscape A4 PDF using the Admin-configured Certificate Template
// and triggers an immediate file download (`Certificate_<certNumber>.pdf`).

function escPdf(str) {
  return String(str || '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, ' ');
}

function hexToRgb01(hex) {
  const clean = String(hex || '#4B3A9B').replace('#', '');
  const num = parseInt(clean.length === 6 ? clean : '4B3A9B', 16);
  const r = (((num >> 16) & 255) / 255).toFixed(3);
  const g = (((num >> 8) & 255) / 255).toFixed(3);
  const b = ((num & 255) / 255).toFixed(3);
  return `${r} ${g} ${b}`;
}

export function downloadCertificatePdf(cert) {
  // If a real backend PDF URL is present (not '#' or mock), open it
  if (
    cert?.certificate_file &&
    cert.certificate_file !== '#' &&
    !cert.certificate_file.startsWith('mock') &&
    cert.certificate_file.endsWith('.pdf') &&
    cert.certificate_file.startsWith('http')
  ) {
    window.open(cert.certificate_file, '_blank', 'noopener,noreferrer');
    return;
  }

  let tpl = {
    organisation: 'Beat Education',
    programTitle: 'Data Analytics & Software Engineering Internship Program',
    bodyText: 'has successfully completed all required projects, evaluations, and milestones of the',
    signatoryName: 'Sarah Connor',
    signatoryTitle: 'HR Director & Authorised Signatory',
    accentColor: '#4B3A9B',
  };
  try {
    const saved = localStorage.getItem('portal_mock_cert_template');
    if (saved) tpl = { ...tpl, ...JSON.parse(saved) };
  } catch {
    // use default template
  }

  const internName = cert?.intern_name || 'Emma Watson';
  const certNumber = cert?.certificate_number || 'CERT-BEAT-VERIFIED';
  const issueDate = cert?.approval_date
    ? new Date(cert.approval_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const reqDate = cert?.request_date
    ? new Date(cert.request_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : issueDate;
  const approver = cert?.approved_by_name || tpl.signatoryName;
  const completedCount = cert?.completed_projects_count ?? 1;

  const brandRgb = hexToRgb01(tpl.accentColor);
  const W = 842;
  const H = 595;

  const centerX = (text, fontSize) => Math.max(60, Math.round((W - String(text).length * fontSize * 0.52) / 2));

  const streamLines = [
    // Outer decorative brand border
    `${brandRgb} RG`,
    '4 w',
    `28 28 ${W - 56} ${H - 56} re S`,
    '1 w',
    `36 36 ${W - 72} ${H - 72} re S`,

    // Top Header Banner
    `${brandRgb} rg`,
    `36 ${H - 96} ${W - 72} 60 re f`,

    // Organisation Title in white inside banner
    'BT',
    '/F2 20 Tf',
    '1 1 1 rg',
    `${centerX(tpl.organisation.toUpperCase(), 20)} ${H - 73} Td`,
    `(${escPdf(tpl.organisation.toUpperCase())}) Tj`,
    'ET',

    // Main Certificate Heading
    'BT',
    '/F2 28 Tf',
    '0.12 0.11 0.18 rg',
    `${centerX('CERTIFICATE OF INTERNSHIP COMPLETION', 28)} ${H - 155} Td`,
    '(CERTIFICATE OF INTERNSHIP COMPLETION) Tj',
    'ET',

    // Subtitle
    'BT',
    '/F3 14 Tf',
    '0.4 0.4 0.48 rg',
    `${centerX('This official certificate is proudly presented to', 14)} ${H - 195} Td`,
    '(This official certificate is proudly presented to) Tj',
    'ET',

    // Intern Full Name
    'BT',
    '/F2 32 Tf',
    `${brandRgb} rg`,
    `${centerX(internName.toUpperCase(), 32)} ${H - 245} Td`,
    `(${escPdf(internName.toUpperCase())}) Tj`,
    'ET',

    // Decorative underline under intern name
    `${brandRgb} RG`,
    '1.5 w',
    `220 ${H - 258} m ${W - 220} ${H - 258} l S`,

    // Body text
    'BT',
    '/F1 13 Tf',
    '0.2 0.2 0.26 rg',
    `${centerX(tpl.bodyText, 13)} ${H - 295} Td`,
    `(${escPdf(tpl.bodyText)}) Tj`,
    'ET',

    // Program Title
    'BT',
    '/F2 18 Tf',
    '0.12 0.11 0.18 rg',
    `${centerX(tpl.programTitle, 18)} ${H - 328} Td`,
    `(${escPdf(tpl.programTitle)}) Tj`,
    'ET',

    // Verified Projects & Dates Summary
    'BT',
    '/F1 12 Tf',
    '0.35 0.35 0.42 rg',
    `${centerX(`Verified Completed Projects: ${completedCount}   |   Completion Date: ${reqDate}`, 12)} ${H - 365} Td`,
    `(${escPdf(`Verified Completed Projects: ${completedCount}   |   Completion Date: ${reqDate}`)}) Tj`,
    'ET',

    // Left Footer: Certificate ID & Issue Date
    'BT',
    '/F2 11 Tf',
    '0.12 0.11 0.18 rg',
    `75 105 Td (${escPdf(`Certificate ID: ${certNumber}`)}) Tj`,
    'ET',
    'BT',
    '/F1 10 Tf',
    '0.4 0.4 0.48 rg',
    `75 88 Td (${escPdf(`Issue Date: ${issueDate}`)}) Tj`,
    'ET',
    'BT',
    '/F3 9 Tf',
    '0.45 0.45 0.52 rg',
    '75 72 Td (Verified by Beat Internship Management Portal) Tj',
    'ET',

    // Right Footer: Signature Line & Authorised Signatory
    `${brandRgb} RG`,
    '1.2 w',
    `${W - 280} 118 m ${W - 75} 118 l S`,
    'BT',
    '/F2 12 Tf',
    '0.12 0.11 0.18 rg',
    `${W - 270} 100 Td (${escPdf(approver)}) Tj`,
    'ET',
    'BT',
    '/F1 10 Tf',
    '0.4 0.4 0.48 rg',
    `${W - 270} 84 Td (${escPdf(tpl.signatoryTitle)}) Tj`,
    'ET',
  ].join('\n');

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> >> /Contents 7 0 R >>\nendobj\n`,
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
    '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>\nendobj\n',
    `7 0 obj\n<< /Length ${streamLines.length} >>\nstream\n${streamLines}\nendstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Certificate_${certNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
