/**
 * GraphCanvas — interactive transaction network graph.
 *
 * UX decision (audit pain point #4): the graph is a verification tool,
 * not decoration. Nodes must be large enough to read at a glance —
 * account IDs are the primary information investigators need.
 *
 * Design choices:
 * - Nodes are 3x larger than before (16-28px radius based on risk)
 * - Labels are drawn ON the node, large and bold
 * - Selected node gets orange fill + thick ring
 * - High-risk nodes are navy filled with white text
 * - Edges show arrow direction + amount label on hover
 * - Zoom-to-fit with comfortable padding
 */
'use client';

import { useRef, useEffect, useCallback, memo } from 'react';
import dynamic from 'next/dynamic';
import type { GraphResponse } from '@/types';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-[var(--ink-muted)] text-sm">
      Loading graph library…
    </div>
  ),
});

interface GraphCanvasProps {
  data: GraphResponse;
  onNodeClick: (accountId: string) => void;
  selectedNode: string | null;
}

function GraphCanvas({ data, onNodeClick, selectedNode }: GraphCanvasProps) {
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const graphData = {
    nodes: data.nodes.map((n) => ({
      id: n.id,
      label: n.label,
      risk_score: n.risk_score,
      risk_band: n.risk_band,
      type: n.type,
    })),
    links: data.edges.map((e) => ({
      source: e.source,
      target: e.target,
      amount: e.amount,
      type: e.type,
      step: e.step,
      isFraud: e.isFraud,
    })),
  };

  // Node colors — design system palette
  const getNodeColor = useCallback((node: any) => {
    if (node.id === selectedNode) return '#FFA500'; // orange — selected
    switch (node.risk_band) {
      case 'high': return '#0A2B5C';   // navy — high risk
      case 'medium': return '#475569'; // slate — medium
      case 'low': return '#94A3B8';    // muted — low
      default: return '#C9BFA8';
    }
  }, [selectedNode]);

  // Node size — MUCH larger than before. Base 18, scales up to 28 for high risk.
  const getNodeSize = useCallback((node: any) => {
    const riskSize = 16 + (node.risk_score || 0) / 12; // 16-24px from risk alone
    const nodeEdges = data.edges.filter((e: any) => e.source === node.id || e.target === node.id);
    const totalVolume = nodeEdges.reduce((sum: number, e: any) => sum + e.amount, 0);
    const volumeBoost = Math.min(6, Math.log10(totalVolume + 1) / 1.5);
    return Math.max(18, riskSize + volumeBoost); // minimum 18px radius
  }, [data.edges]);

  // Edge colors — red for fraud, warm gray for clean
  const getEdgeColor = useCallback((link: any) => (link.isFraud ? '#DC2626' : '#C9BFA8'), []);
  const getEdgeWidth = useCallback((link: any) => Math.max(1.5, Math.log10(link.amount + 1) / 1.5), []);

  const nodeCanvasObject = useCallback((node: any, ctx: any, globalScale: number) => {
    const label = node.id;
    const radius = getNodeSize(node);

    // Font size scales with node — always readable
    const fontSize = Math.max(9, radius * 0.55) / globalScale;
    ctx.font = `700 ${fontSize}px 'JetBrains Mono', monospace`;
    const textWidth = ctx.measureText(label).width;
    const ballSize = Math.max(radius * 2, textWidth + 12 / globalScale);

    // Shadow for depth
    ctx.shadowColor = 'rgba(10, 43, 92, 0.15)';
    ctx.shadowBlur = 6 / globalScale;
    ctx.shadowOffsetY = 2 / globalScale;

    // Fill
    ctx.fillStyle = getNodeColor(node);
    ctx.beginPath();
    ctx.arc(node.x, node.y, ballSize / 2, 0, 2 * Math.PI);
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Selected ring — thick orange
    if (node.id === selectedNode) {
      ctx.strokeStyle = '#FFA500';
      ctx.lineWidth = 4 / globalScale;
      ctx.stroke();
      // Outer pulse ring
      ctx.strokeStyle = 'rgba(255, 165, 0, 0.3)';
      ctx.lineWidth = 2 / globalScale;
      ctx.beginPath();
      ctx.arc(node.x, node.y, ballSize / 2 + 6 / globalScale, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Label — white on dark nodes, navy on light nodes
    const isLightNode = node.risk_band === 'low' || node.risk_band === 'medium';
    const isSelected = node.id === selectedNode;
    ctx.fillStyle = (isLightNode && !isSelected) ? '#0A2B5C' : '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, node.x, node.y);
  }, [getNodeColor, getNodeSize, selectedNode]);

  // Link label — shows amount on hover via tooltip
  const linkLabel = useCallback((link: any) => {
    const amount = link.amount >= 1000000
      ? `$${(link.amount / 1000000).toFixed(1)}M`
      : link.amount >= 1000
      ? `$${(link.amount / 1000).toFixed(0)}K`
      : `$${link.amount}`;
    return `<div style="background:#FFFEFA;padding:6px 10px;border:1px solid #DDD6C6;border-radius:6px;font-size:11px;box-shadow:0 2px 8px rgba(10,43,92,0.08);color:#0A2B5C;font-family:'JetBrains Mono',monospace">
      ${amount} ${link.isFraud ? '<span style="color:#DC2626">· fraud</span>' : ''}
    </div>`;
  }, []);

  const nodeLabel = useCallback((node: any) => {
    const color = getNodeColor(node);
    const bandLabel = node.risk_band === 'high' ? 'High Risk' : node.risk_band === 'medium' ? 'Medium Risk' : 'Low Risk';
    return `<div style="background:#FFFEFA;padding:10px 14px;border:1px solid #DDD6C6;border-radius:8px;font-size:13px;box-shadow:0 4px 12px rgba(10,43,92,0.12);color:#0A2B5C;font-family:'JetBrains Mono',monospace;min-width:140px">
      <div style="font-weight:700;font-size:14px;margin-bottom:4px">${node.id}</div>
      <div style="font-size:11px;color:#475569">Risk: <span style="color:${color};font-weight:600">${node.risk_score}/100</span></div>
      <div style="font-size:11px;color:#475569">Band: <span style="color:${color};font-weight:600">${bandLabel}</span></div>
    </div>`;
  }, [getNodeColor]);

  // Tune force layout for better spacing + zoom to fit
  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      const fg = fgRef.current;

      // Tune force layout for better spacing — spread nodes out
      // Default charge is -30 which crams nodes together. -400 spreads them.
      const charge = fg.d3Force('charge');
      if (charge) charge.strength(-400).distanceMax(400);

      const link = fg.d3Force('link');
      if (link) link.distance(70).strength(0.3);

      const center = fg.d3Force('center');
      if (center) center.strength(0.03);

      // Note: d3Reheat() is not available in all versions.
      // The simulation auto-reheats when forces change via d3Force().

      // Multiple zoom attempts — force graph needs time to settle
      const zoomFit = () => fg.zoomToFit(400, 80);
      const t1 = setTimeout(zoomFit, 500);
      const t2 = setTimeout(zoomFit, 1200);
      const t3 = setTimeout(zoomFit, 2500);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [graphData.nodes.length]);

  // Note: react-force-graph-2d handles its own resizing via the height prop
  // and the container's CSS. No manual resize logic needed.

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeCanvasObject={nodeCanvasObject}
        nodeCanvasObjectMode={() => 'after'}
        nodeRelSize={18}
        linkColor={getEdgeColor}
        linkWidth={getEdgeWidth}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        linkDirectionalParticles={(link: any) => (link.isFraud ? 4 : 0)}
        linkDirectionalParticleWidth={4}
        linkDirectionalParticleSpeed={0.006}
        linkDirectionalParticleColor={(link: any) => (link.isFraud ? '#DC2626' : '#C9BFA8')}
        linkLabel={linkLabel}
        onNodeClick={(node: any) => onNodeClick(node.id)}
        nodeLabel={nodeLabel}
        cooldownTicks={200}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        enableNodeDrag={true}
        height={typeof window !== 'undefined' ? Math.max(400, window.innerHeight - 120) : 800}
        backgroundColor="#F7F4ED"
        minZoom={0.5}
        maxZoom={8}
      />
      {/* Hint overlay */}
      <div className="absolute bottom-3 left-3 text-[11px] text-[var(--ink-muted)] bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius)] px-2.5 py-1.5 pointer-events-none">
        Scroll to zoom · Drag to pan · Click node for details
      </div>
    </div>
  );
}

export default memo(GraphCanvas);
