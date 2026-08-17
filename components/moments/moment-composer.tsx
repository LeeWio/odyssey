import { useState, useCallback } from "react";
import Image from "next/image";
import {
  Avatar,
  Button,
  Description,
  Dropdown,
  Label,
  Modal,
  TextArea,
  ScrollShadow,
  ProgressCircle,
  Spinner,
} from "@heroui/react";
import { DropZone, useDropZonePickerContext } from "@heroui-pro/react";
import type { DropZoneProps } from "react-aria-components";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "motion/react";
import { useAppSelector } from "@/lib/hooks";
import { selectCurrentUser, selectIsAuthenticated } from "@/lib/features/auth";
import { useGetCurrentUserQuery } from "@/lib/features/user/user-api";
import { useCreateMomentMutation } from "@/lib/features/moment/moment-api";
import { useUploadFileMutation } from "@/lib/features/file/file-api";
import { ComposerTool, ComposerToolProps } from "./composer-tool";

// ==========================================
// 1. ComposerHeader: 头部（用户信息 + 权限选择）
// ==========================================
interface ComposerHeaderProps {
  visibility: string;
  onVisibilityChange: (value: string) => void;
  user: {
    avatar?: string | null;
    nickname?: string | null;
    username?: string | null;
  } | null;
}

const ComposerHeader = ({ visibility, onVisibilityChange, user }: ComposerHeaderProps) => {
  const displayName = user?.nickname || user?.username || "John Doe";
  const avatarUrl = user?.avatar || null;
  const fallbackInitial = (user?.username || displayName).charAt(0).toUpperCase();

  return (
    <Modal.Header className="flex flex-row items-center justify-between">
      <div className="flex flex-row items-center gap-3">
        <Avatar>
          {avatarUrl && <Avatar.Image alt={displayName} src={avatarUrl} />}
          <Avatar.Fallback>{fallbackInitial}</Avatar.Fallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-foreground text-sm font-medium">{displayName}</span>
          <span className="text-muted text-xs">Share a moment...</span>
        </div>
      </div>

      <Dropdown>
        <Button size="sm" aria-label="Visibility" variant="outline">
          <Icon
            icon={visibility === "private" ? "gravity-ui:lock" : "gravity-ui:globe"}
            className="size-4"
          />
          <span className="capitalize">{visibility}</span>
          <Icon icon="gravity-ui:chevron-down" className="text-muted size-4" />
        </Button>
        <Dropdown.Popover>
          <Dropdown.Menu
            selectionMode="single"
            selectedKeys={new Set([visibility])}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              if (selected) onVisibilityChange(selected);
            }}
          >
            <Dropdown.Item id="public" textValue="Public">
              <Icon icon="gravity-ui:globe" className="size-4" />
              <div className="flex flex-col">
                <Label>Public</Label>
                <Description>Anyone can see this moment</Description>
              </div>
            </Dropdown.Item>
            <Dropdown.Item id="followers" textValue="Followers">
              <Icon icon="gravity-ui:persons" className="size-4" />
              <div className="flex flex-col">
                <Label>Followers</Label>
                <Description>Only your followers can see this moment</Description>
              </div>
            </Dropdown.Item>
            <Dropdown.Item id="private" textValue="Private">
              <Icon icon="gravity-ui:lock" className="size-4" />
              <div className="flex flex-col">
                <Label>Private</Label>
                <Description>Only you can see this moment</Description>
              </div>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </Modal.Header>
  );
};

// ==========================================
// 2. ContentInput: 文本输入区 (无边框自适应)
// ==========================================
interface ContentInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  minLength?: number;
}

const ContentInput = ({ value, onChange, maxLength, minLength }: ContentInputProps) => {
  return (
    <TextArea
      fullWidth
      aria-label="Moment content"
      placeholder="What's happening?"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      variant="secondary"
      rows={8}
      maxLength={maxLength}
      minLength={minLength}
      className="min-h-20 w-full resize-none border-none bg-transparent focus:ring-0 focus:outline-none"
    />
  );
};

// ==========================================
// 3. AttachmentPreview: 智能自适应非对称相册 (触控友好 + 边缘内描边)
// ==========================================
interface AttachmentPreviewProps {
  attachments: string[];
  onRemove: (index: number) => void;
}

const AttachmentPreview = ({ attachments, onRemove }: AttachmentPreviewProps) => {
  if (attachments.length === 0) return null;

  return (
    <ScrollShadow
      hideScrollBar
      variant="fade"
      className="flex w-full flex-row gap-3"
      orientation="horizontal"
    >
      <AnimatePresence mode="popLayout">
        {attachments.map((url, index) => (
          <motion.div
            key={url}
            layout
            initial={{ opacity: 0, scale: 0.85, x: 15 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.85, x: -15 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
            className="group border-separator/30 bg-surface-secondary relative size-20 min-w-20 overflow-hidden rounded-xl border"
          >
            <Image
              src={url}
              alt={`Attachment ${index + 1}`}
              width={80}
              height={80}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />

            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              className="hover:bg-danger absolute top-1 right-1 z-20 size-5 min-w-1.25 opacity-90 transition-all duration-200 hover:text-white active:scale-90 md:opacity-0 md:group-hover:opacity-100"
              onPress={() => onRemove(index)}
              aria-label="Remove image"
            >
              <Icon icon="gravity-ui:xmark" className="size-2.5" />
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>
    </ScrollShadow>
  );
};

// ==========================================
// 4. ComposerToolbar: 底部工具栏
// ==========================================
interface ComposerToolbarProps {
  onAction: (actionId: string) => void;
}

const ComposerToolbar = ({ onAction }: ComposerToolbarProps) => {
  const { openFilePicker } = useDropZonePickerContext();

  const tools: ComposerToolProps[] = [
    { id: "image", icon: "gravity-ui:picture", label: "Image" },
    { id: "video", icon: "gravity-ui:video", label: "Video" },
    { id: "poll", icon: "gravity-ui:seal-check", label: "Poll" },
    { id: "emoji", icon: "gravity-ui:face-smile", label: "Emoji" },
    { id: "topic", icon: "gravity-ui:hashtag", label: "Topic" },
    { id: "location", icon: "gravity-ui:map-pin", label: "Location" },
  ];

  return (
    <ScrollShadow
      hideScrollBar
      variant="fade"
      className="flex flex-row gap-3"
      orientation="horizontal"
    >
      {tools.map((tool) => (
        <ComposerTool
          key={tool.id}
          {...tool}
          onClick={() => {
            if (tool.id === "image") {
              openFilePicker();
            } else {
              onAction(tool.id);
            }
          }}
        />
      ))}
    </ScrollShadow>
  );
};

type DropEvent = Parameters<NonNullable<DropZoneProps["onDrop"]>>[0];

interface MomentComposerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

// ==========================================
// 主组件: MomentComposer (状态与布局容器)
// ==========================================
export const MomentComposer = ({ isOpen, onOpenChange }: MomentComposerProps) => {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<{ file: File; preview: string }[]>([]);
  const [visibility, setVisibility] = useState("public");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createMoment] = useCreateMomentMutation();
  const [uploadFile] = useUploadFileMutation();

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const username = useAppSelector(selectCurrentUser);
  const { data: currentUser } = useGetCurrentUserQuery(undefined, {
    skip: !isAuthenticated,
  });

  const userProfile = isAuthenticated
    ? {
        avatar: currentUser?.avatar,
        nickname: currentUser?.nickname,
        username: username,
      }
    : null;

  const handleSelectFiles = (fileList: FileList) => {
    const newAttachments = Array.from(fileList).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleDrop = useCallback(async (e: DropEvent) => {
    const dropped: File[] = [];

    for (const item of e.items) {
      if (item.kind === "file" && item.getFile) {
        dropped.push(await item.getFile());
      }
    }
    const newAttachments = dropped.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
  }, []);

  const handleToolAction = (actionId: string) => {
    console.log(`Tool clicked: ${actionId}`);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => {
      const removed = prev[index];
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const charCount = content.length;
  const percentage = Math.min((charCount / 280) * 100, 100);
  const charColor = charCount < 240 ? "accent" : charCount < 280 ? "warning" : "danger";
  const isSubmitDisabled =
    (!content.trim() && attachments.length === 0) || charCount > 280 || isSubmitting;

  const handleShare = async () => {
    if (isSubmitDisabled) return;
    setIsSubmitting(true);
    try {
      // 1. Upload images in parallel if any
      const uploadedImages = await Promise.all(
        attachments.map(async ({ file }) => {
          const res = await uploadFile(file).unwrap();
          if (!res.id) throw new Error("Uploaded file is missing an ID.");
          return {
            fileId: res.id,
            altText: file.name || "Moment Attachment",
          };
        })
      );

      // 2. Submit the moment
      await createMoment({
        content,
        visibility: visibility as "public" | "followers" | "private",
        images: uploadedImages,
      }).unwrap();

      // 3. Clear state & close composer on success
      attachments.forEach((a) => URL.revokeObjectURL(a.preview));
      setContent("");
      setAttachments([]);
      setVisibility("public");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to share moment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
        <Modal.Container size="lg">
          <Modal.Dialog>
            <DropZone className="w-full border-none bg-transparent p-0 shadow-none">
              <ComposerHeader
                visibility={visibility}
                onVisibilityChange={setVisibility}
                user={userProfile}
              />

              <Modal.Body className="flex flex-col gap-2">
                <DropZone.Area
                  onDrop={handleDrop}
                  className="flex w-full flex-col gap-2 border-none bg-transparent p-0 outline-none"
                >
                  <ContentInput value={content} onChange={setContent} maxLength={2000} />
                  <AttachmentPreview
                    attachments={attachments.map((a) => a.preview)}
                    onRemove={handleRemoveAttachment}
                  />
                </DropZone.Area>
                <ComposerToolbar onAction={handleToolAction} />
              </Modal.Body>

              <Modal.Footer className="flex flex-row items-center justify-between">
                {/* 左侧圆圈区域：采用 flex-1 撑满剩余空间，当圆圈隐藏时，div 依然存在，保证右侧 Button 永不跳变移位 */}
                <div className="flex flex-1 flex-row items-center justify-start">
                  <AnimatePresence>
                    {charCount > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.6, x: -5 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.6, x: -5 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 26,
                        }}
                        className="flex flex-row items-center gap-2"
                      >
                        <ProgressCircle
                          aria-label="Character limit"
                          size="sm"
                          value={percentage}
                          color={charColor}
                          className="size-5"
                        >
                          <ProgressCircle.Track strokeWidth={3}>
                            <ProgressCircle.TrackCircle strokeWidth={3} />
                            <ProgressCircle.FillCircle strokeWidth={3} strokeLinecap="round" />
                          </ProgressCircle.Track>
                        </ProgressCircle>
                        {charCount >= 240 && (
                          <span
                            className={`font-mono text-xs font-medium ${
                              charCount >= 280 ? "text-danger" : "text-warning"
                            }`}
                          >
                            {280 - charCount}
                          </span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 右侧 Share 按钮区域 */}
                <Button
                  variant="tertiary"
                  onPress={handleShare}
                  isDisabled={isSubmitDisabled}
                  size="sm"
                >
                  {isSubmitting ? (
                    <Spinner size="sm" color="current" className="mr-1.5" />
                  ) : (
                    <Icon icon="gravity-ui:location-arrow-fill" className="size-4" />
                  )}
                  {isSubmitting ? "Sharing..." : "Share"}
                </Button>
              </Modal.Footer>
              <DropZone.Input accept="image/*" multiple onSelect={handleSelectFiles} />
            </DropZone>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};
