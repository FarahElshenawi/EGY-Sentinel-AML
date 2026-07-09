/**
 * GraphCanvas — Interactive transaction network graph.
 *
 * Redesigned for the "wow factor":
 * - Full-screen canvas
 * - Color-coded nodes (orange=selected, navy=high, slate=medium, gray=low/neighbor)
 * - Edge thickness = transaction amount
 * - Red edges only for fraud, slate for clean
 * - Labels below nodes in JetBrains Mono with background pill
 * - Fade non-connected nodes when one is selected
 * - Force layout with collision detection
 */
'use client';

import { useRef, useEffect, useCallback, memo, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { forceCollide } from 'd3-force-3d';
import type { GraphResponse } from '@/types';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-[var(--ink-muted)] text-sm">
      Loading graph…
    </div>
  ),
});

interface GraphCanvasProps {
  data: GraphResponse;
  onNodeClick: (accountId: string) => void;
  selectedNode: string | null;
  highlightedNodes?: Set<string> | null;
  patternMap?: Map<string, string> | null;
}

function GraphCanvas({ data, onNodeClick, selectedNode, highlightedNodes, patternMap }: GraphCanvasProps) {
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Memoize graphData so it doesn't get recreated on every render.
  // Without this, selecting a node causes a new graphData object,
  // which makes ForceGraph2D restart the force simulation from scratch.
  const graphData = useMemo(() => ({
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
  }), [data]);

  // Node colors — by PATTERN TYPE for visual distinction between clusters
  const getNodeColor = useCallback((node: any) => {
    if (node.id === selectedNode) return '#FFA500'; // orange — selected

    // Color by pattern type if we have the map
    const pattern = patternMap?.get(node.id);
    if (pattern === 'circular') return '#0A2B5C';       // navy — circular
    if (pattern === 'fan_out') return '#2563EB';         // blue — fan-out
    if (pattern === 'dense_cluster') return '#7C3AED';   // purple — dense cluster

    // Fallback: color by risk band for neighbors/unknown
    if (node.risk_band === 'high') return '#0A2B5C';
    if (node.risk_band === 'medium') return '#64748B';
    return '#CBD5E1'; // light gray — low/neighbor
  }, [selectedNode, patternMap]);

  // Node radius — based on risk score, 12-18px
  const getNodeRadius = useCallback((node: any) => {
    const base = 12;
    const riskBoost = (node.risk_score || 0) / 100 * 6;
    return base + riskBoost;
  }, []);

  // Edge width — proportional to transaction amount
  const getEdgeWidth = useCallback((link: any) => {
    const min = 1;
    const max = 6;
    const logAmount = Math.log10(link.amount + 1);
    const normalized = Math.min(1, logAmount / 7); // 7 = log10(10M)
    return min + (max - min) * normalized;
  }, []);

  // Edge color — red ONLY for fraud, slate for clean
  const getEdgeColor = useCallback((link: any) => {
    if (link.isFraud) return '#DC2626';
    return '#C9BFA8';
  }, []);

  // Determine if a node should be dimmed (when another is selected)
  const isDimmed = useCallback((nodeId: string) => {
    if (!selectedNode) return false;
    if (nodeId === selectedNode) return false;
    // Don't dim direct neighbors
    const connected = new Set<string>();
    for (const edge of data.edges) {
      if (edge.source === selectedNode) connected.add(edge.target);
      if (edge.target === selectedNode) connected.add(edge.source);
    }
    return !connected.has(nodeId);
  }, [selectedNode, data.edges]);

  const nodeCanvasObject = useCallback((node: any, ctx: any, globalScale: number) => {
    const label = node.id;
    const radius = getNodeRadius(node);
    const color = getNodeColor(node);
    const dimmed = isDimmed(node.id);
    const opacity = dimmed ? 0.2 : 1;

    ctx.globalAlpha = opacity;

    // Shadow for depth
    if (!dimmed) {
      ctx.shadowColor = 'rgba(10, 43, 92, 0.2)';
      ctx.shadowBlur = 6 / globalScale;
      ctx.shadowOffsetY = 2 / globalScale;
    }

    // Draw node
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Selected ring — thick orange + outer glow
    if (node.id === selectedNode) {
      ctx.strokeStyle = '#FFA500';
      ctx.lineWidth = 4 / globalScale;
      ctx.stroke();
      // Outer glow ring
      ctx.strokeStyle = 'rgba(255, 165, 0, 0.2)';
      ctx.lineWidth = 8 / globalScale;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 4 / globalScale, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Label BELOW node — JetBrains Mono, high contrast
    const fontSize = Math.max(10, 11 / globalScale);
    ctx.font = `600 ${fontSize}px 'JetBrains Mono', monospace`;
    const textWidth = ctx.measureText(label).width;
    const pillW = textWidth + 10 / globalScale;
    const pillH = fontSize + 4 / globalScale;
    const pillY = node.y + radius + 4 / globalScale;

    // Label background pill
    ctx.fillStyle = dimmed ? 'rgba(247, 244, 237, 0.5)' : 'rgba(247, 244, 237, 0.95)';
    ctx.beginPath();
    ctx.roundRect(node.x - pillW / 2, pillY, pillW, pillH, 3 / globalScale);
    ctx.fill();

    // Label text
    ctx.fillStyle = dimmed ? 'rgba(10, 43, 92, 0.3)' : '#0A2B5C';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, node.x, pillY + pillH / 2);

    ctx.globalAlpha = 1;
  }, [getNodeColor, getNodeRadius, selectedNode, isDimmed]);

  // Dim edges that aren't connected to selected node
  const getLinkColor = useCallback((link: any) => {
    if (!selectedNode) {
      return link.isFraud ? '#DC2626' : '#C9BFA8';
    }
    // Highlight edges connected to selected node
    const isConnected = link.source.id === selectedNode || link.target.id === selectedNode ||
                        link.source === selectedNode || link.target === selectedNode;
    if (isConnected) {
      return link.isFraud ? '#DC2626' : '#2A7FFF';
    }
    return 'rgba(201, 191, 168, 0.15)';
  }, [selectedNode]);

  const getLinkWidth = useCallback((link: any) => {
    if (!selectedNode) return getEdgeWidth(link);
    const isConnected = link.source.id === selectedNode || link.target.id === selectedNode ||
                        link.source === selectedNode || link.target === selectedNode;
    return isConnected ? getEdgeWidth(link) * 1.5 : getEdgeWidth(link) * 0.3;
  }, [selectedNode, getEdgeWidth]);

  const nodeLabel = useCallback((node: any) => {
    // Return empty — we use the side panel instead of tooltip
    return '';
  }, []);

  // Force layout tuning
  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      const fg = fgRef.current;

      const charge = fg.d3Force('charge');
      if (charge) charge.strength(-600).distanceMax(500);

      const link = fg.d3Force('link');
      if (link) link.distance(140).strength(0.2);

      const center = fg.d3Force('center');
      if (center) center.strength(0.02);

      fg.d3Force('collide', forceCollide((node: any) => {
        const radius = getNodeRadius(node);
        return radius + 30;
      }).iterations(3));

      const zoomFit = () => fg.zoomToFit(400, 100);
      const t1 = setTimeout(zoomFit, 600);
      const t2 = setTimeout(zoomFit, 1500);
      const t3 = setTimeout(zoomFit, 3000);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [graphData.nodes.length, getNodeRadius]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeCanvasObject={nodeCanvasObject}
        nodeCanvasObjectMode={() => 'after'}
        nodeRelSize={14}
        linkColor={getLinkColor}
        linkWidth={getLinkWidth}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        linkDirectionalParticles={(link: any) => (link.isFraud ? 3 : 0)}
        linkDirectionalParticleWidth={3}
        linkDirectionalParticleSpeed={0.006}
        linkDirectionalParticleColor={(link: any) => (link.isFraud ? '#DC2626' : '#C9BFA8')}
        onNodeClick={(node: any) => onNodeClick(node.id)}
        onNodeHover={(node: any) => setHoveredNode(node?.id || null)}
        nodeLabel={nodeLabel}
        cooldownTicks={300}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        enableNodeDrag={true}
        height={typeof window !== 'undefined' ? Math.max(400, window.innerHeight - 120) : 800}
        backgroundColor="#F7F4ED"
        minZoom={0.5}
        maxZoom={8}
      />
    </div>
  );
}

export default memo(GraphCanvas);
