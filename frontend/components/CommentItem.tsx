import { Button, Textarea, Card, CardBody } from '@heroui/react';
import { Trash2, Edit2 } from 'lucide-react';
import UserAvatar from './UserAvatar';
import { CommentMessages, CommentType } from '@/types/comment';

type Props = {
  comment: CommentType;
  isEditing: boolean;
  canEdit: boolean;
  editContent: string;
  isSubmitting: boolean;
  messages: CommentMessages;
  onEditContentChange: (value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
};

export default function CommentItem({
  comment,
  isEditing,
  canEdit,
  editContent,
  isSubmitting,
  messages,
  onEditContentChange,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: Props) {
  return (
    <Card shadow="sm">
      <CardBody>
        <div className="flex items-start gap-3">
          <UserAvatar username={comment.User.username} size={24} />
          <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-semibold text-sm">{comment.User.username}</span>
                <span className="text-xs text-default-400 ml-2">{new Date(comment.createdAt).toLocaleString()}</span>
              </div>
              {canEdit && (
                <div className="flex gap-2">
                  <Button
                    aria-label="Edit Comment"
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={onStartEdit}
                    isDisabled={isSubmitting}
                  >
                    <Edit2 size={16} />
                  </Button>
                  <Button
                    aria-label="Delete Comment"
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={onDelete}
                    isDisabled={isSubmitting}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              )}
            </div>
            {isEditing ? (
              <div>
                <Textarea
                  value={editContent}
                  onValueChange={onEditContentChange}
                  minRows={3}
                  isDisabled={isSubmitting}
                />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" color="primary" onPress={onSave} isLoading={isSubmitting}>
                    {messages.save}
                  </Button>
                  <Button size="sm" variant="bordered" onPress={onCancelEdit} isDisabled={isSubmitting}>
                    {messages.cancel}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
