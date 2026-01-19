export const parsePageRange = (input, maxPage) => {
  const selected = new Set();
  const parts = input.split(",");

  parts.forEach((part) => {
    const trimmed = part.trim();
    if (!trimmed) return;

    if (trimmed.includes("-")) {
      const [startStr, endStr] = trimmed.split("-");
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.min(start, end);
        const max = Math.max(start, end);

        for (let i = min; i <= max; i++) {
          if (i >= 1 && i <= maxPage) {
            selected.add(i - 1);
          }
        }
      }
    } else {
      const page = parseInt(trimmed, 10);
      if (!isNaN(page) && page >= 1 && page <= maxPage) {
        selected.add(page - 1);
      }
    }
  });

  return Array.from(selected).sort((a, b) => a - b);
};
