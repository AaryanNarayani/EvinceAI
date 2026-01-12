import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../Redux/store";
import { setPrompt } from "../../Redux/PromptSlice";

interface PromptBarProps {
  focused: boolean;
  onSubmit: () => void;
}

function PromptBar({ focused, onSubmit }: PromptBarProps) {
  const prompt = useSelector((state : RootState) => state.Prompts.prompt);
  const dispatch = useDispatch();

  const [value, setValue] = useState("");
  const spanRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputWidth, setInputWidth] = useState(200);

  useEffect(() => {
    if (spanRef.current) {
      const spanWidth = spanRef.current.offsetWidth + 20;
      setInputWidth(Math.min(Math.max(spanWidth, 200), 400));
    }
  }, [value]);

  useEffect(() => {
    if (focused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [focused]);

  console.log(prompt)

  return (
    <motion.div
      initial={false}
      animate={focused ? { y: 0, opacity: 1 } : { y: 80, opacity: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 10 }}
      className="overflow-hidden"
    >
      <form
        className="bg-black/60 text-white flex items-center gap-2 px-4 py-3 rounded-full mb-4 backdrop-blur-2xl"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
          dispatch(setPrompt(value));
          setValue("");
        }}
      >
        <div className="relative">
          <span
            ref={spanRef}
            className="absolute top-0 left-0 invisible whitespace-pre text-base"
          >
            {value || " "}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            style={{
              width: `${inputWidth}px`,
              transition: "width 0.2s ease",
            }}
            className="bg-transparent outline-none text-base"
            placeholder="Type something..."
          />
        </div>
        <button type="submit" className="rotate-45 cursor-pointer">
          <Send />
        </button>
      </form>
    </motion.div>
  );
}

export default PromptBar;
