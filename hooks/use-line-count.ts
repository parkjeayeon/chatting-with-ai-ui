import { useEffect, useState } from "react";

// 텍스트의 라인 수 (마지막 개행은 세지 않음)
export const countLines = (text: string) =>
  text.length === 0 ? 0 : text.replace(/\n$/, "").split("\n").length;

// File 을 읽어 라인 수 계산 (file 이 없으면 null)
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
        if (!cancelled) setLines(countLines(text));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [file]);

  return lines;
};
