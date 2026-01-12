import { ArrowUp, Minus, X } from "lucide-react";
import SideBarToggler from "../components/buttons/SideBarToggler";
import Sidebar from "../components/sidebar/Sidebar";
import { useState, useRef, useEffect } from "react";
import ChatInput from "../components/text_boxes/ChatInput";
import CutOut from "../components/cut_out/CutOut";
import ChatInterface from "../components/chat_interface/ChatInterface";
import { useDispatch, useSelector } from "react-redux";
import { setPrompt } from "../Redux/PromptSlice";
import { RootState } from "../Redux/store";
import { addMessage, updateLastMessage } from "../Redux/ChatSilce";

function ChatPage() {
  const [toggleSidebar, setToggleSidebar] = useState(true);
  const [inputHeight, setInputHeight] = useState(80);
  const prompt = useSelector((state: RootState) => state.Prompts.prompt);
  const activeContent = useSelector((state: RootState) => state.ChatState.activeContent);
  const activeId = useSelector((state: RootState) => state.ChatState.activeId);
  const dispatch = useDispatch();

  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  const toggleHandler = (val: boolean) => setToggleSidebar(val);

  const handleMinimize = () => (window as any).electronAPI?.toggleWindow();
  const handleClose = () => (window as any).electronAPI?.closeWindow();

  useEffect(() => {
    setConversationId(undefined);
    setIsStreaming(false);
    setActiveTool(null);
  }, [activeId]);

  const handleSubmit = async () => {
    if (!prompt.trim() || isStreaming) return;

    const userMessage = prompt;
    dispatch(setPrompt(""));
    
    // Add user message
    dispatch(addMessage({
      role: "user",
      content: userMessage,
      timestamp: Date.now(),
    }));
    
    // Add empty assistant message
    dispatch(addMessage({
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    }));
    
    setIsStreaming(true);

    try {
      const response = await window.agentAPI.chat(userMessage, conversationId);
      
      if (response.success) {
        setConversationId(response.data?.conversationId);
        console.log('Chat complete:', {
          tokens: response.data?.metadata.tokensUsed,
          cost: response.data?.metadata.cost,
          duration: response.data?.metadata.duration
        });
      } else {
        console.error('Agent error:', response.error);
        dispatch(updateLastMessage(`Error: ${response.error}`));
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      dispatch(updateLastMessage(`Error: ${error.message}`));
    } finally {
      setIsStreaming(false);
      setActiveTool(null);
    }
  };

  useEffect(() => {
    const cleanupTextDelta = window.agentAPI.onTextDelta((text: string) => {
      dispatch(updateLastMessage(text));
    });

    const cleanupToolStart = window.agentAPI.onToolCallStart((toolName: string) => {
      console.log(`Tool started: ${toolName}`);
      setActiveTool(toolName);
    });

    const cleanupToolComplete = window.agentAPI.onToolCallComplete(({ toolName }) => {
      console.log(`Tool completed: ${toolName}`);
      setActiveTool(null);
    });

    const cleanupError = window.agentAPI.onError((error: string) => {
      console.error('Agent error:', error);
    });

    return () => {
      cleanupTextDelta();
      cleanupToolStart();
      cleanupToolComplete();
      cleanupError();
    };
  }, [dispatch]);

  useEffect(() => {
    if (!inputRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setInputHeight(entry.contentRect.height + entry.contentRect.height * 0.17);
      }
    });
    resizeObserver.observe(inputRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div className="h-[720px] w-screen bg-transparent rounded-xl flex gap-4 p-4 ">
      <div className="w-fit h-full flex flex-col gap-4">
        <SideBarToggler toggleSideBar={toggleSidebar} toggleHandler={toggleHandler} />
        <Sidebar toggleSideBar={toggleSidebar} />
      </div>

      <div className="flex flex-col w-full h-[690px]">
        <div className="flex w-full justify-end gap-1 px-2 pb-2">
          <Minus
            color="#ffbe0b"
            size={30}
            className="cursor-pointer hover:bg-white/5 rounded-md p-1"
            onClick={handleMinimize}
          />
          <X
            color="#c1121f"
            size={30}
            className="cursor-pointer hover:bg-white/5 rounded-md p-1"
            onClick={handleClose}
          />
        </div>

        <div className="relative h-[650px] w-full box-border">
          <CutOut cutoutHeight={inputHeight} cutoutWidth={900} />

          {/* Pass activeContent directly from Redux */}
          <ChatInterface 
            dialogue_stream={activeContent} 
            inputHeight={inputHeight} 
            toggleSidebar={toggleSidebar} 
            activeTool={activeTool} 
            isStreaming={isStreaming}
          />

          <div
            ref={inputRef}
            className={`absolute bottom-0 left-1/2 -translate-x-1/2 ${
              toggleSidebar ? "w-[800px]" : "w-[700px]"
            } flex px-7 items-end gap-5`}
          >
            <ChatInput
              className="w-full py-6 outline-none" 
              onSubmit={handleSubmit}
            />
            <button
              className="mb-3 cursor-pointer p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
              onClick={handleSubmit}
              disabled={isStreaming}
            >
              <ArrowUp color="white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;