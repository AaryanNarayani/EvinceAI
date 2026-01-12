import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../Redux/store";
import ReactMarkdown from "react-markdown";
import { ChatMessage } from "../../Redux/ChatSilce";
import LogoButton from "../buttons/LogoButton";

interface ChatInterfaceProps {
  inputHeight?: number;
  toggleSidebar?: boolean;
  activeTool?: string | null;
  isStreaming?: boolean;
}

const IncrementalMarkdownTypewriter = ({ children }: { children: string }) => {
  const [displayedText, setDisplayedText] = useState("");
  const completedIndexRef = useRef(0);

  useEffect(() => {
    const newContent = String(children || "");
    const completedLength = completedIndexRef.current;

    if (newContent.length > completedLength) {
      const extra = newContent.length - completedLength;
      let animated = 0;

      const animate = () => {
        if (animated < extra) {
          animated++;
          setDisplayedText(newContent.slice(0, completedLength + animated));
          setTimeout(animate, 20);
        } else {
          setDisplayedText(newContent);
          completedIndexRef.current = newContent.length;
        }
      };
      animate();
    } else if (newContent.length < completedLength) {
      setDisplayedText(newContent);
      completedIndexRef.current = newContent.length;
    }
  }, [children]);

  return <ReactMarkdown>{displayedText || ""}</ReactMarkdown>;
};

const getToolDisplayName = (toolName: string) => {
  const map: Record<string, string> = {
    webSearch: "Searching the web",
    readFile: "Reading file",
    writeFile: "Writing file",
    listDirectory: "Listing directory",
    createDirectory: "Creating directory",
    deleteFile: "Deleting file",
    moveFile: "Moving file",
    fetchUrl: "Fetching URL",
    downloadFile: "Downloading file",
    executeCommand: "Executing command",
    getCurrentDirectory: "Getting directory",
  };
  return map[toolName] || toolName;
};

function ChatInterface({
  inputHeight = 100,
  toggleSidebar,
  activeTool = null,
  isStreaming = false,
}: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // const id = useSelector((state: RootState) => state.ChatState.activeId);
  const dialogue_stream = useSelector(
    (state: RootState) => state.ChatState.activeContent
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [dialogue_stream, toggleSidebar, activeTool]);

  const lastMessage = dialogue_stream[dialogue_stream.length - 1];
  const showThinking =
    isStreaming &&
    lastMessage?.role === "assistant" &&
    !lastMessage.content &&
    !activeTool;

  return (
    <div
      ref={scrollRef}
      className="flex flex-col items-center scrollbar-hide w-full"
      style={{
        height: `calc(100% - ${inputHeight + 10}px)`,
        overflowY: "auto",
        padding: "16px 0",
      }}
    >
      {dialogue_stream.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full w-full text-white/70 select-none">
          <LogoButton height={100} width={100} onClick={() => {}}></LogoButton>

          <div className="space-y-4 text-center text-white/60">

            <div>
              <p className="text-lg tracking-wide">Minimize App</p>
              <p className="text-sm bg-white/5 inline-block px-3 py-1 rounded-md mt-1">
                Ctrl + K
              </p>
            </div>
          </div>
        </div>
      )}

      {dialogue_stream.length > 0 && (
        <div
          className="flex flex-col space-y-4 w-full"
          style={{
            maxWidth: !toggleSidebar ? "600px" : "800px",
          }}
        >
          {dialogue_stream.map((msg: ChatMessage, i: number) => {
            let messageContent = "";

            if (Array.isArray(msg.content)) {
              messageContent = msg.content
                .filter((b: any) => b.type === "text")
                .map((b: any) => b.text)
                .join("");
            } else if (typeof msg.content === "string") {
              try {
                if (msg.content.trim().startsWith("[")) {
                  const parsed = JSON.parse(msg.content);
                  if (Array.isArray(parsed)) {
                    messageContent = parsed
                      .filter((b: any) => b.type === "text")
                      .map((b: any) => b.text)
                      .join("");
                  } else messageContent = msg.content;
                } else messageContent = msg.content;
              } catch {
                messageContent = msg.content;
              }
            } else if (msg.content && typeof msg.content === "object") {
              messageContent = (msg.content as any).text || "";
            }

            const isLatestAssistant =
              msg.role === "assistant" && i === dialogue_stream.length - 1;

            return (
              <div
                key={i}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`p-4 rounded-[30px] prose prose-invert ${
                    msg.role === "user"
                      ? "bg-black/10 backdrop-blur-sm px-6"
                      : ""
                  }`}
                  style={{ maxWidth: "85%" }}
                >
                  {msg.role === "assistant" &&
                  isLatestAssistant &&
                  isStreaming ? (
                    <IncrementalMarkdownTypewriter>
                      {messageContent}
                    </IncrementalMarkdownTypewriter>
                  ) : (
                    <ReactMarkdown>{messageContent}</ReactMarkdown>
                  )}
                </div>
              </div>
            );
          })}

          {(activeTool || showThinking) && (
            <div className="flex justify-start">
              <div className="p-3 px-5 rounded-[30px] bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-[#A5EFFF]/30">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-[#A5EFFF] rounded-full animate-bounce" />
                    <span
                      className="w-2 h-2 bg-[#A5EFFF] rounded-full animate-bounce"
                      style={{ animationDelay: "120ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-[#A5EFFF] rounded-full animate-bounce"
                      style={{ animationDelay: "240ms" }}
                    />
                  </div>
                  <span className="text-white/90 text-sm font-medium">
                    {activeTool
                      ? getToolDisplayName(activeTool)
                      : "Thinking"}
                    ...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ChatInterface;
