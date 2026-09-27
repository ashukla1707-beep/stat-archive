/* Stat Archive — two-block About panel.
   Keeps the existing overlay/close-button wiring intact and only rebuilds
   the content inside the About card. */
(() => {
  "use strict";

  if (window.__STAT_ARCHIVE_ABOUT_DUAL_V1__) return;
  window.__STAT_ARCHIVE_ABOUT_DUAL_V1__ = true;

  const STYLE_ID = "statArchiveAboutDualStyle";

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
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
html[data-theme="light"] #aboutArchiveOverlay .about-block-label,
html[data-theme="light"] #aboutArchiveOverlay .about-dual-signoff span{color:#727b75;}
body[data-theme="light"] #aboutArchiveOverlay .about-creator-role,
html[data-theme="light"] #aboutArchiveOverlay .about-creator-role{color:#347d73;}
body[data-theme="light"] #aboutArchiveOverlay .about-dual-signoff,
html[data-theme="light"] #aboutArchiveOverlay .about-dual-signoff{border-top-color:#ddd7cb;}
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
    if (card.dataset.aboutDualReady === "1") return true;

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
      <section class="about-info-block about-project-block" aria-labelledby="aboutIdeaHeading">
        <div class="about-block-label">ABOUT STAT ARCHIVE</div>
        <h3 id="aboutIdeaHeading">THE IDEA</h3>
        <p>Stat Archive began with a simple thought: useful academic material should not disappear when one batch graduates. Notes, books and question papers become more valuable when they stay organized, searchable and available to the students who come next.</p>
      </section>

      <section class="about-info-block about-creator-block" aria-labelledby="aboutCreatorHeading">
        <div class="about-block-label">ABOUT ME · CREATOR</div>
        <h3 id="aboutCreatorHeading" class="about-creator-name">Adarsh Shukla</h3>
        <div class="about-creator-role">CREATOR OF STAT ARCHIVE</div>
        <p>I like building things that solve problems I encounter myself. What started as a small attempt to organize study material gradually became something I wanted to make useful for everyone. I enjoy learning through experimentation — trying an idea, finding what doesn’t work, and improving it until it does.</p>
        <p>Stat Archive is one of those experiments, and certainly not the last.</p>
      </section>

      <div class="about-dual-signoff" aria-label="Stat Archive tagline">
        <strong>Stat Archive</strong>
        <span>LEARN · ANALYZE · GROW</span>
      </div>`;

    card.appendChild(body);
    card.dataset.aboutDualReady = "1";
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
