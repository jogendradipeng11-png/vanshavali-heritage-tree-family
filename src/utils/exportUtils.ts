import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { MemberNode, RelationshipLink } from '../types';
import { getRelativeSummary } from './treeUtils';
import { CARD_WIDTH, CARD_HEIGHT } from '../initialData';

export function exportFullRegisterPDF(nodes: MemberNode[], links: RelationshipLink[]) {
  const doc = new jsPDF('landscape');

  // Title & Header
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text('Vanshavali Family Heritage Register', 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleDateString()} | Total Members: ${nodes.length}`, 14, 25);

  const tableData = nodes.map(n => {
    const rels = getRelativeSummary(n.id, nodes, links);
    return [
      n.name,
      n.relationship_to_root,
      n.branch === 'maternal' ? "Wife's Side" : 'Main Line',
      n.marital_status === 'married' ? 'Married' : 'Single',
      n.status === 'deceased' ? 'Deceased' : 'Living',
      n.gotra || '-',
      n.bansa || '-',
      n.age ? `${n.age} yrs` : (n.dob || '-'),
      n.profession || '-',
      `${n.phone ? n.phone + ' | ' : ''}${n.address || '-'}`,
      `Parents: ${rels.parentNames}\nSpouse: ${rels.spouseNames}\nChildren: ${rels.childrenNames}`
    ];
  });

  autoTable(doc, {
    startY: 30,
    head: [['Full Name', 'Rel. to Root', 'Branch', 'Marital', 'Status', 'Gotra', 'Bansa', 'Age / DOB', 'Profession', 'Contact & Address', 'Heritage Links']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 3 },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  doc.save(`Vanshavali_Heritage_Register_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportSinglePersonPDF(node: MemberNode, nodes: MemberNode[], links: RelationshipLink[]) {
  const doc = new jsPDF();
  const rels = getRelativeSummary(node.id, nodes, links);
  const isDeceased = node.status === 'deceased';

  doc.setFontSize(20);
  doc.setTextColor(30, 41, 59);
  doc.text('Family Heritage Certificate & Dossier', 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Official Lineage Record | Generated ${new Date().toLocaleDateString()}`, 14, 29);

  const personData = [
    ['Full Name', node.name],
    ['Relationship to Root', node.relationship_to_root],
    ['Lineage Branch', node.branch === 'maternal' ? "Wife's / In-Law Lineage" : 'Main / Husband Lineage'],
    ['Marital Status', node.marital_status === 'married' ? 'Married' : 'Unmarried (Single)'],
    ['Living Status', isDeceased ? 'Deceased' : 'Living'],
    ['Gotra', node.gotra || '-'],
    ['Bansa', node.bansa || '-'],
    ['Date of Birth', node.dob || '-'],
    ['Date of Passing', node.dod || (isDeceased ? 'Date Unknown' : 'N/A')],
    ['Age', node.age ? `${node.age} Years ${isDeceased ? '(At passing)' : ''}` : '-'],
    ['Profession', node.profession || '-'],
    ['Phone Number', node.phone || '-'],
    ['Address / Residence', node.address || '-'],
    ['Notes / Lore', node.notes || '-'],
    ['Parents (Prior Gen)', rels.parentNames],
    ['Spouse(s)', rels.spouseNames],
    ['Siblings / In-Laws', rels.siblingNames],
    ['Children (Next Gen)', rels.childrenNames]
  ];

  autoTable(doc, {
    startY: 36,
    head: [['Heritage Attribute', 'Record Details']],
    body: personData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229], fontSize: 10 },
    bodyStyles: { fontSize: 9, cellPadding: 3.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 }
    }
  });

  doc.save(`${node.name.replace(/\s+/g, '_')}_Heritage_Dossier.pdf`);
}

export function exportToExcel(nodes: MemberNode[], links: RelationshipLink[]) {
  const rows = nodes.map(n => {
    const rels = getRelativeSummary(n.id, nodes, links);
    return {
      'Full Name': n.name,
      'Relationship to Root': n.relationship_to_root,
      'Branch': n.branch === 'maternal' ? "Wife's Lineage" : 'Main Lineage',
      'Gender': n.gender,
      'Marital Status': n.marital_status === 'married' ? 'Married' : 'Single',
      'Living Status': n.status,
      'Gotra': n.gotra || '',
      'Bansa': n.bansa || '',
      'Age': n.age || '',
      'Date of Birth': n.dob || '',
      'Date of Passing': n.dod || '',
      'Profession': n.profession || '',
      'Phone': n.phone || '',
      'Address': n.address || '',
      'Notes': n.notes || '',
      'Parents': rels.parentNames,
      'Spouses': rels.spouseNames,
      'Siblings': rels.siblingNames,
      'Children': rels.childrenNames
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Heritage Lineage');
  XLSX.writeFile(wb, `Vanshavali_Tree_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportToWord(nodes: MemberNode[], links: RelationshipLink[]) {
  const rowsHtml = nodes.map(n => {
    const rels = getRelativeSummary(n.id, nodes, links);
    return `
      <tr>
        <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">${n.name}</td>
        <td style="border:1px solid #cbd5e1; padding:6px;">${n.relationship_to_root}</td>
        <td style="border:1px solid #cbd5e1; padding:6px;">${n.branch === 'maternal' ? "Wife's Side" : 'Main Side'}</td>
        <td style="border:1px solid #cbd5e1; padding:6px;">${n.marital_status === 'married' ? 'Married' : 'Single'}</td>
        <td style="border:1px solid #cbd5e1; padding:6px;">${n.status}</td>
        <td style="border:1px solid #cbd5e1; padding:6px;">${n.gotra || '-'}</td>
        <td style="border:1px solid #cbd5e1; padding:6px;">${n.bansa || '-'}</td>
        <td style="border:1px solid #cbd5e1; padding:6px;">${n.age || '-'}</td>
        <td style="border:1px solid #cbd5e1; padding:6px;">${n.profession || '-'}</td>
        <td style="border:1px solid #cbd5e1; padding:6px;">${n.phone || ''} ${n.address || ''}</td>
        <td style="border:1px solid #cbd5e1; padding:6px;">Parents: ${rels.parentNames} | Spouses: ${rels.spouseNames} | Children: ${rels.childrenNames}</td>
      </tr>
    `;
  }).join('');

  const docHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><title>Heritage Register</title></head>
    <body style="font-family: Arial, sans-serif;">
      <h2>Vanshavali Family Heritage Register</h2>
      <p>Generated: ${new Date().toLocaleDateString()}</p>
      <table style="width:100%; border-collapse:collapse; text-align:left; font-size:11px;">
        <thead>
          <tr style="background:#4f46e5; color:white;">
            <th style="padding:6px; border:1px solid #cbd5e1;">Name</th>
            <th style="padding:6px; border:1px solid #cbd5e1;">Relation</th>
            <th style="padding:6px; border:1px solid #cbd5e1;">Branch</th>
            <th style="padding:6px; border:1px solid #cbd5e1;">Marital</th>
            <th style="padding:6px; border:1px solid #cbd5e1;">Status</th>
            <th style="padding:6px; border:1px solid #cbd5e1;">Gotra</th>
            <th style="padding:6px; border:1px solid #cbd5e1;">Bansa</th>
            <th style="padding:6px; border:1px solid #cbd5e1;">Age</th>
            <th style="padding:6px; border:1px solid #cbd5e1;">Profession</th>
            <th style="padding:6px; border:1px solid #cbd5e1;">Contact & Address</th>
            <th style="padding:6px; border:1px solid #cbd5e1;">Heritage Connections</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + docHtml], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Vanshavali_Tree_${new Date().toISOString().slice(0, 10)}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Prints the visual tree canvas architecture "AS IT IS"
 * Renders all member cards at their exact spatial coordinates with SVG connections
 */
export function printVisualTreeArchitecture(
  nodes: MemberNode[],
  links: RelationshipLink[],
  title: string = 'Vanshavali Family Heritage Tree',
  subtitle?: string
) {
  if (nodes.length === 0) return;

  const CARD_W = CARD_WIDTH; // 240
  const CARD_H = CARD_HEIGHT; // 185

  const minX = Math.min(...nodes.map(n => n.x));
  const maxX = Math.max(...nodes.map(n => n.x + CARD_W));
  const minY = Math.min(...nodes.map(n => n.y));
  const maxY = Math.max(...nodes.map(n => n.y + CARD_H));

  const padX = 60;
  const padY = 60;
  const offsetX = -minX + padX;
  const offsetY = -minY + padY;
  const totalW = Math.max(1000, (maxX - minX) + padX * 2);
  const totalH = Math.max(700, (maxY - minY) + padY * 2);

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Build SVG Connections
  const svgElements: string[] = [];

  links.forEach(link => {
    const s = nodeMap.get(link.source);
    const t = nodeMap.get(link.target);
    if (!s || !t) return;

    if (link.type === 'parent') {
      const x1 = s.x + CARD_W / 2 + offsetX;
      const y1 = s.y + CARD_H + offsetY;
      const x2 = t.x + CARD_W / 2 + offsetX;
      const y2 = t.y + offsetY;
      const midY = (y1 + y2) / 2;
      svgElements.push(
        `<path d="M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}" stroke="#6366f1" stroke-width="2.5" fill="none" marker-end="url(#print-arrow)" />`
      );
    } else if (link.type === 'spouse') {
      const x1 = Math.min(s.x, t.x) + CARD_W + offsetX;
      const x2 = Math.max(s.x, t.x) + offsetX;
      const y = s.y + CARD_H / 2 + offsetY;
      svgElements.push(
        `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#e11d48" stroke-width="3" stroke-dasharray="6,4" />`
      );
      svgElements.push(
        `<circle cx="${(x1 + x2) / 2}" cy="${y}" r="8" fill="#e11d48" />`
      );
      svgElements.push(
        `<text x="${(x1 + x2) / 2}" y="${y + 3}" text-anchor="middle" font-size="8" fill="white" font-weight="bold">♥</text>`
      );
    } else if (link.type === 'sibling') {
      const x1 = Math.min(s.x, t.x) + CARD_W + offsetX;
      const x2 = Math.max(s.x, t.x) + offsetX;
      const y = s.y + CARD_H / 2 + 16 + offsetY;
      svgElements.push(
        `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#0284c7" stroke-width="2.5" stroke-dasharray="5,4" />`
      );
    }
  });

  // Build Member Cards
  const cardsHtml = nodes.map(node => {
    const isMaternal = node.branch === 'maternal';
    const isDeceased = node.status === 'deceased';
    const left = node.x + offsetX;
    const top = node.y + offsetY;
    const borderColor = isMaternal ? '#f59e0b' : '#6366f1';
    const branchBadgeBg = isMaternal ? '#fef3c7' : '#e0e7ff';
    const branchBadgeColor = isMaternal ? '#92400e' : '#3730a3';
    const branchName = isMaternal ? "Wife's Side" : 'Main Line';
    const statusBg = isDeceased ? '#f1f5f9' : '#ecfdf5';
    const statusColor = isDeceased ? '#475569' : '#065f46';
    const statusText = isDeceased ? '🕊️ Deceased' : '🌱 Living';

    return `
      <div style="
        position: absolute;
        left: ${left}px;
        top: ${top}px;
        width: ${CARD_W}px;
        height: ${CARD_H}px;
        background: #ffffff;
        border: 2px solid ${borderColor};
        border-radius: 12px;
        padding: 10px;
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        box-shadow: 0 2px 5px rgba(0,0,0,0.06);
        page-break-inside: avoid;
      ">
        <div>
          <!-- Badges -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="background: ${branchBadgeBg}; color: ${branchBadgeColor}; font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 9999px; text-transform: uppercase;">
              ${branchName}
            </span>
            <span style="background: ${statusBg}; color: ${statusColor}; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(0,0,0,0.08);">
              ${statusText}
            </span>
          </div>

          <!-- Name & Relation -->
          <div style="font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; line-height: 1.25; margin-bottom: 2px; ${isDeceased ? 'text-decoration: line-through;' : ''}">
            ${node.name}
          </div>
          <div style="font-size: 10px; font-weight: 700; color: #4f46e5; margin-bottom: 6px;">
            ${node.relationship_to_root || 'Family Member'}
          </div>

          <!-- Gotra & Bansa -->
          <div style="display: flex; gap: 4px; margin-bottom: 6px;">
            <span style="background: #f8fafc; border: 1px solid #e2e8f0; font-size: 9px; padding: 2px 5px; border-radius: 4px; color: #334155; font-weight: 600;">
              Gotra: <b>${node.gotra || '—'}</b>
            </span>
            <span style="background: #f8fafc; border: 1px solid #e2e8f0; font-size: 9px; padding: 2px 5px; border-radius: 4px; color: #334155; font-weight: 600;">
              Bansa: <b>${node.bansa || '—'}</b>
            </span>
          </div>
        </div>

        <!-- Footer Vitals -->
        <div style="border-top: 1px solid #f1f5f9; padding-top: 5px; font-size: 9.5px; color: #475569; display: flex; justify-content: space-between;">
          <span>${node.age != null ? `Age: ${node.age} yrs` : (node.dob || 'DOB: —')}</span>
          <span style="font-weight: 600; color: #0f172a; max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${node.profession || node.address || ''}
          </span>
        </div>
      </div>
    `;
  }).join('');

  const finalSubtitle = subtitle || `Visual Tree Architecture & Node Connections — ${nodes.length} Members | Generated: ${new Date().toLocaleDateString()}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          @page {
            size: auto;
            margin: 8mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 20px;
            background: #ffffff;
            color: #0f172a;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print-bar {
            position: sticky;
            top: 0;
            left: 0;
            right: 0;
            background: #0f172a;
            color: white;
            padding: 12px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: 12px;
            margin-bottom: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
          }
          .print-btn {
            background: #4f46e5;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 13px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          .print-btn:hover {
            background: #4338ca;
          }
          .close-btn {
            background: #334155;
            color: #e2e8f0;
            border: none;
            padding: 8px 14px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
          }
          .header-title-box {
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          .canvas-container {
            position: relative;
            width: ${totalW}px;
            height: ${totalH}px;
            background: #ffffff;
          }
          @media print {
            .no-print-bar {
              display: none !important;
            }
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print-bar">
          <div>
            <div style="font-weight: 800; font-size: 14px;">${title}</div>
            <div style="font-size: 11px; color: #94a3b8;">${finalSubtitle}</div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button onclick="window.print()" class="print-btn">🖨️ Print / Save as PDF</button>
            <button onclick="window.close()" class="close-btn">Close</button>
          </div>
        </div>

        <div class="header-title-box">
          <div style="font-size: 22px; font-weight: 900; color: #1e1b4b; letter-spacing: -0.5px;">${title}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 3px;">
            ${finalSubtitle}
          </div>
        </div>

        <div class="canvas-container">
          <!-- SVG Connections Overlay -->
          <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;" width="${totalW}" height="${totalH}">
            <defs>
              <marker id="print-arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#6366f1" />
              </marker>
            </defs>
            ${svgElements.join('\n')}
          </svg>

          <!-- Rendered Node Cards -->
          ${cardsHtml}
        </div>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      try {
        printWindow.print();
      } catch (e) {
        console.error(e);
      }
    }, 450);
  } else {
    // If popup blocked, create a temporary hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 2500);
      }, 500);
    }
  }
}

/**
 * Exports personal branch register table PDF for an isolated branch
 */
export function exportBranchRegisterPDF(
  rootNode: MemberNode,
  branchNodes: MemberNode[],
  branchLinks: RelationshipLink[]
) {
  const doc = new jsPDF('landscape');

  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text(`${rootNode.name}'s Family Branch Register`, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Official Personal Lineage Dossier | Connected Relatives: ${branchNodes.length} | Generated: ${new Date().toLocaleDateString()}`,
    14,
    25
  );

  const tableData = branchNodes.map(n => {
    const rels = getRelativeSummary(n.id, branchNodes, branchLinks);
    return [
      n.name,
      n.relationship_to_root,
      n.branch === 'maternal' ? "Wife's Side" : 'Main Line',
      n.marital_status === 'married' ? 'Married' : 'Single',
      n.status === 'deceased' ? 'Deceased' : 'Living',
      n.gotra || '-',
      n.bansa || '-',
      n.age ? `${n.age} yrs` : (n.dob || '-'),
      n.profession || '-',
      `${n.phone ? n.phone + ' | ' : ''}${n.address || '-'}`,
      `Parents: ${rels.parentNames}\nSpouses: ${rels.spouseNames}\nChildren: ${rels.childrenNames}`
    ];
  });

  autoTable(doc, {
    startY: 30,
    head: [['Full Name', 'Rel. to Root', 'Branch', 'Marital', 'Status', 'Gotra', 'Bansa', 'Age / DOB', 'Profession', 'Contact & Address', 'Direct Lineage']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 3 },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  doc.save(`${rootNode.name.replace(/\s+/g, '_')}_Branch_Register.pdf`);
}
