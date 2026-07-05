'use client';

import { useRef, useEffect, useCallback, memo } from 'react';
import dynamic from 'next/dynamic';
import type { GraphResponse } from '@/types';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-[var(--text-muted)]">Loading graph library...</div>,
});

interface GraphCanvasProps {
  data: GraphResponse;
  onNodeClick: (accountId: string) => void;
  selectedNode: string | null;
}

function GraphCanvas({ data, onNodeClick, selectedNode }: GraphCanvasProps) {
  const fgRef = useRef<any>(null);

  const graphData = {
    nodes: data.nodes.map((n) => ({ id: n.id, label: n.label, risk_score: n.risk_score, risk_band: n.risk_band, type: n.type })),
    links: data.edges.map((e) => ({ source: e.source, target: e.target, amount: e.amount, type: e.type, step: e.step, isFraud: e.isFraud })),
  };

  const getNodeColor = useCallback((node: any) => {
    if (node.id === selectedNode) return '#38BDF8';
    switch (node.risk_band) {
      case 'high': return '#DC2626';
      case 'medium': return '#F59E0B';
      case 'low': return '#22C55E';
      default: return '#6B7280';
    }
  }, [selectedNode]);

  const getNodeSize = useCallback((node: any) => {
    const riskSize = 5 + (node.risk_score || 0) / 25;
    const nodeEdges = data.edges.filter((e: any) => e.source === node.id || e.target === node.id);
    const totalVolume = nodeEdges.reduce((sum: number, e: any) => sum + e.amount, 0);
    const volumeBoost = Math.min(4, Math.log10(totalVolume + 1) / 2);
    return riskSize + volumeBoost;
  }, [data.edges]);

  const getEdgeColor = useCallback((link: any) => link.isFraud ? '#DC2626' : '#2F3A4A', []);
  const getEdgeWidth = useCallback((link: any) => Math.max(1, Math.log10(link.amount + 1) / 2), []);

  const nodeCanvasObject = useCallback((node: any, ctx: any, globalScale: number) => {
    const label = node.id;
    const fontSize = 12 / globalScale;
    ctx.font = `${fontSize}px Inter, sans-serif`;
    const textWidth = ctx.measureText(label).width;
    const ballSize = Math.max(getNodeSize(node), textWidth / 2 + 4);

    ctx.fillStyle = getNodeColor(node);
    ctx.beginPath();
    ctx.arc(node.x, node.y, ballSize / 2, 0, 2 * Math.PI);
    ctx.fill();

    if (node.id === selectedNode) {
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 3 / globalScale;
      ctx.stroke();
    }

    ctx.fillStyle = '#F3F4F6';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, node.x, node.y);
  }, [getNodeColor, getNodeSize, selectedNode]);

  const nodeLabel = useCallback((node: any) => {
    return `<div style="background:#1F2937;padding:8px 12px;border:1px solid #374151;border-radius:6px;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,0.3);color:#F3F4F6">
      <strong>${node.id}</strong><br/>
      Risk: <span style="color:${getNodeColor(node)}">${node.risk_score}/100 (${node.risk_band})</span><br/>
      Type: ${node.type || 'unknown'}
    </div>`;
  }, [getNodeColor]);

  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      const fg = fgRef.current;
      setTimeout(() => { fg.zoomToFit(400, 60); }, 500);
    }
  }, [graphData.nodes.length]);

  return (
    <div className="w-full h-full">
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeCanvasObject={nodeCanvasObject}
        nodeCanvasObjectMode={() => 'after'}
        nodeRelSize={6}
        linkColor={getEdgeColor}
        linkWidth={getEdgeWidth}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        linkDirectionalParticles={(link: any) => (link.isFraud ? 4 : 0)}
        linkDirectionalParticleWidth={3}
        linkDirectionalParticleSpeed={0.008}
        linkDirectionalParticleColor={(link: any) => (link.isFraud ? '#DC2626' : '#2F3A4A')}
        onNodeClick={(node: any) => onNodeClick(node.id)}
        nodeLabel={nodeLabel}
        cooldownTicks={100}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        enableNodeDrag={true}
        height={typeof window !== 'undefined' ? window.innerHeight - 200 : 800}
      />
    </div>
  );
}

export default memo(GraphCanvas);
