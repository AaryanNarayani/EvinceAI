import { Ellipsis, Plus, Trash2, Edit } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../Redux/store";
import { setActiveContent, setActiveId } from "../../Redux/ChatSilce";

interface TogglerProps {
  toggleSideBar: boolean;
}

interface ConversationSummary {
  id: string;
  title: string;
  created: string;
  updated: string;
  messageCount: number;
}

interface PopupPosition {
  top?: number;
  bottom?: number;
  left: number;
}

interface EditingState {
  id: string;
  title: string;
}

function Sidebar({ toggleSideBar }: TogglerProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState<PopupPosition>({ left: 0 });
  const [editingConv, setEditingConv] = useState<EditingState | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const _ChatSlice = useSelector((state: RootState) => state.ChatState);
  const dispatch = useDispatch();
  const [username] = useState("Aaryan Narayani");

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const convos = await window.agentAPI.listConversations();
        setConversations(convos);
      } catch (error) {
        console.error('Failed to load conversations:', error);
      }
    };

    loadConversations();

    const interval = setInterval(loadConversations, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setActivePopup(null);
      }
    };

    if (activePopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activePopup]);

  useEffect(() => {
    if (editingConv && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingConv]);

  const handleNewChat = () => {
    // window.location.reload();
    dispatch(setActiveId(null));
    dispatch(setActiveContent([]));
  };

  const handleConversationClick = async (convId: string) => {
    dispatch(setActiveId(convId));
    const convo = await window.agentAPI.getConversation(convId);
    dispatch(setActiveContent(convo.messages));
  };

  const handleEllipsisClick = (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const popupHeight = 100; // Approximate popup height
    
    const position: PopupPosition = {
      left: rect.right + 8, // 8px gap from the ellipsis
    };

    if (spaceBelow >= popupHeight || spaceBelow > spaceAbove) {
      // Open downward
      position.top = rect.top;
    } else {
      // Open upward
      position.bottom = viewportHeight - rect.bottom;
    }

    setPopupPosition(position);
    setActivePopup(activePopup === convId ? null : convId);
  };

  const handleDelete = async (convId: string) => {
    const response = await window.agentAPI.deleteConversation(convId);
    if (response.success) {
      setConversations(conversations.filter(conv => conv.id !== convId));
    } else {
      console.error('Failed to delete conversation:', response.error);
    }
    console.log('Delete conversation:', convId);
    setActivePopup(null);
  };

  const handleRename = (convId: string) => {
    const conv = conversations.find(c => c.id === convId);
    if (conv) {
      setEditingConv({ id: convId, title: conv.title });
    }
    setActivePopup(null);
  };

  const handleSaveRename = async () => {
    if (!editingConv) return;
    
    setConversations(conversations.map(conv => 
      conv.id === editingConv.id ? { ...conv, title: editingConv.title } : conv
    ));
    
    setEditingConv(null);
  };

  const handleCancelRename = () => {
    setEditingConv(null);
  };

  return (
    <motion.div
      initial={{}}
      animate={{ width: toggleSideBar ? 55 : 240 }}
      transition={{ type: "spring", stiffness: 200, damping: 23 }}
      className={`py-3 w-full bg-white/5 h-full rounded-2xl flex flex-col gap-3 overflow-hidden ${
        toggleSideBar ? "items-center" : "items-start px-2"
      }`}
    >
      <div 
        className="flex gap-3 cursor-pointer px-2 py-1 text-nowrap hover:bg-white/10 rounded-lg transition-colors "
        onClick={handleNewChat}
      >
        <Plus size={23} />

        {!toggleSideBar && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="text-md"
          >
            New Chat
          </motion.span>
        )}
      </div>

      <motion.div className="h-full w-full flex flex-col overflow-y-auto scrollbar-hide relative">
        {!toggleSideBar && (
          <motion.div
            key="chat-list"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col gap-3"
          >
            {conversations.length > 0 ? (
              conversations.map((conv) => (
                <motion.div
                  key={conv.id}
                  className="text-sm w-full cursor-pointer flex items-center justify-between text-nowrap hover:bg-white/5 p-2 rounded-lg transition-colors relative"
                  onClick={() => editingConv?.id !== conv.id && handleConversationClick(conv.id)}
                >
                  {editingConv?.id === conv.id ? (
                    <div className="flex items-center gap-2 w-full px-3">
                      <input
                        ref={inputRef}
                        type="text"
                        value={editingConv.title}
                        onChange={(e) => setEditingConv({ ...editingConv, title: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename();
                          if (e.key === 'Escape') handleCancelRename();
                        }}
                        className="flex-1 bg-white/10 border border-white/20 rounded px-2 py-1 text-sm focus:outline-none focus:border-white/40"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveRename();
                        }}
                        className="text-green-400 hover:text-green-300 text-xs px-2"
                      >
                        ✓
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelRename();
                        }}
                        className="text-red-400 hover:text-red-300 text-xs px-2"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-0.5 overflow-hidden px-3">
                        <span className="font-medium truncate">{conv.title}</span>
                        <span className="text-xs text-white/50">
                          {new Date(conv.updated).toLocaleDateString()}
                        </span>
                      </div>
                      <Ellipsis 
                        size={23} 
                        className="shrink-0 ml-2 hover:bg-white/10 rounded p-0.5 transition-colors" 
                        onClick={(e) => handleEllipsisClick(e, conv.id)}
                      />
                    </>
                  )}

                  <AnimatePresence>
                    {activePopup === conv.id && (
                      <motion.div
                        ref={popupRef}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="fixed bg-black/40 backdrop-blur-md border border-black/20 rounded-lg shadow-lg z-50 overflow-hidden"
                        style={{
                          left: popupPosition.left,
                          top: popupPosition.top,
                          bottom: popupPosition.bottom,
                        }}
                      >
                        <div className="py-1 min-w-[150px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRename(conv.id);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
                          >
                            <Edit size={14} />
                            Summary
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRename(conv.id);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
                          >
                            <Edit size={14} />
                            Rename
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(conv.id);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-red-500/20 text-red-400 transition-colors flex items-center gap-2"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            ) : (
              <div className="text-xs text-white/40 text-center py-4">
                No conversations yet
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      <div
        className={`flex gap-4 text-nowrap ${
          !toggleSideBar ? "pl-1.5 items-center" : "items-start"
        }`}
      >
        <img src="/logo/avatar.png" alt="" height={40} width={40}/>

        {!toggleSideBar && (
          <motion.h1
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm"
          >
            {username}
          </motion.h1>
        )}
      </div>
    </motion.div>
  );
}

export default Sidebar;