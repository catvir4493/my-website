export function SocialImage({
  title,
  category,
  summary,
}: {
  title: string;
  category: string;
  summary: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#080e14",
        color: "#dcecf5",
        padding: "60px",
        border: "2px solid #345162",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 22,
          color: "#83d9ee",
          letterSpacing: 4,
        }}
      >
        <span>MARCELL.OS</span>
        <span>V1.1 / REAL SYSTEMS UPDATE</span>
      </div>
      <div
        style={{ display: "flex", marginTop: 45, color: "#9ab7c7", fontSize: 20, letterSpacing: 2 }}
      >
        {category}
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 25,
          fontSize: 64,
          lineHeight: 1.1,
          fontWeight: 700,
          letterSpacing: -3,
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 30,
          fontSize: 27,
          lineHeight: 1.5,
          color: "#a9c4d3",
          maxWidth: 1020,
        }}
      >
        {summary}
      </div>
      <div style={{ display: "flex", marginTop: "auto", fontSize: 19, color: "#83d9ee" }}>
        IDEAS → SYSTEMS → IMPACT / BUDAPEST
      </div>
    </div>
  );
}
