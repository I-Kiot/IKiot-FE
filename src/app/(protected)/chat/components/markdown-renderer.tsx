import React from "react";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  // Parser markdown cơ bản sang TSX, không dùng thư viện ngoài
  const lines = content.split("\n");
  const parsedElements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  const parseInlineStyles = (text: string): React.ReactNode[] => {
    // Xử lý in đậm **text**
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, index) => {
      // Chỉ số lẻ là phần khớp in đậm
      if (index % 2 === 1) {
        return <strong key={index} className="font-semibold text-foreground">{part}</strong>;
      }
      // Xử lý link [text](url)
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      if (linkRegex.test(part)) {
        const linkParts = part.split(linkRegex);
        return (
          <span key={index}>
            {linkParts.map((subPart, subIndex) => {
              if (subIndex % 3 === 1) {
                const url = linkParts[subIndex + 1];
                return (
                  <a
                    key={subIndex}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80"
                  >
                    {subPart}
                  </a>
                );
              }
              if (subIndex % 3 === 2) return null; // Bỏ phần URL vì đã khớp cùng với text
              return subPart;
            })}
          </span>
        );
      }
      return part;
    });
  };

  const flushList = (key: number) => {
    if (currentList.length > 0) {
      parsedElements.push(
        <ul key={`list-${key}`} className="list-disc pl-5 my-2 space-y-1">
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, index) => {
    // 1. Xử lý khối code
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        // Kết thúc khối code
        parsedElements.push(
          <pre
            key={`code-${index}`}
            className="bg-muted/80 text-muted-foreground p-3 rounded-md font-mono text-xs overflow-x-auto my-3 border border-border"
          >
            <code>{codeBlockLines.join("\n")}</code>
          </pre>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        // Bắt đầu khối code
        flushList(index);
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      return;
    }

    // 2. Xử lý heading
    if (line.startsWith("### ")) {
      flushList(index);
      parsedElements.push(
        <h4 key={`h3-${index}`} className="text-sm font-semibold text-foreground mt-4 mb-2">
          {parseInlineStyles(line.slice(4))}
        </h4>
      );
      return;
    }
    if (line.startsWith("## ")) {
      flushList(index);
      parsedElements.push(
        <h3 key={`h2-${index}`} className="text-base font-semibold text-foreground mt-5 mb-2">
          {parseInlineStyles(line.slice(3))}
        </h3>
      );
      return;
    }
    if (line.startsWith("# ")) {
      flushList(index);
      parsedElements.push(
        <h2 key={`h1-${index}`} className="text-lg font-bold text-foreground mt-6 mb-3">
          {parseInlineStyles(line.slice(2))}
        </h2>
      );
      return;
    }

    // 3. Xử lý danh sách bullet
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const cleanLine = line.trim().slice(2);
      currentList.push(
        <li key={`li-${index}-${cleanLine}`} className="text-sm text-muted-foreground leading-relaxed">
          {parseInlineStyles(cleanLine)}
        </li>
      );
      return;
    }

    // Gặp dòng không phải list thì đẩy list ra
    flushList(index);

    // 4. Xử lý dòng trống
    if (line.trim() === "") {
      parsedElements.push(<div key={`space-${index}`} className="h-2" />);
      return;
    }

    // 5. Xử lý đoạn văn thường
    parsedElements.push(
      <p key={`p-${index}`} className="text-sm text-muted-foreground leading-relaxed my-1">
        {parseInlineStyles(line)}
      </p>
    );
  });

  // Đẩy nốt list còn lại ở cuối
  flushList(lines.length);

  return <div className="space-y-1">{parsedElements}</div>;
}
