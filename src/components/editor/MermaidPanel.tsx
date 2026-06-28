'use client';
import { useState, useEffect } from 'react';
import { GitBranch, Loader2, AlertCircle, Download, RefreshCw } from 'lucide-react';
import { SidePanel } from '@/components/ui';

interface DiagramBlock {
  index: number;
  code:  string;
  id:    string;
}

interface Props {
  content: string;
  onClose: () => void;
}

export function MermaidPanel({ content, onClose }: Props) {
  const [diagrams, setDiagrams] = useState<DiagramBlock[]>([]);
  const [svgMap,   setSvgMap]   = useState<Record<string, string>>({});
  const [errMap,   setErrMap]   = useState<Record<string, string>>({});
  const [loading,  setLoading]  = useState(false);
  const [tick,     setTick]     = useState(0); // manual re-render trigger

  // Parse mermaid blocks from the HTML content
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const parser = new DOMParser();
    const doc    = parser.parseFromString(content, 'text/html');
    const pres   = Array.from(doc.querySelectorAll<HTMLElement>('pre[data-mermaid="true"]'));
    const blocks = pres
      .map((pre, i) => {
        const code = (pre.querySelector('code')?.textContent ?? pre.textContent ?? '').trim();
        return code ? ({ index: i, code, id: `mermaid-render-${i}-${tick}` }) : null;
      })
      .filter(Boolean) as DiagramBlock[];
    setDiagrams(blocks);
  }, [content, tick]);

  // Render all parsed blocks using the mermaid library
  useEffect(() => {
    if (!diagrams.length) { setSvgMap({}); setErrMap({}); return; }
    setLoading(true);
    setSvgMap({});
    setErrMap({});

    import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        themeVariables: {
          primaryColor:       '#6366F1',
          primaryTextColor:   '#fff',
          primaryBorderColor: '#4F46E5',
          lineColor:          '#71717A',
          secondaryColor:     '#1F1F23',
          tertiaryColor:      '#111113',
          background:         '#0A0A0B',
          nodeBorder:         '#3F3F46',
          clusterBkg:         '#111113',
          titleColor:         '#A1A1AA',
          edgeLabelBackground:'#0A0A0B',
          attributeBackgroundColorOdd:  '#111113',
          attributeBackgroundColorEven: '#0A0A0B',
        },
        securityLevel: 'loose',
      });

      const newSvg: Record<string, string> = {};
      const newErr: Record<string, string> = {};

      Promise.allSettled(
        diagrams.map(async d => {
          try {
            const { svg } = await mermaid.render(d.id, d.code);
            newSvg[d.id] = svg;
          } catch (err: unknown) {
            newErr[d.id] = err instanceof Error ? err.message : 'Invalid diagram syntax';
          }
        })
      ).then(() => {
        setSvgMap(newSvg);
        setErrMap(newErr);
        setLoading(false);
      });
    });
  }, [diagrams]);

  const downloadSVG = (id: string, index: number) => {
    const svg = svgMap[id];
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `diagram-${index + 1}.svg`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <SidePanel
      onClose={onClose}
      title="Diagrams"
      icon={<GitBranch className="h-3.5 w-3.5 text-white" />}
      width={420}
      subtitle={diagrams.length ? `${diagrams.length} diagram${diagrams.length !== 1 ? 's' : ''}` : undefined}
      headerExtra={
        <button
          onClick={() => setTick(t => t + 1)}
          title="Re-render diagrams"
          className="rounded-lg p-2 text-txt-muted transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      }
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
          <span className="text-xs text-txt-muted">Rendering diagrams…</span>
        </div>
      ) : diagrams.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white/[0.02]">
            <GitBranch className="h-5 w-5 text-[#2a2a2e]" />
          </div>
          <p className="text-xs font-medium text-txt-muted">No diagrams found</p>
          <p className="mt-1 text-[10px] leading-relaxed text-[#3F3F46]">
            Type <span className="text-accent">/diagram</span> to insert a Mermaid block
          </p>
        </div>
      ) : (
        <div className="space-y-4 p-4">
          {diagrams.map((d, i) => (
            <div key={d.id} className="overflow-hidden rounded-xl border border-line bg-white/[0.02]">
              <div className="flex items-center justify-between border-b border-line px-3 py-2">
                <span className="text-[11px] font-medium text-txt-muted">Diagram {i + 1}</span>
                <button
                  onClick={() => downloadSVG(d.id, i)}
                  disabled={!svgMap[d.id]}
                  className="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-txt-muted transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
                >
                  <Download className="h-3 w-3" /> SVG
                </button>
              </div>

              {errMap[d.id] && (
                <div className="flex items-start gap-2 p-3">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-400" />
                  <p className="break-all font-mono text-[10px] text-red-400">{errMap[d.id]}</p>
                </div>
              )}

              {svgMap[d.id] && !errMap[d.id] && (
                <div
                  className="overflow-auto p-4 [&_svg]:h-auto [&_svg]:max-w-full"
                  dangerouslySetInnerHTML={{ __html: svgMap[d.id] }}
                />
              )}

              <div className="border-t border-line bg-black/30">
                <pre className="line-clamp-4 overflow-x-auto whitespace-pre-wrap px-3 py-2 font-mono text-[9px] text-txt-muted">
                  {d.code}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </SidePanel>
  );
}
