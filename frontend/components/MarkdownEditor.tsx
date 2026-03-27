'use client';
import { useState } from 'react';
import { Tabs, Tab, Textarea } from '@heroui/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Props = {
  label: string;
  value: string;
  placeholder?: string;
  isDisabled?: boolean;
  className?: string;
  onValueChange: (value: string) => void;
};

export default function MarkdownEditor({ label, value, placeholder, isDisabled, className, onValueChange }: Props) {
  const [selectedTab, setSelectedTab] = useState<string>('write');

  return (
    <div className={`mt-3 ${className ?? ''}`}>
      <p className="text-small text-default-500 mb-1">{label}</p>
      <Tabs
        size="sm"
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(String(key))}
        classNames={{ tabList: 'mb-1' }}
      >
        <Tab key="write" title="Write">
          <Textarea
            size="sm"
            variant="bordered"
            placeholder={placeholder}
            value={value}
            isDisabled={isDisabled}
            minRows={4}
            onValueChange={onValueChange}
          />
        </Tab>
        <Tab key="preview" title="Preview">
          <div className="min-h-[96px] w-full rounded-medium border-2 border-default-200 px-3 py-2 text-sm">
            {value ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
              </div>
            ) : (
              <span className="text-default-400 italic">Nothing to preview</span>
            )}
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
