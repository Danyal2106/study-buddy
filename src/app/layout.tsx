import Script from "next/script";

// app/layout.tsx
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no" suppressHydrationWarning>
      <head>
        {/* Default-vars for LIGHT på server */}
        <style
          // disse må matche getThemeVars("light")
          dangerouslySetInnerHTML={{
            __html: `
:root{
  --bg:#F8F5EF; --card:#FFFFFF; --text:#111827; --muted:#6B7280; --border:#E5E7EB;
  --surface1:#E6DFD3; --surface2:#E0D8C9; --surface2-border:#D6CEBE;
  --chip:#DED6C7; --chip-border:#D2C9B8; --dot:#A4B3C7; --accent:#111827;
  --subj1-bg:#DDEAFE; --subj1-border:#BFD4FA;
  --subj2-bg:#FDE7DF; --subj2-border:#F7CDBC;
  --subj3-bg:#FBE7A1; --subj3-border:#F6D985;
  --subj4-bg:#FDE0CC; --subj4-border:#F8CDAF;
  --text-size-scale:1; --motion-scale:1;
}
            `,
          }}
        />
        {/* “Boot”-script som leser localStorage og setter dark-mode før hydrering */}
        <Script id="theme-boot" strategy="beforeInteractive">
          {`try{
  var KEY="app.settings.v1";
  var raw=localStorage.getItem(KEY);
  if(raw){
    var s=JSON.parse(raw)||{};
    var theme=(s.theme==="dark")?"dark":"light";
    document.documentElement.setAttribute("data-theme", theme);
  }
}catch(e){}`}
        </Script>
      </head>
      <body style={{ background: "var(--bg)" }}>{children}</body>
    </html>
  );
}
