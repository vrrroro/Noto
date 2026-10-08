import { useEffect, useState } from 'react';

// Types a word, holds it, erases it, then types the next one. When `enabled`
// is false (reduced motion) it simply shows the first word.
export function useTyper(words, { typeMs = 70, eraseMs = 35, holdMs = 1800, startMs = 400, shuffle = false, enabled = true } = {}) {
  const [text, setText] = useState(enabled ? '' : words[0]);

  useEffect(() => {
    if (!enabled) {
      setText(words[0]);
      return undefined;
    }
    let index = 0;
    let shown = '';
    let erasing = false;
    let timer;

    const nextIndex = () => {
      if (!shuffle) return (index + 1) % words.length;
      let next = index;
      while (words.length > 1 && next === index) next = Math.floor(Math.random() * words.length);
      return next;
    };

    const tick = () => {
      const word = words[index];
      if (!erasing && shown.length < word.length) {
        shown = word.slice(0, shown.length + 1);
        setText(shown);
        timer = setTimeout(tick, typeMs);
      } else if (!erasing) {
        erasing = true;
        timer = setTimeout(tick, holdMs);
      } else if (shown.length > 0) {
        shown = shown.slice(0, -1);
        setText(shown);
        timer = setTimeout(tick, eraseMs);
      } else {
        erasing = false;
        index = nextIndex();
        timer = setTimeout(tick, typeMs * 3);
      }
    };

    timer = setTimeout(tick, startMs);
    return () => clearTimeout(timer);
  }, [words, typeMs, eraseMs, holdMs, startMs, shuffle, enabled]);

  return text;
}
