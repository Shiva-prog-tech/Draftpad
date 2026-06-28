import TurndownService from 'turndown';

function buildTurndown(): TurndownService {
  const td = new TurndownService({
    headingStyle:    'atx',
    hr:              '---',
    bulletListMarker: '-',
    codeBlockStyle:  'fenced',
    fence:           '```',
    emDelimiter:     '_',
    strongDelimiter: '**',
    linkStyle:       'inlined',
  });

  // Mermaid diagrams — <pre data-mermaid="true"><code>...</code></pre>
  td.addRule('mermaid-block', {
    filter(node) {
      return (
        node.nodeName === 'PRE' &&
        (node as HTMLElement).getAttribute('data-mermaid') === 'true'
      );
    },
    replacement(_content, node) {
      const code = (node as HTMLElement).querySelector('code')?.textContent?.trim() ?? '';
      return `\n\`\`\`mermaid\n${code}\n\`\`\`\n`;
    },
  });

  // Tables — convert to GFM pipe tables
  td.addRule('table', {
    filter: ['table'],
    replacement(_content, node) {
      const rows = Array.from((node as HTMLElement).querySelectorAll('tr'));
      if (!rows.length) return '';

      const cells = (tr: Element) =>
        Array.from(tr.querySelectorAll('td, th')).map(td =>
          (td.textContent || '').trim().replace(/\|/g, '\\|')
        );

      const header = cells(rows[0]);
      const sep = header.map(() => '---');
      const body = rows.slice(1).map(cells);

      const row = (cols: string[]) => `| ${cols.join(' | ')} |`;
      return (
        '\n' +
        row(header) + '\n' +
        row(sep) + '\n' +
        body.map(row).join('\n') +
        '\n'
      );
    },
  });

  // Drop table sub-elements (handled by the table rule)
  td.addRule('table-cells', {
    filter: ['thead', 'tbody', 'tfoot', 'tr', 'td', 'th'],
    replacement(content) { return content; },
  });

  // Callout / styled blockquote
  td.addRule('callout', {
    filter(node) {
      return node.nodeName === 'BLOCKQUOTE';
    },
    replacement(content) {
      return content
        .trim()
        .split('\n')
        .map(l => `> ${l}`)
        .join('\n') + '\n';
    },
  });

  return td;
}

export function htmlToMarkdown(html: string): string {
  const td = buildTurndown();
  return td.turndown(html);
}

export function downloadMarkdown(title: string, html: string): void {
  const markdown = htmlToMarkdown(html);
  const safe = title.trim().replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '-').toLowerCase() || 'document';
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${safe}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
