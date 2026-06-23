export default function ReadingProgress({ progress }: { progress: number }) {
  return (
    <div
      className="pointer-events-none fixed top-0 left-0 z-[200]"
      style={{
        height: '2.5px',
        width: `${progress}%`,
        background: 'linear-gradient(90deg, #00e5ff, #b44dff, #ff2d95)',
        boxShadow: '0 0 12px rgba(0,229,255,0.5), 0 0 24px rgba(180,77,255,0.3)',
        transition: 'width 0.1s linear',
      }}
    />
  );
}
