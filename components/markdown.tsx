import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

const components: Components = {
  h1: ({ node: _node, ...props }) => <h1 className="mt-4 mb-2 text-xl font-bold first:mt-0" {...props} />,
  h2: ({ node: _node, ...props }) => <h2 className="mt-4 mb-2 text-lg font-semibold first:mt-0" {...props} />,
  h3: ({ node: _node, ...props }) => <h3 className="mt-3 mb-1.5 text-base font-semibold first:mt-0" {...props} />,
  h4: ({ node: _node, ...props }) => <h4 className="mt-3 mb-1 font-semibold first:mt-0" {...props} />,
  p: ({ node: _node, ...props }) => <p className="my-2 leading-relaxed first:mt-0 last:mb-0" {...props} />,
  ul: ({ node: _node, ...props }) => <ul className="my-2 list-disc space-y-1 pl-5" {...props} />,
  ol: ({ node: _node, ...props }) => <ol className="my-2 list-decimal space-y-1 pl-5" {...props} />,
  blockquote: ({ node: _node, ...props }) => (
    <blockquote className="my-2 border-l-2 border-border pl-3 text-muted-foreground" {...props} />
  ),
  a: ({ node: _node, ...props }) => (
    <a className="font-medium text-primary underline underline-offset-2" target="_blank" rel="noopener noreferrer nofollow" {...props} />
  ),
  code: ({ node: _node, className, ...props }) => (
    <code className={cn("rounded bg-background/60 px-1 py-0.5 font-mono text-[0.85em]", className)} {...props} />
  ),
  pre: ({ node: _node, ...props }) => <pre className="my-2 overflow-x-auto rounded-md bg-background/60 p-3 text-xs" {...props} />,
  hr: () => <hr className="my-4 border-border" />,
  table: ({ node: _node, ...props }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm" {...props} />
    </div>
  ),
  th: ({ node: _node, ...props }) => <th className="border border-border bg-background/60 px-2 py-1 font-semibold" {...props} />,
  td: ({ node: _node, ...props }) => <td className="border border-border px-2 py-1 align-top" {...props} />,
};

/**
 * Renders AI output as formatted Markdown (GFM: headings, lists, tables).
 * Raw HTML is never rendered (it is shown as escaped text) and images are not loaded;
 * react-markdown's default URL transform strips unsafe link protocols such as javascript:.
 */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("break-words text-sm", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        disallowedElements={["img"]}
        unwrapDisallowed
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
