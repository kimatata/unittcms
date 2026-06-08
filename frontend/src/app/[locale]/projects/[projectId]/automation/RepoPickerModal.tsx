'use client';
import { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, Input, Chip } from '@heroui/react';
import { Search, Lock } from 'lucide-react';
import { listRepos, RepoItem } from '@/utils/automationConfigControl';

type Messages = {
  pickRepoTitle: string;
  searchReposPlaceholder: string;
  loadingRepos: string;
  noReposFound: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (repo: RepoItem) => void;
  projectId: number;
  service: 'github' | 'gitlab';
  jwt: string;
  messages: Messages;
};

export default function RepoPickerModal({ isOpen, onClose, onSelect, projectId, service, jwt, messages }: Props) {
  const [repos, setRepos] = useState<RepoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setError(null);
    setRepos([]);
    setIsLoading(true);
    listRepos(jwt, projectId, service)
      .then(setRepos)
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [isOpen, service, projectId, jwt]);

  const filtered = repos.filter(
    (r) =>
      r.fullName.toLowerCase().includes(query.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="text-base">{messages.pickRepoTitle}</ModalHeader>
        <ModalBody className="pb-6 flex flex-col gap-3">
          <Input
            placeholder={messages.searchReposPlaceholder}
            value={query}
            onValueChange={setQuery}
            startContent={<Search size={14} />}
            variant="bordered"
            size="sm"
            autoFocus
          />
          {isLoading && (
            <p className="text-sm text-default-400 text-center py-6">{messages.loadingRepos}</p>
          )}
          {error && (
            <p className="text-sm text-danger text-center py-2">{error}</p>
          )}
          {!isLoading && !error && filtered.length === 0 && (
            <p className="text-sm text-default-400 text-center py-6">{messages.noReposFound}</p>
          )}
          {!isLoading && filtered.length > 0 && (
            <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
              {filtered.map((repo) => (
                <button
                  key={repo.id}
                  className="text-left px-3 py-2 rounded-lg hover:bg-default-100 dark:hover:bg-neutral-800 flex items-start gap-2 w-full transition-colors"
                  onClick={() => onSelect(repo)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate">{repo.fullName}</span>
                      {repo.isPrivate && (
                        <Chip size="sm" variant="flat" startContent={<Lock size={10} />}>
                          Private
                        </Chip>
                      )}
                    </div>
                    {repo.description && (
                      <p className="text-xs text-default-400 truncate mt-0.5">{repo.description}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
