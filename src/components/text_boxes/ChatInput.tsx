import React, { useEffect, forwardRef } from "react";
import { RootState } from "../../Redux/store";
import { useDispatch, useSelector } from "react-redux";
import { setPrompt } from "../../Redux/PromptSlice";

interface ChatInputProps {
  className?: string;
  onSubmit: () => void;
}

const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({ className, onSubmit }, ref) => {
    const prompt = useSelector((state : RootState) => state.Prompts.prompt);
    const dispatch = useDispatch();

    useEffect(() => {
      if (!ref || !(ref as React.RefObject<HTMLTextAreaElement>).current) return;
      const textarea = (ref as React.RefObject<HTMLTextAreaElement>).current;
      
      const adjustHeight = () => {
        if (textarea) {
          textarea.style.height = "auto";
          textarea.style.height = `${textarea.scrollHeight}px`;
        }
      };
      
      adjustHeight();
      textarea?.addEventListener("input", adjustHeight);
      return () => textarea?.removeEventListener("input", adjustHeight);
    }, [ref]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault(); // Prevent new line
        onSubmit();
      }
    };

    return (
      <textarea
        ref={ref}
        className={className}
        placeholder="Say Smtg !!"
        value={prompt}
        rows={1}
        style={{
          resize: "none",
          overflow: "hidden",
          minHeight: "40px",
          maxHeight: "200px",
        }}
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = "auto";
          target.style.height = `${target.scrollHeight}px`;
          dispatch(setPrompt(target.value))
        }}
        onKeyDown={handleKeyDown}
      />
    );
  }
);

export default ChatInput;