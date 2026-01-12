import { useState } from "react";
import { Send } from "lucide-react";

export default function PromptBarSimBlur() {
  const [value, setValue] = useState("");

  return (
    <div className="relative flex justify-center">

      <form
        className="relative z-10 flex items-center gap-2 px-4 py-3 rounded-full border border-white/10 w-[640px] bg-white/10"
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          className="bg-transparent outline-none text-white flex-1"
          placeholder="Type something..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button className="rotate-45 cursor-pointer">
          <Send className="text-white" />
        </button>
      </form>
    </div>
  );
}
