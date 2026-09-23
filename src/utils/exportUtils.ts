import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { MemberNode, RelationshipLink } from '../types';
import { getRelativeSummary } from './treeUtils';

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
