/* Stat Archive — two-block About panel.
   Keeps the existing overlay/close-button wiring intact and only rebuilds
   the content inside the About card. */
(() => {
  "use strict";

  if (window.__STAT_ARCHIVE_ABOUT_DUAL_V3__) return;
  window.__STAT_ARCHIVE_ABOUT_DUAL_V3__ = true;

  const STYLE_ID = "statArchiveAboutDualStyle";

  function installStyles() {
    let style = document.getElementById(STYLE_ID);
    if (style) style.remove();

    style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
#aboutArchiveOverlay .about-archive-card.about-dual-card{
  width:min(760px,calc(100vw - 30px))!important;
  max-width:760px!important;
  max-height:min(88vh,820px)!important;
  padding:0!important;
  overflow:hidden!important;
}
#aboutArchiveOverlay .about-dual-header{
  position:sticky;
  top:0;
  z-index:3;
  padding:24px 26px 18px!important;
  margin:0!important;
  background:rgba(15,20,29,.96);
  border-bottom:1px solid rgba(148,163,184,.12);
  backdrop-filter:blur(18px);
  -webkit-backdrop-filter:blur(18px);
}
#aboutArchiveOverlay .about-dual-body{
  display:grid;
  grid-template-columns:minmax(0,1fr) minmax(0,1fr);
  gap:16px;
  padding:22px 24px 24px;
  max-height:calc(88vh - 82px);
  overflow-y:auto;
  overscroll-behavior:contain;
  -webkit-overflow-scrolling:touch;
}
#aboutArchiveOverlay .about-info-block{
  min-width:0;
  padding:22px 22px 24px;
  border:1px solid rgba(148,163,184,.15);
  border-radius:18px;
  background:linear-gradient(145deg,rgba(255,255,255,.035),rgba(255,255,255,.012));
  box-shadow:inset 0 1px rgba(255,255,255,.025);
}
#aboutArchiveOverlay .about-block-label{
  margin:0 0 17px;
  color:#778497;
  font:700 9.5px/1.2 'JetBrains Mono',monospace;
  letter-spacing:.16em;
}
#aboutArchiveOverlay .about-info-block h3{
  margin:0 0 14px;
  color:var(--text,#eef2f7);
  font:700 17px/1.25 'JetBrains Mono',monospace;
  letter-spacing:.055em;
}
#aboutArchiveOverlay .about-info-block p{
  margin:0;
  color:var(--muted,#929baa);
  font:400 14px/1.82 'Inter',system-ui,sans-serif;
}
#aboutArchiveOverlay .about-info-block p + p{margin-top:18px;}
#aboutArchiveOverlay .about-creator-name{
  margin:0 0 5px!important;
  font-family:'Plus Jakarta Sans','Inter',system-ui,sans-serif!important;
  font-size:28px!important;
  line-height:1.08!important;
  letter-spacing:-.035em!important;
}
#aboutArchiveOverlay .about-creator-role{
  margin:0 0 18px;
  color:var(--cyan-2,#67d8cf);
  font:700 9px/1.3 'JetBrains Mono',monospace;
  letter-spacing:.14em;
}
#aboutArchiveOverlay .about-connect{
  margin-top:24px;
  padding-top:20px;
  border-top:1px solid rgba(148,163,184,.12);
}
#aboutArchiveOverlay .about-connect-label{
  margin:0 0 13px;
  color:#778497;
  font:700 9px/1.2 'JetBrains Mono',monospace;
  letter-spacing:.16em;
}
#aboutArchiveOverlay .about-connect-links{
  display:flex;
  align-items:center;
  gap:12px;
  flex-wrap:nowrap;
}
#aboutArchiveOverlay .about-connect-icon{
  width:50px;
  height:50px;
  flex:0 0 50px;
  display:grid;
  place-items:center;
  border:1px solid rgba(148,163,184,.20);
  border-radius:50%;
  color:var(--cyan-2,#67d8cf);
  background:linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.012));
  text-decoration:none;
  box-shadow:inset 0 1px rgba(255,255,255,.035);
  transition:transform .18s ease,border-color .18s ease,background .18s ease,box-shadow .18s ease;
  -webkit-tap-highlight-color:transparent;
}
#aboutArchiveOverlay .about-connect-icon svg{
  width:21px;
  height:21px;
  display:block;
}
#aboutArchiveOverlay .about-connect-icon:hover{
  border-color:rgba(103,216,207,.48);
  background:rgba(103,216,207,.075);
  box-shadow:0 0 0 4px rgba(103,216,207,.055),inset 0 1px rgba(255,255,255,.04);
}
#aboutArchiveOverlay .about-connect-icon:active{transform:scale(.94);}
#aboutArchiveOverlay .about-dual-signoff{
  grid-column:1/-1;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  padding:16px 2px 0;
  border-top:1px solid rgba(148,163,184,.12);
}
#aboutArchiveOverlay .about-dual-signoff strong{
  color:var(--text,#eef2f7);
  font:700 12px/1.3 'JetBrains Mono',monospace;
}
#aboutArchiveOverlay .about-dual-signoff span{
  color:#778497;
  font:600 8.5px/1.3 'JetBrains Mono',monospace;
  letter-spacing:.12em;
}
body[data-theme="light"] #aboutArchiveOverlay .about-dual-header,
html[data-theme="light"] #aboutArchiveOverlay .about-dual-header{
  background:rgba(249,247,240,.97);
  border-bottom-color:#ded8cc;
}
body[data-theme="light"] #aboutArchiveOverlay .about-info-block,
html[data-theme="light"] #aboutArchiveOverlay .about-info-block{
  border-color:#ddd7cb;
  background:linear-gradient(145deg,rgba(255,255,255,.84),rgba(244,240,230,.6));
}
body[data-theme="light"] #aboutArchiveOverlay .about-block-label,
body[data-theme="light"] #aboutArchiveOverlay .about-dual-signoff span,
body[data-theme="light"] #aboutArchiveOverlay .about-connect-label,
html[data-theme="light"] #aboutArchiveOverlay .about-block-label,
html[data-theme="light"] #aboutArchiveOverlay .about-dual-signoff span,
html[data-theme="light"] #aboutArchiveOverlay .about-connect-label{color:#727b75;}
body[data-theme="light"] #aboutArchiveOverlay .about-creator-role,
html[data-theme="light"] #aboutArchiveOverlay .about-creator-role{color:#347d73;}
body[data-theme="light"] #aboutArchiveOverlay .about-dual-signoff,
body[data-theme="light"] #aboutArchiveOverlay .about-connect,
html[data-theme="light"] #aboutArchiveOverlay .about-dual-signoff,
html[data-theme="light"] #aboutArchiveOverlay .about-connect{border-top-color:#ddd7cb;}
body[data-theme="light"] #aboutArchiveOverlay .about-connect-icon,
html[data-theme="light"] #aboutArchiveOverlay .about-connect-icon{
  border-color:#d7d0c4;
  background:rgba(255,255,255,.62);
  color:#347d73;
}
@media(max-width:700px){
  #aboutArchiveOverlay{
    align-items:flex-start!important;
    padding:18px 0 calc(18px + env(safe-area-inset-bottom))!important;
  }
  #aboutArchiveOverlay .about-archive-card.about-dual-card{
    width:calc(100vw - 24px)!important;
    max-height:calc(100dvh - 36px)!important;
    border-radius:20px!important;
  }
  #aboutArchiveOverlay .about-dual-header{
    padding:19px 18px 15px!important;
  }
  #aboutArchiveOverlay .about-dual-header .form-title{font-size:18px!important;}
  #aboutArchiveOverlay .about-dual-body{
    grid-template-columns:1fr;
    gap:14px;
    padding:16px 16px 20px;
    max-height:calc(100dvh - 104px);
  }
  #aboutArchiveOverlay .about-info-block{
    padding:19px 18px 21px;
    border-radius:16px;
  }
  #aboutArchiveOverlay .about-block-label{margin-bottom:14px;}
  #aboutArchiveOverlay .about-info-block h3{font-size:16px;margin-bottom:12px;}
  #aboutArchiveOverlay .about-info-block p{font-size:13.5px;line-height:1.78;}
  #aboutArchiveOverlay .about-creator-name{font-size:25px!important;}
  #aboutArchiveOverlay .about-connect{margin-top:21px;padding-top:18px;}
  #aboutArchiveOverlay .about-connect-links{gap:11px;}
  #aboutArchiveOverlay .about-connect-icon{
    width:48px;
    height:48px;
    flex-basis:48px;
  }
  #aboutArchiveOverlay .about-connect-icon svg{width:20px;height:20px;}
  #aboutArchiveOverlay .about-dual-signoff{
    flex-direction:column;
    align-items:flex-start;
    padding:14px 2px 0;
  }
}
`;
    document.head.appendChild(style);
  }

  function buildPanel() {
    const overlay = document.getElementById("aboutArchiveOverlay");
    const card = overlay?.querySelector(".about-archive-card, .form-card");
    const header = card?.querySelector(".form-header");
    const title = header?.querySelector("#aboutArchiveTitle, .form-title");
    const close = header?.querySelector("#closeAboutArchiveBtn");

    if (!overlay || !card || !header || !close) return false;
    if (card.dataset.aboutDualReady === "3") return true;

    installStyles();

    card.classList.add("about-dual-card");
    header.classList.add("about-dual-header");
    if (title) {
      title.id = "aboutArchiveTitle";
      title.textContent = "About Stat Archive";
    }
    overlay.setAttribute("aria-labelledby", "aboutArchiveTitle");

    Array.from(card.children).forEach((child) => {
      if (child !== header) child.remove();
    });

    const body = document.createElement("div");
    body.className = "about-dual-body";
    body.innerHTML = `
      <section class="about-info-block about-creator-block" aria-labelledby="aboutCreatorHeading">
        <div class="about-block-label">ABOUT ME · CREATOR</div>
        <h3 id="aboutCreatorHeading" class="about-creator-name">Adarsh Shukla</h3>
        <div class="about-creator-role">CREATOR OF STAT ARCHIVE</div>
        <p>I like building things that solve problems I encounter myself. What started as a small attempt to organize study material gradually became something I wanted to make useful for everyone. I enjoy learning through experimentation — trying an idea, finding what doesn’t work, and improving it until it does.</p>
        <p>Stat Archive is one of those experiments, and certainly not the last.</p>

        <div class="about-connect" aria-label="Connect with Adarsh Shukla">
          <div class="about-connect-label">CONNECT</div>
          <div class="about-connect-links">
            <a class="about-connect-icon" href="https://www.linkedin.com/in/adarsh-shukla-b7509727b" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" title="LinkedIn">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.94 8.5H3.56V20h3.38V8.5ZM5.25 3A2.03 2.03 0 1 0 5.3 7.06 2.03 2.03 0 0 0 5.25 3ZM20.44 12.66c0-3.47-1.85-5.08-4.32-5.08-1.99 0-2.88 1.09-3.38 1.86V8.5H9.37c.04.62 0 11.5 0 11.5h3.37v-6.42c0-.34.02-.68.12-.92.27-.68.9-1.39 1.95-1.39 1.38 0 1.93 1.05 1.93 2.59V20H20.1v-7.34Z"/></svg>
            </a>
            <a class="about-connect-icon" href="https://www.instagram.com/the_illusionistic_07?igsi=MTFuNmN0djQ0eXNxYg==" target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Instagram">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5a3.95 3.95 0 0 0 3.95 3.95h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95h-8.5Zm8.95 1.35a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8A3.2 3.2 0 1 0 12 15.2 3.2 3.2 0 0 0 12 8.8Z"/></svg>
            </a>
            <a class="about-connect-icon" href="mailto:a.shukla.1707@gmail.com" aria-label="Email" title="Email">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm0 2v.24l8 5.33 8-5.33V7H4Zm16 10V9.16l-7.45 4.97a1 1 0 0 1-1.1 0L4 9.16V17h16Z"/></svg>
            </a>
          </div>
        </div>
      </section>

      <section class="about-info-block about-project-block" aria-labelledby="aboutIdeaHeading">
        <div class="about-block-label">ABOUT STAT ARCHIVE</div>
        <h3 id="aboutIdeaHeading">THE IDEA</h3>
        <p>Stat Archive began with a simple thought: useful academic material should not disappear when one batch graduates. Notes, books and question papers become more valuable when they stay organized, searchable and available to the students who come next.</p>
      </section>

      <div class="about-dual-signoff" aria-label="Stat Archive tagline">
        <strong>Stat Archive</strong>
        <span>LEARN · ANALYZE · GROW</span>
      </div>`;

    card.appendChild(body);
    body.scrollTop = 0;
    card.dataset.aboutDualReady = "3";
    return true;
  }

  function install() {
    if (buildPanel()) return;

    const observer = new MutationObserver(() => {
      if (buildPanel()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList:true, subtree:true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once:true });
  } else {
    install();
  }
})();
