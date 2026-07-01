// 백엔드 오리진 (NEXT_PUBLIC_API_URL 의 /assistant 를 떼어냄)
export const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/assistant"
).replace(/\/assistant\/?$/, "");

// 업로드된 파일 다운로드 URL
export const fileUrl = (fileId: string) => `${API_ORIGIN}/files/${fileId}`;
