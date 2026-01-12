interface LogoButtonProps {
  height?: number
  width?: number
  onClick: () => void
}

function LogoButton({ height = 60, width = 60, onClick }: LogoButtonProps) {
  return (
    <div
      className="relative flex items-center justify-center rounded-full overflow-hidden cursor-pointer bg-black/40"
      style={{ height, width }}
      onClick={onClick}
    >
      <img
        src="/logo/logo_animation_1.png"
        alt="Logo"
        className="animate-spin [animation-duration:1.5s]"
        style={{ height, width }}
      />
      <img src="/logo/logo.png" alt="Logo" className="absolute" style={{ height, width }} />
    </div>
  )
}

export default LogoButton
