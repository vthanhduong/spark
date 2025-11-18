import type { CodeToHtmlOptions } from "@llm-ui/code";
import {
  codeBlockLookBack,
  findCompleteCodeBlock,
  findPartialCodeBlock,
  loadHighlighter,
  useCodeBlockToHtml,
  allLangs,
  allLangsAlias,
} from "@llm-ui/code";
import { markdownLookBack } from "@llm-ui/markdown";
import { useLLMOutput, type LLMOutputComponent } from "@llm-ui/react";
import parseHtml from "html-react-parser";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getHighlighterCore } from "shiki/core";
import { bundledThemes } from "shiki/themes";
import { bundledLanguagesInfo } from "shiki/langs";
import getWasm from "shiki/wasm";
import "./LLMMessageRenderer.css";
import { useState, useMemo, memo } from "react";

// -------Step 1: Create a markdown component-------
const MarkdownComponent: LLMOutputComponent = memo(({ blockMatch }) => {
  const markdown = blockMatch.output;
  return (
    <div className="markdown-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
});
MarkdownComponent.displayName = 'MarkdownComponent';

// -------Step 2: Create a code block component-------
const highlighter = loadHighlighter(
  getHighlighterCore({
    langs: allLangs(bundledLanguagesInfo),
    langAlias: allLangsAlias(bundledLanguagesInfo),
    themes: Object.values(bundledThemes),
    loadWasm: getWasm,
  }),
);

const codeToHtmlOptions: CodeToHtmlOptions = {
  theme: "github-dark",
};

const CodeBlock: LLMOutputComponent = memo(({ blockMatch }) => {
  const [copied, setCopied] = useState(false);
  const { html, code } = useCodeBlockToHtml({
    markdownCodeBlock: blockMatch.output,
    highlighter,
    codeToHtmlOptions,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
});
CodeBlock.displayName = 'CodeBlock';

// -------Step 3: LLM Message Renderer Component-------
interface LLMMessageRendererProps {
  content: string;
  isStreaming?: boolean;
}

export const LLMMessageRenderer = memo(({ content, isStreaming = false }: LLMMessageRendererProps) => {
  const blocks = useMemo(() => [
    {
      component: CodeBlock,
      findCompleteMatch: findCompleteCodeBlock(),
      findPartialMatch: findPartialCodeBlock(),
      lookBack: codeBlockLookBack(),
    },
  ], []);

  const fallbackBlock = useMemo(() => ({
    component: MarkdownComponent,
    lookBack: markdownLookBack(),
  }), []);

  const { blockMatches } = useLLMOutput({
    llmOutput: content,
    fallbackBlock,
    blocks,
    isStreamFinished: !isStreaming,
  });

  return (
    <>
      {blockMatches.map((blockMatch, index) => {
        const Component = blockMatch.block.component;
        return <Component key={index} blockMatch={blockMatch} />;
      })}
    </>
  );
});
LLMMessageRenderer.displayName = 'LLMMessageRenderer';
