import { useRef, useState, useEffect } from "react";
import LogoButton from "./components/buttons/LogoButton";
import PromptBar from "./components/text_boxes/PromptBar";
import { useClickThrough } from "./hooks/useClickThrough";
import ChatPage from "./pages/ChatPage";

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<number>(0);

  useClickThrough(containerRef);
  const windowAPI = () => {
    (window as any).electronAPI?.setBackground("acrylic");
    (window as any).electronAPI?.setWindowSize(1200, 720);
  }

  const handleLogoClick = () => {
    if (step === 0) setStep(1);
    else if (step === 1) {
      setStep(2);
      windowAPI();
    }
  };


  const handlePromptSubmit = () => {
    windowAPI();
    setStep(2);
  }

  // Listen for any key press to auto-move to step 1
  useEffect(() => {
    const handleKeyDown = (_e: KeyboardEvent) => {
      if (step === 0) setStep(1);
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [step]);

  return (
    <div className="h-screen">
      <div
        // ref={containerRef}
        className={`text-white absolute right-1/2 translate-x-1/2  flex flex-col items-center ${step !== 2 ? 'bottom-10' : 'bottom-0'}`}
      >
        {step !== 2 && (
  <>
    <PromptBar
      focused={step === 1}
      onSubmit={handlePromptSubmit}
    />
    <LogoButton onClick={handleLogoClick} />
  </>
)}
{step === 2 && <ChatPage />}
      </div>
    </div>
  );
}

export default App;
