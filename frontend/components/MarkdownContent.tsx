import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Props = {
  label: string;
  content: string;
};

export default function MarkdownContent({ label, content }: Props) {
  return (
    <div>
      <p className="text-small font-medium text-default-500 mb-1">{label}</p>
      <div className="min-h-[60px] w-full rounded-medium bg-default-100 px-3 py-2 text-sm">
        {content ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : (
          <span className="text-default-400">-</span>
        )}
      </div>
    </div>
  );
}
