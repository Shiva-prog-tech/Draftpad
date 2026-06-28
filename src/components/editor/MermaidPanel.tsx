'use client';
import { useState, useEffect } from 'react';
import { X, GitBranch, Loader2, AlertCircle, Download, RefreshCw } from 'lucide-react';

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
    <div className="fixed right-0 top-0 bottom-0 w-[420px] bg-[#111113] border-l border-[#1F1F23] z-30 flex flex-col shadow-2xl animate-[slideRight_0.2s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F1F23] flex-shrink-0">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-[#6366F1]" />
          <span className="text-white text-sm font-semibold">Diagrams</span>
          {diagrams.length > 0 && (
            <span className="text-[10px] bg-[#6366F1]/20 text-[#6366F1] px-1.5 py-0.5 rounded-full font-medium">
              {diagrams.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTick(t => t + 1)}
            title="Re-render diagrams"
            className="p-1.5 text-[#52525B] hover:text-white transition-colors rounded-lg hover:bg-[#1F1F23]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={onClose} className="p-1.5 text-[#52525B] hover:text-white transition-colors rounded-lg hover:bg-[#1F1F23]">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-[#6366F1]" />
            <span className="text-[#52525B] text-xs">Rendering diagrams…</span>
          </div>
        ) : diagrams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-10 h-10 bg-[#0A0A0B] border border-[#1F1F23] rounded-xl flex items-center justify-center mb-3">
              <GitBranch className="w-5 h-5 text-[#2a2a2e]" />
            </div>
            <p className="text-[#52525B] text-xs font-medium">No diagrams found</p>
            <p className="text-[#3F3F46] text-[10px] mt-1 leading-relaxed">
              Type <span className="text-[#6366F1]">/diagram</span> to insert a Mermaid block
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {diagrams.map((d, i) => (
              <div key={d.id} className="bg-[#0A0A0B] border border-[#1F1F23] rounded-xl overflow-hidden">
                {/* Card header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-[#1F1F23]">
                  <span className="text-[#52525B] text-[11px] font-medium">Diagram {i + 1}</span>
                  <button
                    onClick={() => downloadSVG(d.id, i)}
                    disabled={!svgMap[d.id]}
                    className="flex items-center gap-1 text-[#52525B] hover:text-white disabled:opacity-30 transition-colors text-[10px] px-2 py-1 rounded hover:bg-[#1F1F23]"
                  >
                    <Download className="w-3 h-3" /> SVG
                  </button>
                </div>

                {/* Error */}
                {errMap[d.id] && (
                  <div className="p-3 flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-[10px] font-mono break-all">{errMap[d.id]}</p>
                  </div>
                )}

                {/* SVG render */}
                {svgMap[d.id] && !errMap[d.id] && (
                  <div
                    className="p-4 overflow-auto [&_svg]:max-w-full [&_svg]:h-auto"
                    dangerouslySetInnerHTML={{ __html: svgMap[d.id] }}
                  />
                )}

                {/* Code preview */}
                <div className="border-t border-[#1F1F23] bg-[#060607]">
                  <pre className="px-3 py-2 text-[#52525B] text-[9px] font-mono overflow-x-auto whitespace-pre-wrap line-clamp-4">
                    {d.code}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
