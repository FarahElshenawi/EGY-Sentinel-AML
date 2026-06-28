'use client';

import { useRef, useEffect, useCallback, memo } from 'react';
import dynamic from 'next/dynamic';
import type { GraphResponse } from '@/types';

// react-force-graph-2d uses browser APIs — must be dynamically imported with ssr: false
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-gray-400">Loading graph library...</div>,
});

interface GraphCanvasProps {
  data: GraphResponse;
  onNodeClick: (accountId: string) => void;
  selectedNode: string | null;
}

function GraphCanvas({ data, onNodeClick, selectedNode }: GraphCanvasProps) {
  const fgRef = useRef<any>(null);

  // Transform API response into the format react-force-graph-2d expects
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

  // Node color by risk band
  const getNodeColor = useCallback((node: any) => {
    if (node.id === selectedNode) return '#5e78c5'; // blue for selected
    switch (node.risk_band) {
      case 'high': return '#91534d';   // red
      case 'medium': return '#a28856'; // amber
      case 'low': return '#4e9565';    // green
      default: return '#86837c';
    }
  }, [selectedNode]);

  // Node size by risk score
  const getNodeSize = useCallback((node: any) => {
    return 6 + (node.risk_score || 0) / 20; // 6-11px
  }, []);

  // Edge color: fraud = red, normal = gray
  const getEdgeColor = useCallback((link: any) => {
    return link.isFraud ? '#91534d' : '#c1bba9';
  }, []);

  // Edge width by amount (log scale)
  const getEdgeWidth = useCallback((link: any) => {
    return Math.max(1, Math.log10(link.amount + 1) / 2);
  }, []);

  // Custom node rendering (canvas)
  const nodeCanvasObject = useCallback((node: any, ctx: any, globalScale: number) => {
    const label = node.id;
    const fontSize = 12 / globalScale;
    ctx.font = `${fontSize}px Inter, sans-serif`;
    const textWidth = ctx.measureText(label).width;
    const ballSize = Math.max(getNodeSize(node), textWidth / 2 + 4);

    // Draw node circle
    ctx.fillStyle = getNodeColor(node);
    ctx.beginPath();
    ctx.arc(node.x, node.y, ballSize / 2, 0, 2 * Math.PI);
    ctx.fill();

    // Draw border on selected node
    if (node.id === selectedNode) {
      ctx.strokeStyle = '#5e78c5';
      ctx.lineWidth = 3 / globalScale;
      ctx.stroke();
    }

    // Draw label
    ctx.fillStyle = '#232220';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, node.x, node.y);
  }, [getNodeColor, getNodeSize, selectedNode]);

  // Node tooltip on hover
  const nodeLabel = useCallback((node: any) => {
    return `<div style="background:#fff;padding:8px 12px;border:1px solid #c1bba9;border-radius:6px;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
      <strong>${node.id}</strong><br/>
      Risk: <span style="color:${getNodeColor(node)}">${node.risk_score}/100 (${node.risk_band})</span><br/>
      Type: ${node.type || 'unknown'}
    </div>`;
  }, [getNodeColor]);

  // Auto-zoom to fit graph after it settles
  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      const fg = fgRef.current;
      // Wait for layout to settle, then zoom to fit
      setTimeout(() => {
        fg.zoomToFit(400, 60);
      }, 500);
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
