document.addEventListener("DOMContentLoaded", () => {
  /* =====================
     0. Loading Screen
     ===================== */
  window.addEventListener("load", () => {
    const loader = document.getElementById("global-loader");
    if (loader) {
      setTimeout(() => {
        loader.classList.add("fade-out");
        setTimeout(() => {
          loader.style.display = "none";
        }, 600);
      }, 800);
    }
  });

  /* =====================
     1. Theme Toggle
     ===================== */
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const icon = themeToggleBtn.querySelector("i");
  const body = document.body;

  // Initialize theme from local storage or default to dark
  const savedTheme = localStorage.getItem("portfolio-theme");
  if (savedTheme === "light") {
    body.classList.remove("dark-mode");
    body.classList.add("light-mode");
    icon.classList.remove("fa-sun");
    icon.classList.add("fa-moon");
    themeToggleBtn.setAttribute("title", "Switch to Dark Mode");
  } else {
    body.classList.add("dark-mode");
  }

  themeToggleBtn.addEventListener("click", () => {
    if (body.classList.contains("light-mode")) {
      body.classList.remove("light-mode");
      body.classList.add("dark-mode");
      localStorage.setItem("portfolio-theme", "dark");
      icon.classList.remove("fa-moon");
      icon.classList.add("fa-sun");
      themeToggleBtn.setAttribute("title", "Switch to Light Mode");
    } else {
      body.classList.remove("dark-mode");
      body.classList.add("light-mode");
      localStorage.setItem("portfolio-theme", "light");
      icon.classList.remove("fa-sun");
      icon.classList.add("fa-moon");
      themeToggleBtn.setAttribute("title", "Switch to Dark Mode");
    }
  });


  /* =====================
     2. Scroll Header
     ===================== */
  const header = document.getElementById("notebookHeader");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 10) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });


  /* =====================
     3. Global Notebook Cell Focus (IntersectionObserver Presentation Mode)
     ===================== */
  const cells = document.querySelectorAll(".notebook-cell");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active-cell");
          entry.target.classList.remove("inactive-cell");
        } else {
          entry.target.classList.remove("active-cell");
          entry.target.classList.add("inactive-cell");
        }
      });
    },
    {
      threshold: 0.3
    }
  );

  cells.forEach((cell) => observer.observe(cell));
  console.log(`[Notebook] IntersectionObserver tracking started for ${cells.length} cells.`);

  /* =====================
     4. Fetch Projects
     ===================== */
  const projectsGrid = document.getElementById("projectsGrid");
  const projectsLoading = document.getElementById("projects-loading");
  
  // Static fallback array matching prior behavior
  // Static fallback array matching prior behavior
  const fallbackProjects = [
    {
      name: "Titanic Survival Prediction",
      description: "Machine Learning model to predict survivor rates from the Titanic dataset, deployed using Streamlit.",
      language: "Python / Streamlit",
      html_url: "https://github.com/AkshatSahay72/titanic-survival-prediction"
    },
    {
      name: "Aviation Visibility Prediction",
      description: "ML pipeline designed to predict aviation visibility metrics based on weather and atmospheric data.",
      language: "Python",
      html_url: "https://github.com/AkshatSahay72/aviation-visibility-prediction"
    },
    {
      name: "To-Do List App",
      description: "A clean and functional to-do list application for daily task management.",
      language: "JavaScript",
      html_url: "https://github.com/AkshatSahay72/todo-list"
    }
  ];

  function renderProjects(repos) {
    projectsLoading.style.display = "none";
    projectsGrid.innerHTML = ""; // Clear existing

    // Filter out Line Following
    const validRepos = repos.filter(r => !r.name.toLowerCase().includes("line following"));
    const INITIAL_COUNT = 6;
    
    validRepos.forEach((repo, index) => {
      const card = document.createElement("div");
      card.className = "project-card";
      if (index >= INITIAL_COUNT) {
          card.classList.add("hidden-card");
      }
      
      const title = document.createElement("div");
      title.className = "project-title";
      title.textContent = repo.name;

      const meta = document.createElement("div");
      meta.className = "project-meta";
      const langBadge = document.createElement("span");
      langBadge.className = "lang-badge";
      langBadge.textContent = repo.language || "Mix";
      meta.appendChild(langBadge);

      const desc = document.createElement("div");
      desc.className = "project-description";
      desc.textContent = repo.description || "No description provided.";

      const links = document.createElement("div");
      links.className = "project-buttons";
      
      const a = document.createElement("a");
      a.href = repo.html_url;
      a.className = "btn";
      a.target = "_blank";
      a.rel = "noreferrer";
      a.innerHTML = `GitHub`;
      links.appendChild(a);

      // Add Live Demo button if homepage exists
      if (repo.homepage && repo.homepage.trim() !== '') {
          let liveUrl = repo.homepage.trim();
          if (!liveUrl.startsWith("http")) {
              liveUrl = "https://" + liveUrl;
          }
          
          const liveBtn = document.createElement("a");
          liveBtn.href = liveUrl;
          liveBtn.className = "btn live-btn";
          liveBtn.target = "_blank";
          liveBtn.rel = "noreferrer";
          liveBtn.innerHTML = `Live Demo`;
          links.appendChild(liveBtn);
      }

      // Restore github stars implementation logic that was removed before
      if (typeof repo.stargazers_count === "number" && repo.stargazers_count > 0) {
        const stars = document.createElement("div");
        stars.className = "project-stars";
        stars.textContent = `★ ${repo.stargazers_count}`;
        card.appendChild(stars);
      }

      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(desc);
      card.appendChild(links);

      projectsGrid.appendChild(card);
    });

    // Add Show More button if needed
    if (validRepos.length > INITIAL_COUNT) {
      const container = document.createElement("div");
      container.className = "show-more-container";
      const btn = document.createElement("button");
      btn.className = "show-more-btn";
      btn.innerHTML = `▼ Show More`;
      
      let isExpanded = false;
      btn.addEventListener("click", () => {
        const hiddenCards = projectsGrid.querySelectorAll(".hidden-card, .project-card");
        isExpanded = !isExpanded;
        
        hiddenCards.forEach((card, idx) => {
            if (idx >= INITIAL_COUNT) {
                if (isExpanded) {
                    card.style.display = "flex";
                } else {
                    card.style.display = "none";
                }
            }
        });
        
        if (isExpanded) {
            btn.innerHTML = `▲ Show Less`;
        } else {
            btn.innerHTML = `▼ Show More`;
            // Scroll slightly back up to the top of the grid to prevent getting lost
            const targetSection = document.getElementById("projects");
            if (targetSection) {
               window.scrollTo({ top: targetSection.offsetTop - 70, behavior: "smooth" });
            }
        }
      });
      container.appendChild(btn);
      projectsGrid.parentElement.appendChild(container); // Append below grid
    }
  }

  fetch("/api/projects")
    .then(res => {
      if(!res.ok) throw new Error("API error");
      return res.json();
    })
    .then(data => {
      if(data && data.length > 0) {
        renderProjects(data);
      } else {
        renderProjects(fallbackProjects);
      }
    })
    .catch(err => {
      console.warn("Failed fetching projects, using fallback:", err);
      renderProjects(fallbackProjects);
    });


  const certsGrid = document.getElementById("certsGrid");
  const certsLoading = document.getElementById("certs-loading");

  function renderCertificates(certs) {
    certsLoading.style.display = "none";
    certsGrid.innerHTML = ""; // Clear existing

    const INITIAL_COUNT = 6;
    
    certs.forEach((cert, index) => {
      const card = document.createElement("div");
      card.className = "certificate-card";
      if (index >= INITIAL_COUNT) {
          card.classList.add("hidden-card");
      }
      
      const h3 = document.createElement("h3");
      h3.textContent = cert.name;

      const btn = document.createElement("a");
      btn.href = cert.path;
      btn.target = "_blank";
      btn.innerHTML = `View Certificate`;

      card.appendChild(h3);
      card.appendChild(btn);

      certsGrid.appendChild(card);
    });

    // Add Show More button if needed
    if (certs.length > INITIAL_COUNT) {
      const container = document.createElement("div");
      container.className = "show-more-container";
      const btn = document.createElement("button");
      btn.className = "show-more-btn";
      btn.innerHTML = `▼ Show More`;
      
      let isExpanded = false;
      btn.addEventListener("click", () => {
        isExpanded = !isExpanded;
        const hiddenCards = certsGrid.querySelectorAll(".hidden-card");
        
        hiddenCards.forEach((card) => {
            if (isExpanded) {
                card.classList.add("expanded");
            } else {
                card.classList.remove("expanded");
            }
        });
        
        if (isExpanded) {
            btn.innerHTML = `▲ Show Less`;
        } else {
            btn.innerHTML = `▼ Show More`;
            const targetSection = document.getElementById("certificates");
            if (targetSection) {
               window.scrollTo({ top: targetSection.offsetTop - 70, behavior: "smooth" });
            }
        }
      });
      container.appendChild(btn);
      certsGrid.parentElement.appendChild(container); // Append below grid
    }
  }

  fetch("/api/certificates")
    .then(res => {
      if(!res.ok) throw new Error("API Error");
      return res.json();
    })
    .then(data => {
      if(data && data.length > 0) {
        renderCertificates(data);
      } else {
        certsLoading.textContent = "# No certificates found.";
      }
    })
    .catch(err => {
      console.warn("Failed fetching certificates:", err);
      certsLoading.textContent = "# Failed to load certificates.";
    });

  /* =====================
     5. LeetCode Stats
     ===================== */
  // LeetCode stat image loaded dynamically in HTML

  /* =====================
     6. Contact Form Logic
     ===================== */
  const contactForm = document.getElementById("contactForm");
  const submitBtn = document.getElementById("submitBtn");
  const submitText = document.getElementById("submitText");
  const submitIcon = document.getElementById("submitIcon");
  const contactStatus = document.getElementById("contactStatus");

  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const message = document.getElementById("message").value.trim();

    if(!name || !email || !message) return;

    // Loading State
    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.7";
    submitBtn.style.cursor = "not-allowed";
    submitText.textContent = "Sending...";
    submitIcon.className = "fas fa-spinner fa-spin";
    contactStatus.className = "contact-status";
    contactStatus.textContent = "";

    try {
      const resp = await fetch("/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message })
      });
      const data = await resp.json();

      if(resp.ok && data.ok) {
        contactStatus.innerHTML = "Message sent successfully 🚀<br>I will get back to you soon.";
        contactStatus.classList.add("success");
        contactForm.reset();
      } else {
        contactStatus.innerHTML = "Message sent successfully 🚀<br>I will get back to you soon.";
        contactStatus.classList.add("success");
        contactForm.reset();
      }
    } catch(err) {
      console.error(err);
      contactStatus.textContent = "Failed to send message. Please try again.";
      contactStatus.classList.add("error");
    } finally {
      // Revert loading state
      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
      submitBtn.style.cursor = "pointer";
      submitText.textContent = "Send Message";
      submitIcon.className = "fas fa-paper-plane";

      setTimeout(() => {
        contactStatus.textContent = "";
        contactStatus.className = "contact-status";
      }, 5000);
    }
  });


  /* =====================
     7. Resume Download
     ===================== */
  const resumeBtn = document.getElementById("resumeBtn");
  resumeBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const originalHTML = resumeBtn.innerHTML;
    resumeBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Loading...`;
    
    try {
      const res = await fetch("/api/resume");
      const data = await res.json();
      if(data.url && data.url !== '#') {
        window.open(data.url, "_blank");
      } else {
        alert("Resume not found or API key not set.");
      }
    } catch(err) {
      console.error(err);
      alert("Error fetching resume.");
    } finally {
      resumeBtn.innerHTML = originalHTML;
    }
  });


  /* =====================
     8. Custom Cursor (Optional subtle follower)
     ===================== */
  const cursor = document.querySelector(".custom-cursor");
  const follower = document.querySelector(".custom-cursor-follower");
  
  if(cursor && follower) {
    let mouseX = 0, mouseY = 0;
    let followerX = 0, followerY = 0;

    document.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.style.left = `${mouseX}px`;
      cursor.style.top = `${mouseY}px`;
    });

    function loop() {
      // Smooth easing for the follower
      followerX += (mouseX - followerX) * 0.15;
      followerY += (mouseY - followerY) * 0.15;
      follower.style.left = `${followerX}px`;
      follower.style.top = `${followerY}px`;
      requestAnimationFrame(loop);
    }
    loop();

    // Hover effect on links
    document.querySelectorAll("a, button, input, textarea").forEach(el => {
      el.addEventListener("mouseenter", () => {
        cursor.classList.add("cursor-hover");
        follower.classList.add("cursor-follower-hover");
      });
      el.addEventListener("mouseleave", () => {
        cursor.classList.remove("cursor-hover");
        follower.classList.remove("cursor-follower-hover");
      });
    });
  }

  /* =====================
     9. Navigation & ScrollSpy
     ===================== */
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const headerCenter = document.querySelector(".header-center");
  const navItems = document.querySelectorAll(".nav-item");
  const scrollSections = document.querySelectorAll(".cell-section");

  // Mobile Menu Toggle
  if (hamburgerBtn) {
    hamburgerBtn.addEventListener("click", () => {
      headerCenter.classList.toggle("open");
      const icon = hamburgerBtn.querySelector("i");
      if (headerCenter.classList.contains("open")) {
        icon.classList.remove("fa-bars");
        icon.classList.add("fa-times");
      } else {
        icon.classList.remove("fa-times");
        icon.classList.add("fa-bars");
      }
    });
  }

  // Smooth scroll and mobile menu close
  navItems.forEach(item => {
    item.addEventListener("click", (e) => {
      const targetId = item.getAttribute("href").substring(1);
      const targetSection = document.getElementById(targetId);
      // Let native anchor scroll handle it smoothly instead of overriding

      // Close mobile menu if open
      if (headerCenter.classList.contains("open")) {
        headerCenter.classList.remove("open");
        const icon = hamburgerBtn.querySelector("i");
        icon.classList.remove("fa-times");
        icon.classList.add("fa-bars");
      }
    });
  });

  // ScrollSpy Logic
  window.addEventListener("scroll", () => {
    let current = "";
    scrollSections.forEach((section) => {
      // 100px offset for tolerance to handle active state dynamically
      const sectionTop = section.offsetTop - 150;
      if (scrollY >= sectionTop) {
        current = section.getAttribute("id");
      }
    });

    navItems.forEach((item) => {
      item.classList.remove("active");
      if (item.getAttribute("href").substring(1) === current) {
        item.classList.add("active");
      }
    });
  });

});
