import { ChevronLeft } from "lucide-react";
import LogoButton from "./LogoButton";

interface TogglerProps {
  toggleSideBar: boolean;
  toggleHandler: (val: boolean) => void;
}

function SideBarToggler({ toggleSideBar, toggleHandler }: TogglerProps) {
  return (
    <div
      className={`p-2 bg-black/20 text-black ${!toggleSideBar ? "rounded-[25px]" : "rounded-full"} flex items-center justify-between ${
        !toggleSideBar ? "w-60 pr-4" : "w-fit"
      }`}
    >
      <div className="flex gap-4 items-center text-white">
        <LogoButton height={40} width={40} onClick={() => toggleHandler(false)} />
          { !toggleSideBar && (
            <h1 className="text-md font-md">EvenceAI</h1>
          )}
      </div>
      {!toggleSideBar && (
        <ChevronLeft color="#FFFFFF" onClick={() => toggleHandler(true)} />
      )}
    </div>
  );
}

export default SideBarToggler;
