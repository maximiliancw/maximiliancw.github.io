const GITHUB_USERNAME = "maximiliancw";

// Language colors mapping
const langColors = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Go: "#00ADD8",
  Rust: "#dea584",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Vue: "#41b883",
  Jupyter: "#DA5B0B",
  "Jupyter Notebook": "#DA5B0B",
  Dockerfile: "#384d54",
};

// Initialize GitHub Calendar
GitHubCalendar("#github-calendar", GITHUB_USERNAME, {
  responsive: true,
  tooltips: true,
  global_stats: false,
}).then(() => {
  // Remove the helper links after calendar loads
  const calendarEl = document.getElementById("github-calendar");
  const links = calendarEl.querySelectorAll("a");
  links.forEach((link) => link.remove());
});

// Fetch GitHub user data
async function fetchGitHubData() {
  try {
    const [userRes, reposRes, eventsRes] = await Promise.all([
      fetch(`https://api.github.com/users/${GITHUB_USERNAME}`),
      fetch(
        `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`
      ),
      fetch(
        `https://api.github.com/users/${GITHUB_USERNAME}/events/public?per_page=30`
      ),
    ]);

    const user = await userRes.json();
    const repos = await reposRes.json();
    const events = await eventsRes.json();

    // Update stats
    document.getElementById("stat-repos").textContent = user.public_repos || 0;
    document.getElementById("stat-followers").textContent = user.followers || 0;
    document.getElementById("stat-following").textContent = user.following || 0;
    document.getElementById("stat-gists").textContent = user.public_gists || 0;

    // Render top repos (sorted by stars, then by recent push)
    renderTopRepos(repos);

    // Render activity feed
    renderActivityFeed(events);
  } catch (error) {
    console.error("Error fetching GitHub data:", error);
  }
}

function renderTopRepos(repos) {
  // Filter out forks and sort by stars, then by updated_at
  const topRepos = repos
    .filter((repo) => !repo.fork)
    .sort((a, b) => {
      if (b.stargazers_count !== a.stargazers_count) {
        return b.stargazers_count - a.stargazers_count;
      }
      return new Date(b.pushed_at) - new Date(a.pushed_at);
    })
    .slice(0, 4);

  const container = document.getElementById("repos-grid");
  container.innerHTML = topRepos
    .map(
      (repo) => `
          <a href="${repo.html_url}" target="_blank" class="repo-card">
            <div class="repo-header">
              <div class="repo-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <span class="repo-name">${repo.name}</span>
            </div>
            <p class="repo-desc">${
              repo.description || "No description available"
            }</p>
            <div class="repo-meta">
              ${
                repo.language
                  ? `
                <span>
                  <span class="lang-dot" style="background: ${
                    langColors[repo.language] || "#8b949e"
                  }"></span>
                  ${repo.language}
                </span>
              `
                  : ""
              }
              <span>
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>
                </svg>
                ${repo.stargazers_count}
              </span>
              <span>
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-.878a2.25 2.25 0 111.5 0v.878a2.25 2.25 0 01-2.25 2.25h-1.5v2.128a2.251 2.251 0 11-1.5 0V8.5h-1.5A2.25 2.25 0 013 6.25v-.878a2.25 2.25 0 111.5 0zM5 3.25a.75.75 0 10-1.5 0 .75.75 0 001.5 0zm6.75.75a.75.75 0 100-1.5.75.75 0 000 1.5zm-3 8.75a.75.75 0 10-1.5 0 .75.75 0 001.5 0z"/>
                </svg>
                ${repo.forks_count}
              </span>
            </div>
          </a>
        `
    )
    .join("");
}

function renderActivityFeed(events) {
  const relevantEvents = events
    .filter((e) =>
      [
        "PushEvent",
        "CreateEvent",
        "WatchEvent",
        "ForkEvent",
        "PullRequestEvent",
        "IssuesEvent",
      ].includes(e.type)
    )
    .slice(0, 6);

  const container = document.getElementById("activity-list");
  container.innerHTML = relevantEvents
    .map((event) => {
      const { type, repo, payload, created_at } = event;
      let icon = "",
        iconClass = "",
        text = "";
      const repoName = repo.name.split("/")[1];
      const repoLink = `<a href="https://github.com/${repo.name}" target="_blank">${repoName}</a>`;

      switch (type) {
        case "PushEvent":
          const commits = payload.size || payload.commits?.length || 1;
          icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><line x1="1.05" y1="12" x2="7" y2="12"/><line x1="17.01" y1="12" x2="22.96" y2="12"/></svg>`;
          iconClass = "push";
          text = `Pushed <strong>${commits} commit${
            commits !== 1 ? "s" : ""
          }</strong> to ${repoLink}`;
          break;
        case "CreateEvent":
          const refType = payload.ref_type;
          icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
          iconClass = "create";
          text = `Created ${refType} ${
            payload.ref ? `<strong>${payload.ref}</strong> in ` : ""
          }${repoLink}`;
          break;
        case "WatchEvent":
          icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
          iconClass = "star";
          text = `Starred ${repoLink}`;
          break;
        case "ForkEvent":
          icon = `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-.878a2.25 2.25 0 111.5 0v.878a2.25 2.25 0 01-2.25 2.25h-1.5v2.128a2.251 2.251 0 11-1.5 0V8.5h-1.5A2.25 2.25 0 013 6.25v-.878a2.25 2.25 0 111.5 0zM5 3.25a.75.75 0 10-1.5 0 .75.75 0 001.5 0zm6.75.75a.75.75 0 100-1.5.75.75 0 000 1.5zm-3 8.75a.75.75 0 10-1.5 0 .75.75 0 001.5 0z"/></svg>`;
          iconClass = "fork";
          text = `Forked ${repoLink}`;
          break;
        case "PullRequestEvent":
          icon = `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 3.25a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zm5.677-.177L9.573.677A.25.25 0 0110 .854V2.5h1A2.5 2.5 0 0113.5 5v5.628a2.251 2.251 0 11-1.5 0V5a1 1 0 00-1-1h-1v1.646a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm0 9.5a.75.75 0 100 1.5.75.75 0 000-1.5zm8.25.75a.75.75 0 10-1.5 0 .75.75 0 001.5 0z"/></svg>`;
          iconClass = "fork";
          text = `${
            payload.action === "opened" ? "Opened" : "Updated"
          } PR in ${repoLink}`;
          break;
        case "IssuesEvent":
          icon = `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/><path d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"/></svg>`;
          iconClass = "create";
          text = `${
            payload.action === "opened" ? "Opened" : "Updated"
          } issue in ${repoLink}`;
          break;
        default:
          return "";
      }

      return `
            <div class="activity-item">
              <div class="activity-icon ${iconClass}">${icon}</div>
              <div class="activity-content">
                <div class="activity-text">${text}</div>
                <div class="activity-time">${timeAgo(created_at)}</div>
              </div>
            </div>
          `;
    })
    .join("");
}

function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval !== 1 ? "s" : ""} ago`;
    }
  }
  return "Just now";
}

// Load data when page is ready
document.addEventListener("DOMContentLoaded", fetchGitHubData);

// Navigation functionality
document.addEventListener("DOMContentLoaded", function () {
  const nav = document.getElementById("main-nav");
  const navLinks = document.querySelectorAll(".nav-link");
  const navToggle = document.getElementById("nav-toggle");
  const navLinksContainer = document.getElementById("nav-links");
  const sections = document.querySelectorAll("section[id], header[id]");

  // Mobile menu toggle
  if (navToggle) {
    navToggle.addEventListener("click", function () {
      navLinksContainer.classList.toggle("open");
      navToggle.textContent = navLinksContainer.classList.contains("open")
        ? "✕"
        : "☰";
    });
  }

  // Close mobile menu when clicking a link
  navLinks.forEach((link) => {
    link.addEventListener("click", function () {
      if (window.innerWidth <= 768) {
        navLinksContainer.classList.remove("open");
        navToggle.textContent = "☰";
      }
    });
  });

  // Smooth scrolling for navigation links
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href.startsWith("#")) {
        e.preventDefault();
        const targetId = href.substring(1);
        const targetElement =
          document.getElementById(targetId) || document.querySelector("header");

        if (targetElement) {
          const navHeight = nav.offsetHeight;
          const targetPosition =
            targetElement.getBoundingClientRect().top +
            window.pageYOffset -
            navHeight;

          window.scrollTo({
            top: targetPosition,
            behavior: "smooth",
          });
        }
      }
    });
  });

  // Update active nav link based on scroll position
  function updateActiveNavLink() {
    const scrollPosition = window.pageYOffset + nav.offsetHeight + 100;

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute("id");

      if (
        scrollPosition >= sectionTop &&
        scrollPosition < sectionTop + sectionHeight
      ) {
        navLinks.forEach((link) => {
          link.classList.remove("active");
          if (link.getAttribute("href") === `#${sectionId}`) {
            link.classList.add("active");
          }
        });
      }
    });

    // Handle home/header section
    if (window.pageYOffset < 200) {
      navLinks.forEach((link) => {
        link.classList.remove("active");
        if (link.getAttribute("href") === "#home") {
          link.classList.add("active");
        }
      });
    }
  }

  // Navbar scroll effect
  function handleNavScroll() {
    if (window.scrollY > 50) {
      nav.classList.add("scrolled");
    } else {
      nav.classList.remove("scrolled");
    }
  }

  // Throttle scroll events for better performance
  let ticking = false;
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        updateActiveNavLink();
        handleNavScroll();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener("scroll", onScroll);
  updateActiveNavLink(); // Initial call
  handleNavScroll(); // Initial call

  // Close mobile menu when clicking outside
  document.addEventListener("click", function (e) {
    if (
      window.innerWidth <= 768 &&
      !nav.contains(e.target) &&
      navLinksContainer.classList.contains("open")
    ) {
      navLinksContainer.classList.remove("open");
      navToggle.textContent = "☰";
    }
  });
});
