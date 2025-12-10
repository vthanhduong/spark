import type { CodeToHtmlOptions } from "@llm-ui/code";
import {
  codeBlockLookBack,
  findCompleteCodeBlock,
  findPartialCodeBlock,
  loadHighlighter,
  useCodeBlockToHtml,
} from "@llm-ui/code";
import { markdownLookBack } from "@llm-ui/markdown";
import { throttleBasic, useLLMOutput, type LLMOutputComponent } from "@llm-ui/react";
import parseHtml from "html-react-parser";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createHighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";
import "./LLMMessageRenderer.css";
import { useState, memo, useEffect, useRef } from "react";

// Load common languages to improve code block rendering
import javascript from "shiki/langs/javascript.mjs";
import typescript from "shiki/langs/typescript.mjs";
import python from "shiki/langs/python.mjs";
import jsx from "shiki/langs/jsx.mjs";
import tsx from "shiki/langs/tsx.mjs";
import css from "shiki/langs/css.mjs";
import html from "shiki/langs/html.mjs";
import json from "shiki/langs/json.mjs";
import markdown from "shiki/langs/markdown.mjs";
import bash from "shiki/langs/bash.mjs";
import cpp from "shiki/langs/cpp.mjs";

import githubDark from "shiki/themes/github-dark.mjs";

// -------Step 1: Create a markdown component-------
const MarkdownComponent: LLMOutputComponent = ({ blockMatch }) => {
  const markdown = blockMatch.output;
  return (
    <div className="markdown-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
};

// -------Step 2: Create a code block component (optimized)-------
const highlighter = loadHighlighter(
  createHighlighterCore({
    langs: [
      javascript,
      typescript,
      python,
      jsx,
      tsx,
      css,
      html,
      json,
      markdown,
      bash,
      cpp,
    ],
    themes: [githubDark],
    engine: createOnigurumaEngine(import('shiki/wasm')),
  }),
);

const codeToHtmlOptions: CodeToHtmlOptions = {
  theme: "github-dark",
};

const CodeBlock: LLMOutputComponent = ({ blockMatch }) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { html, code } = useCodeBlockToHtml({
    markdownCodeBlock: blockMatch.output,
    highlighter,
    codeToHtmlOptions,
  });

  // Cleanup timeout on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      // Clear existing timeout to prevent memory leak
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Store new timeout
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
        timeoutRef.current = null;
      }, 2000);
    });
  };
  
  if (!html) {
    return (
      <div className="code-block-container relative">
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs transition-colors"
        >
          {copied ? "✓ Copied!" : "Copy"}
        </button>
        <pre className="shiki bg-gray-800 p-4 rounded-lg overflow-x-auto">
          <code className="text-sm">{code}</code>
        </pre>
      </div>
    );
  }
  
  return (
    <div className="code-block-container relative">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs transition-colors z-10"
      >
        {copied ? "✓ Copied!" : "Copy"}
      </button>
      <div className="code-block-wrapper">{parseHtml(html)}</div>
    </div>
  );
};

// -------Step 3: LLM Message Renderer Component-------
interface LLMMessageRendererProps {
  content: string;
  isStreaming?: boolean;
}

const throttle = throttleBasic({
  readAheadChars: 10,
  targetBufferChars: 7,
  adjustPercentage: 0.35,
  frameLookBackMs: 10000,
  windowLookBackMs: 2000,
});

const LLMMessageRendererComponent = ({ content, isStreaming = false }: LLMMessageRendererProps) => {
  const { blockMatches } = useLLMOutput({
    llmOutput: content,
    fallbackBlock: {
      component: MarkdownComponent,
      lookBack: markdownLookBack(),
    },
    blocks: [
      {
        component: CodeBlock,
        findCompleteMatch: findCompleteCodeBlock(),
        findPartialMatch: findPartialCodeBlock(),
        lookBack: codeBlockLookBack(),
      },
    ],
    isStreamFinished: !isStreaming,
    throttle
  });

  return (
    <div className="llm-output">
      {blockMatches.map((blockMatch, index) => {
        const Component = blockMatch.block.component;
        return <Component key={index} blockMatch={blockMatch} />;
      })}
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export const LLMMessageRenderer = memo(LLMMessageRendererComponent);
