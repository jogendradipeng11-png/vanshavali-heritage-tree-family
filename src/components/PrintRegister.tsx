import React from 'react';
import { MemberNode, RelationshipLink } from '../types';
import { getRelativeSummary } from '../utils/treeUtils';

interface PrintRegisterProps {
  nodes: MemberNode[];
  links: RelationshipLink[];
}

export const PrintRegister: React.FC<PrintRegisterProps> = ({ nodes, links }) => {
  return (
    <div id="printableArea" className="hidden p-8 bg-white text-slate-900">
      <div className="text-center mb-6 pb-4 border-b border-slate-300">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Vanshavali Family Heritage Register
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Official Genealogical Record | Archive Generated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <table className="w-full text-left border-collapse border border-slate-300 text-xs">
        <thead>
          <tr className="bg-slate-100 text-slate-900 font-bold">
            <th className="border border-slate-300 p-2">Full Name</th>
            <th className="border border-slate-300 p-2">Rel. to Root</th>
            <th className="border border-slate-300 p-2">Branch</th>
            <th className="border border-slate-300 p-2">Marital</th>
            <th className="border border-slate-300 p-2">Status</th>
            <th className="border border-slate-300 p-2">Gotra</th>
            <th className="border border-slate-300 p-2">Bansa</th>
            <th className="border border-slate-300 p-2">Age / Dates</th>
            <th className="border border-slate-300 p-2">Profession</th>
            <th className="border border-slate-300 p-2">Phone & Address</th>
            <th className="border border-slate-300 p-2">Connections</th>
          </tr>
        </thead>
        <tbody>
          {nodes.map(node => {
            const rels = getRelativeSummary(node.id, nodes, links);
            return (
              <tr key={node.id} className="border-b border-slate-200">
                <td className="border border-slate-300 p-2 font-bold">{node.name}</td>
                <td className="border border-slate-300 p-2 font-medium">{node.relationship_to_root}</td>
                <td className="border border-slate-300 p-2">
                  {node.branch === 'maternal' ? "Wife's Side" : 'Main Side'}
                </td>
                <td className="border border-slate-300 p-2">
                  {node.marital_status === 'married' ? 'Married' : 'Single'}
                </td>
                <td className="border border-slate-300 p-2">
                  {node.status === 'deceased' ? '🕊️ Deceased' : '🌱 Living'}
                </td>
                <td className="border border-slate-300 p-2">{node.gotra || '-'}</td>
                <td className="border border-slate-300 p-2">{node.bansa || '-'}</td>
                <td className="border border-slate-300 p-2">
                  {node.age ? `${node.age} yrs` : (node.dob || '-')}
                </td>
                <td className="border border-slate-300 p-2">{node.profession || '-'}</td>
                <td className="border border-slate-300 p-2">
                  {node.phone ? `${node.phone} | ` : ''}
                  {node.address || '-'}
                </td>
                <td className="border border-slate-300 p-2 text-[10px]">
                  P: {rels.parentNames} | S: {rels.spouseNames} | C: {rels.childrenNames}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
