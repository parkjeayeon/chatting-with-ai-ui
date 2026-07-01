import { useEffect, useState } from "react";

// File 의 텍스트 내용을 읽어 반환 (텍스트/마크다운 미리보기용).
export const useFileText = (file: File | undefined) => {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setText(null);
      return;
    }
    let cancelled = false;
    file
      .text()
      .then((t) => {
        if (!cancelled) setText(t);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [file]);

  return text;
};
