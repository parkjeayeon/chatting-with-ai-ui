"use client";

import { type PropsWithChildren, useEffect, useState, type FC } from "react";
import { XIcon, PlusIcon } from "lucide-react";
import {
  AttachmentPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  useAuiState,
  useAui,
} from "@assistant-ui/react";
import { useShallow } from "zustand/shallow";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogTitle, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { useLineCount } from "@/hooks/use-line-count";
import { useFileText } from "@/hooks/use-file-text";
import { cn } from "@/lib/utils";

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const useFileSrc = (file: File | undefined) => {
  const [src, setSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!file) {
      setSrc(undefined);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setSrc(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  return src;
};

const useAttachmentSrc = () => {
  const { file, src } = useAuiState(
    useShallow((s): { file?: File; src?: string } => {
      if (s.attachment.type !== "image") return {};
      if (s.attachment.file) return { file: s.attachment.file };
      const src = s.attachment.content?.filter((c) => c.type === "image")[0]?.image;
      if (!src) return {};
      return { src };
    }),
  );

  return useFileSrc(file) ?? src;
};

type AttachmentPreviewProps = {
  src: string;
};

const AttachmentPreview: FC<AttachmentPreviewProps> = ({ src }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  return (
    <img
      src={src}
      alt="Attachment preview"
      className={cn(
        "block h-auto max-h-[80vh] w-auto max-w-full object-contain",
        isLoaded
          ? "aui-attachment-preview-image-loaded"
          : "aui-attachment-preview-image-loading invisible",
      )}
      onLoad={() => setIsLoaded(true)}
    />
  );
};

const AttachmentPreviewDialog: FC<PropsWithChildren> = ({ children }) => {
  const src = useAttachmentSrc();
  const { name, file } = useAuiState(
    useShallow((s) => ({ name: s.attachment.name, file: s.attachment.file })),
  );

  // 이미지 미리보기
  if (src) {
    return (
      <Dialog>
        <DialogTrigger
          className="aui-attachment-preview-trigger hover:bg-accent/50 cursor-pointer transition-colors"
          asChild
        >
          {children}
        </DialogTrigger>
        <DialogContent className="aui-attachment-preview-dialog-content [&>button]:bg-foreground/60 [&_svg]:text-background [&>button]:hover:[&_svg]:text-destructive p-2 sm:max-w-3xl [&>button]:rounded-full [&>button]:p-1 [&>button]:opacity-100 [&>button]:ring-0!">
          <DialogTitle className="aui-sr-only sr-only">Image Attachment Preview</DialogTitle>
          <div className="aui-attachment-preview bg-background relative mx-auto flex max-h-[80dvh] w-full items-center justify-center overflow-hidden">
            <AttachmentPreview src={src} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // 문서(텍스트/마크다운) 미리보기 — 이미지가 아니고 File 이 있으면
  if (file) {
    return (
      <DocumentPreviewDialog name={name} file={file}>
        {children}
      </DocumentPreviewDialog>
    );
  }

  return children;
};

type DocumentPreviewDialogProps = PropsWithChildren<{ name: string; file: File }>;

const DocumentPreviewDialog: FC<DocumentPreviewDialogProps> = ({ name, file, children }) => {
  const text = useFileText(file);
  const lineCount =
    text == null ? null : text.length === 0 ? 0 : text.replace(/\n$/, "").split("\n").length;

  return (
    <Dialog>
      <DialogTrigger
        className="aui-attachment-preview-trigger hover:bg-accent/50 cursor-pointer transition-colors"
        asChild
      >
        {children}
      </DialogTrigger>
      <DialogContent className="aui-attachment-document-dialog-content flex max-h-[85dvh] flex-col gap-0 p-0 sm:max-w-3xl">
        <div className="flex flex-col gap-1 px-6 pt-5 pb-3">
          <DialogTitle className="truncate text-lg font-semibold">{name}</DialogTitle>
          <div className="text-muted-foreground text-xs">
            {formatBytes(file.size)}
            {lineCount != null && ` · ${lineCount} lines`}
            {" · Formatting may be inconsistent from source"}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-4 pb-4">
          <pre className="bg-muted/40 text-foreground/90 overflow-auto rounded-lg p-4 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap">
            {text ?? "불러오는 중…"}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AttachmentThumb: FC = () => {
  const src = useAttachmentSrc();
  const { name, file } = useAuiState(
    useShallow((s) => ({ name: s.attachment.name, file: s.attachment.file })),
  );
  const lineCount = useLineCount(file);
  const ext = name?.includes(".") ? name.split(".").pop()!.toUpperCase() : undefined;

  return (
    <Avatar className="aui-attachment-tile-avatar h-full w-full rounded-none">
      <AvatarImage
        src={src}
        alt="Attachment preview"
        className="aui-attachment-tile-image object-cover"
      />
      {/* 이미지가 아니면 파일 카드: 파일명 · 라인 수 · 확장자 뱃지 */}
      <AvatarFallback className="rounded-none">
        <div className="flex h-full w-full flex-col justify-between p-2.5 text-left">
          <div className="min-h-0">
            <div className="text-foreground line-clamp-3 text-xs font-medium break-all">{name}</div>
            <AttachmentThumbLineCnt lineCount={lineCount} />
          </div>
          <AttachmentThumbExt ext={ext} />
        </div>
      </AvatarFallback>
    </Avatar>
  );
};

function AttachmentThumbLineCnt({ lineCount }: { lineCount: number | null }) {
  if (!lineCount) return null;
  return <div className="text-muted-foreground mt-1 text-[11px]">{lineCount} lines</div>;
}

function AttachmentThumbExt({ ext }: { ext?: string }) {
  if (!ext) return null;
  return (
    <span className="text-muted-foreground border-border/60 inline-flex w-fit items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium">
      {ext}
    </span>
  );
}

const AttachmentUI: FC = () => {
  const aui = useAui();
  const isComposer = aui.attachment.source !== "message";

  const isImage = useAuiState((s) => s.attachment.type === "image");
  const typeLabel = useAuiState((s) => {
    const type = s.attachment.type;
    switch (type) {
      case "image":
        return "Image";
      case "document":
        return "Document";
      case "file":
        return "File";
      default:
        return type;
    }
  });

  return (
    <Tooltip>
      <AttachmentPrimitive.Root
        className={cn(
          "aui-attachment-root relative",
          isImage && !isComposer && "aui-attachment-root-message only:*:first:size-24",
        )}
      >
        <AttachmentPreviewDialog>
          <TooltipTrigger asChild>
            <div
              className="aui-attachment-tile bg-muted size-32 cursor-pointer overflow-hidden rounded-[calc(var(--composer-radius)-var(--composer-padding))] border transition-opacity hover:opacity-75"
              role="button"
              tabIndex={0}
              aria-label={`${typeLabel} attachment`}
            >
              <AttachmentThumb />
            </div>
          </TooltipTrigger>
        </AttachmentPreviewDialog>
        {isComposer && <AttachmentRemove />}
      </AttachmentPrimitive.Root>
      <TooltipContent side="top">
        <AttachmentPrimitive.Name />
      </TooltipContent>
    </Tooltip>
  );
};

const AttachmentRemove: FC = () => {
  return (
    <AttachmentPrimitive.Remove asChild>
      <TooltipIconButton
        tooltip="Remove file"
        className="aui-attachment-tile-remove text-muted-foreground hover:[&_svg]:text-destructive absolute end-1.5 top-1.5 size-3.5 rounded-full bg-white opacity-100 shadow-sm hover:bg-white! [&_svg]:text-black"
        side="top"
      >
        <XIcon className="aui-attachment-remove-icon size-3 dark:stroke-[2.5px]" />
      </TooltipIconButton>
    </AttachmentPrimitive.Remove>
  );
};

export const UserMessageAttachments: FC = () => {
  return (
    <div className="aui-user-message-attachments-end col-span-full col-start-1 row-start-1 flex w-full flex-row justify-end gap-2">
      <MessagePrimitive.Attachments>{() => <AttachmentUI />}</MessagePrimitive.Attachments>
    </div>
  );
};

export const ComposerAttachments: FC = () => {
  return (
    <div className="aui-composer-attachments flex w-full flex-row items-center gap-2 overflow-x-auto empty:hidden">
      <ComposerPrimitive.Attachments>{() => <AttachmentUI />}</ComposerPrimitive.Attachments>
    </div>
  );
};

export const ComposerAddAttachment: FC = () => {
  return (
    <ComposerPrimitive.AddAttachment asChild>
      <TooltipIconButton
        tooltip="Add Attachment"
        side="bottom"
        variant="ghost"
        size="icon"
        className="aui-composer-add-attachment hover:bg-muted-foreground/15 dark:border-muted-foreground/15 dark:hover:bg-muted-foreground/30 size-7 rounded-full p-1 text-xs font-semibold"
        aria-label="Add Attachment"
      >
        <PlusIcon className="aui-attachment-add-icon size-4.5 stroke-[1.5px]" />
      </TooltipIconButton>
    </ComposerPrimitive.AddAttachment>
  );
};
