import React, { useState, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  NodeProps,
  Handle,
  Position,
  Node,
  Edge,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArchReport, FileInfo } from '../../../src/types.js';
import { ArchaeologyReport } from '../types/pipeline.js';
import { transformEngineReportToGraph, ArchitectureNodeData } from '../utils/graphTransform.js';
import { NodeDetailsPanel } from './NodeDetailsPanel.js';
import { FileCode, AlertTriangle, ShieldCheck, ShieldAlert, Lock, Layers } from 'lucide-react';

interface GraphCanvasProps {
  report: ArchReport;
  files: Map<string, FileInfo>;
  archaeologyReport?: ArchaeologyReport;
}

// Custom Node Component for React Flow architecture nodes
const CustomArchitectureNode: React.FC<NodeProps<Node<ArchitectureNodeData>>> = ({ data, selected }) => {
  const {
    label,
    layer,
    isInCycle,
    hasViolation,
    safeToRefactor,
    isLocked,
  } = data;

  const getHeaderStyle = (l: string) => {
    switch (l) {
      case 'controllers':
        return 'bg-blue-950/80 text-blue-400 border-blue-800/80';
      case 'services':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80';
      case 'repositories':
        return 'bg-purple-950/80 text-purple-400 border-purple-800/80';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-700';
    }
  };

  return (
    <div
      className={`relative min-w-[240px] rounded-xl bg-slate-900/95 border-2 shadow-xl transition-all duration-200 overflow-hidden ${
        selected ? 'ring-2 ring-indigo-500 border-indigo-500 scale-105' : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-indigo-500 !w-3 !h-3" />

      {/* Header bar */}
      <div className={`px-3 py-2 border-b flex items-center justify-between text-xs font-semibold ${getHeaderStyle(layer)}`}>
        <div className="flex items-center gap-1.5 uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5" />
          {layer}
        </div>
        {isLocked ? (
          <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded font-mono">
            <Lock className="w-3 h-3" /> LOCKED
          </span>
        ) : safeToRefactor ? (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded font-mono">
            <ShieldCheck className="w-3 h-3" /> SAFE
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded font-mono">
            <ShieldAlert className="w-3 h-3" /> UNSAFE
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <FileCode className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-semibold text-sm text-slate-100 truncate" title={label}>
            {label}
          </span>
        </div>

        {/* Warnings / badging */}
        {(isInCycle || hasViolation) && (
          <div className="flex flex-wrap gap-1 mt-2">
            {isInCycle && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-950/90 text-rose-400 border border-rose-800 rounded flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> CYCLE
              </span>
            )}
            {hasViolation && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-950/90 text-amber-400 border border-amber-800 rounded flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> VIOLATION
              </span>
            )}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-indigo-500 !w-3 !h-3" />
    </div>
  );
};

export const GraphCanvas: React.FC<GraphCanvasProps> = ({ report, files, archaeologyReport }) => {
  const [selectedNodeData, setSelectedNodeData] = useState<ArchitectureNodeData | null>(null);

  const nodeTypes = useMemo(() => ({ customNode: CustomArchitectureNode }), []);

  const { nodes, edges } = useMemo(
    () => transformEngineReportToGraph(report, files, archaeologyReport),
    [report, files, archaeologyReport]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeData((node.data as ArchitectureNodeData) || null);
  }, []);

  return (
    <div className="relative w-full h-[650px] bg-slate-950 rounded-2xl border border-slate-800 shadow-inner overflow-hidden">
      {/* Legend / Title overlay */}
      <div className="absolute top-4 left-4 z-40 bg-slate-900/90 backdrop-blur-md px-4 py-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1 shadow-lg">
        <div className="font-bold text-slate-100 mb-1">Architecture Dependency Graph</div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> Controller
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Service
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span> Repository
          </span>
        </div>
        <div className="flex items-center gap-4 pt-1 border-t border-slate-800">
          <span className="flex items-center gap-1 text-rose-400 font-semibold">
            <span className="w-3 h-0.5 bg-rose-500 inline-block"></span> Red Edge = Cycle
          </span>
          <span className="flex items-center gap-1 text-amber-400 font-semibold">
            <span className="w-3 h-0.5 bg-amber-500 inline-block"></span> Orange Edge = Layer Violation
          </span>
        </div>
      </div>

      {/* React Flow Component */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        className="w-full h-full"
      >
        <Background color="#334155" variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls className="!bg-slate-900 !border-slate-800 !text-slate-300 fill-current" />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as ArchitectureNodeData;
            if (data?.layer === 'controllers') return '#3b82f6';
            if (data?.layer === 'services') return '#10b981';
            if (data?.layer === 'repositories') return '#a855f7';
            return '#64748b';
          }}
          className="!bg-slate-900/90 !border-slate-800 rounded-lg overflow-hidden"
        />
      </ReactFlow>

      {/* Selected Node Inspector Sidebar */}
      <NodeDetailsPanel nodeData={selectedNodeData} onClose={() => setSelectedNodeData(null)} />
    </div>
  );
};
