import { useEffect, useState } from "react";

// 텍스트/마크다운 파일의 라인 수 (File 내용을 읽어 계산).
// 마지막 개행은 라인으로 세지 않는다.
export const useLineCount = (file: File | undefined) => {
  const [lines, setLines] = useState<number | null>(null);

  useEffect(() => {
    if (!file) {
      setLines(null);
      return;
    }
    let cancelled = false;
    file
      .text()
      .then((text) => {
        if (cancelled) return;
        const count = text.length === 0 ? 0 : text.replace(/\n$/, "").split("\n").length;
        setLines(count);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [file]);

  return lines;
};
