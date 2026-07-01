import type {
  AttachmentAdapter,
  CompleteAttachment,
  PendingAttachment,
} from "@assistant-ui/react";
import { API_ORIGIN } from "@/lib/api";

// 파일을 서버로 올리고 참조(fileId)를 받는다.
async function uploadFile(file: File): Promise<{ fileId: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_ORIGIN}/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`업로드 실패: ${res.status}`);
  return res.json();
}

// 이미지·텍스트가 아닌 임의 파일(zip, pdf 등)을 받는 와일드카드 어댑터.
// CompositeAttachmentAdapter 에서 "반드시 마지막"에 두어야 한다(accept="*").
//
// 전략: 첨부하는 순간 서버로 업로드하고, 채팅 메시지엔 참조(fileId)만 실어 보낸다.
// (바이너리를 base64 로 JSON 에 넣지 않음 → 부풀림/라운드트립 없음)
export class GenericFileAttachmentAdapter implements AttachmentAdapter {
  public accept = "*";

  public async add({ file }: { file: File }): Promise<PendingAttachment> {
    const { fileId } = await uploadFile(file); // ← 첨부 즉시 업로드
    return {
      id: fileId, // 참조값
      type: "file",
      name: file.name,
      contentType: file.type,
      file, // 로컬 미리보기/다운로드용
      status: { type: "requires-action", reason: "composer-send" },
    };
  }

  public async send(attachment: PendingAttachment): Promise<CompleteAttachment> {
    // 참조만 전송 (transport 는 text 파트만 통과시키므로 작은 참조 텍스트로)
    return {
      ...attachment,
      status: { type: "complete" },
      content: [
        { type: "text", text: `<file id=${attachment.id} name=${attachment.name}/>` },
      ],
    };
  }

  public async remove() {
    // noop (업로드 파일 정리는 서버 GC 몫)
  }
}
