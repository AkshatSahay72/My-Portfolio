function typeBootLines() {
  const bootScreen = document.getElementById("boot-screen");
  const main = document.getElementById("notebook-main");
  const lines = Array.from(document.querySelectorAll(".boot-line"));
  const kernelIndicator = document.querySelector(".kernel-status-indicator");
  const kernelText = document.querySelector(".kernel-status-text");

  if (!bootScreen || !main || !lines.length) return;

  let idx = 0;

  function typeNext() {
    if (idx >= lines.length) {
      // Finish loading
      setTimeout(() => {
        bootScreen.classList.add("hidden");
        main.classList.remove("hidden");
        revealCells();
        // Mark kernel idle
        if (kernelIndicator) {
          kernelIndicator.classList.remove("kernel-busy");
          kernelIndicator.classList.add("kernel-idle");
        }
        if (kernelText) {
          kernelText.textContent = "Python 3 | Idle";
        }
        // Trigger data loads
        loadProjects();
        loadGitStats();
      }, 400);
      return;
    }

    const el = lines[idx];
    const text = el.getAttribute("data-text") || "";
    let charIdx = 0;

    el.classList.add("active");

    function tick() {
      el.textContent = text.slice(0, charIdx);
      charIdx += 1;

      if (charIdx <= text.length) {
        setTimeout(tick, 18 + Math.random() * 30);
      } else {
        el.classList.remove("active");
        idx += 1;
        setTimeout(typeNext, 250);
      }
    }

    tick();
  }

  // Mark kernel busy during boot
  if (kernelIndicator) {
    kernelIndicator.classList.remove("kernel-idle");
    kernelIndicator.classList.add("kernel-busy");
  }
  if (kernelText) {
    kernelText.textContent = "Python 3 | Busy";
  }

  typeNext();
}

function revealCells() {
  const sections = Array.from(document.querySelectorAll(".cell-section"));
  sections.forEach((section, i) => {
    setTimeout(() => {
      section.classList.add("visible");
    }, 120 * i);
  });
}

async function loadProjects() {
  const container = document.getElementById("projects-output");
  if (!container) return;

  try {
    const res = await fetch("/api/projects");
    if (!res.ok) throw new Error("Failed to fetch projects");
    const repos = await res.json();

    if (!Array.isArray(repos) || !repos.length) {
      container.innerHTML = '<span class="loading-inline"># no repositories found</span>';
      return;
    }

    const grid = document.createElement("div");
    grid.className = "projects-grid";

    repos.forEach((repo) => {
      const card = document.createElement("div");
      card.className = "project-card";

      const title = document.createElement("div");
      title.className = "project-title";
      title.textContent = repo.name || "unnamed-repo";

      const description = document.createElement("div");
      description.className = "project-description";
      description.textContent = repo.description || "# no description provided";

      const meta = document.createElement("div");
      meta.className = "project-meta";

      if (repo.language) {
        const lang = document.createElement("span");
        lang.textContent = `language: ${repo.language}`;
        meta.appendChild(lang);
      }

      if (repo.pushed_at) {
        const last = document.createElement("span");
        const date = new Date(repo.pushed_at);
        last.textContent = `last push: ${date.toLocaleDateString()}`;
        meta.appendChild(last);
      }

      const links = document.createElement("div");
      links.className = "project-links";

      const ghUrl = repo.html_url || repo.github_url;
      if (ghUrl) {
        const ghLink = document.createElement("a");
        ghLink.href = ghUrl;
        ghLink.target = "_blank";
        ghLink.rel = "noreferrer";
        ghLink.textContent = "GitHub";
        ghLink.className = "btn";
        ghLink.style.padding = "6px 14px";
        ghLink.style.fontSize = "0.85rem";
        links.appendChild(ghLink);
      }

      const liveUrl = repo.live_url || repo.homepage;
      if (liveUrl) {
        const liveLink = document.createElement("a");
        liveLink.href = liveUrl;
        liveLink.target = "_blank";
        liveLink.rel = "noreferrer";
        liveLink.innerHTML = "Live Demo ↗";
        liveLink.className = "btn";
        liveLink.style.padding = "6px 14px";
        liveLink.style.fontSize = "0.85rem";
        links.appendChild(liveLink);
      }

      if (typeof repo.stargazers_count === "number" && repo.stargazers_count > 0) {
        const stars = document.createElement("div");
        stars.className = "project-stars";
        stars.textContent = `★ ${repo.stargazers_count}`;
        card.appendChild(stars);
      }

      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(description);
      if (links.children.length) {
        card.appendChild(links);
      }

      grid.appendChild(card);
    });

    container.innerHTML = "";
    container.appendChild(grid);
  } catch (err) {
    console.error(err);
    container.innerHTML = '<span class="loading-inline"># error fetching repositories</span>';
  }
}

async function loadGitStats() {
  const container = document.getElementById("git-output");
  if (!container) return;

  try {
    const res = await fetch("/api/git_stats");
    if (!res.ok) throw new Error("Failed to fetch git stats");
    const stats = await res.json();

    const wrap = document.createElement("div");
    wrap.className = "git-stats";

    const created =
      stats.created_at != null ? new Date(stats.created_at).toLocaleDateString() : "N/A";

    const items = [
      { label: "Total Repositories", value: stats.public_repos ?? stats.repositories ?? "0" },
      { label: "Followers", value: stats.followers ?? "0" },
      { label: "Following", value: stats.following ?? "0" },
      { label: "Stars", value: stats.stars ?? "0" },
      { label: "Most Used Language", value: stats.top_language || "N/A" },
      {
        label: "Last Commit",
        value: stats.last_commit ? new Date(stats.last_commit).toLocaleDateString() : "N/A",
      },
      {
        label: "Account Created",
        value: created,
      },
    ];

    items.forEach((item) => {
      const div = document.createElement("div");
      div.className = "git-stat-item";

      const lab = document.createElement("div");
      lab.className = "git-stat-label";
      lab.textContent = item.label;

      const val = document.createElement("div");
      val.className = "git-stat-value";
      val.textContent = item.value;

      div.appendChild(lab);
      div.appendChild(val);
      wrap.appendChild(div);
    });

    container.innerHTML = "";
    container.appendChild(wrap);
  } catch (err) {
    console.error(err);
    container.innerHTML = '<span class="loading-inline"># error fetching git stats</span>';
  }
}

function setupContactForm() {
  const form = document.getElementById("contact-form");
  const statusEl = document.getElementById("contact-status");
  if (!form || !statusEl) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const payload = {
      name: formData.get("name") || "",
      email: formData.get("email") || "",
      message: formData.get("message") || "",
    };

    statusEl.textContent = "sending...";

    try {
      const res = await fetch("/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        statusEl.textContent = data.error || "failed to send message";
        statusEl.classList.remove("success");
        statusEl.classList.add("error");
      } else {
        statusEl.innerHTML = "Message sent successfully 🚀<br>I will get back to you soon.";
        statusEl.classList.remove("error");
        statusEl.classList.add("success");
        form.reset();
      }
    } catch (err) {
      console.error(err);
      statusEl.textContent = "error sending message";
      statusEl.classList.remove("success");
      statusEl.classList.add("error");
    }
  });
}

function setupNav() {
  const buttons = document.querySelectorAll(".toolbar-item[data-target]");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      if (!targetId) return;
      scrollToSection(targetId);
    });
  });
}

function scrollToSection(id) {
  const section = document.getElementById(id);
  if (!section) return;
  window.scrollTo({
    top: section.getBoundingClientRect().top + window.scrollY - 64,
    behavior: "smooth",
  });
}

function setupCommandInput() {
  const input = document.getElementById("command-input");
  if (!input) return;

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const raw = input.value.trim().toLowerCase();
      if (!raw) return;

      const map = {
        home: "home",
        projects: "projects",
        project: "projects",
        certificates: "certificates",
        certs: "certificates",
        git: "git",
        contact: "contact",
        about: "home",
      };

      const target = map[raw];
      if (target) {
        scrollToSection(target);
      }

      input.value = "";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupNav();
  setupCommandInput();
  setupContactForm();
  typeBootLines();
});

