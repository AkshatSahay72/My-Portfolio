import os
from collections import Counter
from datetime import datetime
from typing import Any, Dict, List

import requests

GITHUB_API_BASE = "https://api.github.com"


def _github_headers() -> Dict[str, str]:
    """
    Build common GitHub API headers.

    - Always send Accept + User-Agent as required by GitHub.
    - Optionally include an Authorization header when GITHUB_TOKEN is set.
    """
    token = os.getenv("GITHUB_TOKEN")
    user_agent = os.getenv("GITHUB_USER_AGENT", "akshat-portfolio/1.0")

    headers: Dict[str, str] = {
        "Accept": "application/vnd.github+json",
        "User-Agent": user_agent,
    }

    if token:
        headers["Authorization"] = f"Bearer {token}"
    else:
        # Helpful log in hosted environments like Render.
        print(
            "[GitHub] Warning: GITHUB_TOKEN not configured; "
            "unauthenticated requests may hit rate limits."
        )

    return headers


def get_projects(username: str) -> List[Dict[str, Any]]:
    """
    Fetch non-fork repositories for the given user from GitHub.
    Handles errors gracefully and logs useful debugging information.
    """
    url = f"{GITHUB_API_BASE}/users/{username}/repos"
    params = {
        "per_page": 100,
        "sort": "pushed",
        "direction": "desc",
    }

    headers = _github_headers()

    try:
        resp = requests.get(url, headers=headers, params=params, timeout=10)
    except requests.RequestException as exc:
        print(f"[GitHub] Request error when fetching repos: {exc}")
        return []

    remaining = resp.headers.get("X-RateLimit-Remaining")
    limit = resp.headers.get("X-RateLimit-Limit")
    reset = resp.headers.get("X-RateLimit-Reset")
    print(
        f"[GitHub] GET {url} status={resp.status_code} "
        f"remaining={remaining} limit={limit} reset={reset}"
    )

    if resp.status_code != 200:
        # Log a short snippet of the body to help debug on Render.
        body_preview = resp.text[:500]
        print(f"[GitHub] Repo API error body snippet: {body_preview}")
        return []

    try:
        data = resp.json()
    except ValueError as exc:
        print(f"[GitHub] Failed to decode repo JSON: {exc}")
        return []

    repos: List[Dict[str, Any]] = []
    for repo in data:
        # 1) Exclude forks
        if repo.get("fork"):
            continue

        # 2) Exclude repositories with no description
        description = repo.get("description")
        if not description:
            continue

        # 3) Exclude very low-activity repositories (0 stars)
        stars = repo.get("stargazers_count", 0) or 0
        if stars <= 0:
            continue

        # 6) Only keep the required fields
        repos.append(
            {
                "name": repo.get("name"),
                "description": description,
                "html_url": repo.get("html_url"),
                "language": repo.get("language"),
                "stargazers_count": stars,
                "pushed_at": repo.get("pushed_at"),
            }
        )

    # 5) Sort by stars then recent activity (pushed_at), both descending
    repos.sort(
        key=lambda r: (
            r.get("stargazers_count", 0),
            r.get("pushed_at") or "",
        ),
        reverse=True,
    )

    # 4) Limit to top 6 most relevant repositories
    repos = repos[:6]

    return repos


def get_github_stats(username: str) -> Dict[str, Any]:
    """
    Aggregate repository statistics and user profile information.
    """
    repos = get_projects(username)
    repo_count = len(repos)
    total_stars = sum(r.get("stargazers_count", 0) for r in repos)

    languages = [r.get("language") for r in repos if r.get("language")]
    top_language = None
    if languages:
        counts = Counter(languages)
        top_language = counts.most_common(1)[0][0]

    # Derive last commit date from pushed_at timestamps
    last_commit = None
    dates = []
    for r in repos:
        pushed = r.get("pushed_at")
        if pushed:
            try:
                dt = datetime.fromisoformat(pushed.replace("Z", "+00:00"))
                dates.append(dt)
            except Exception:
                continue
    if dates:
        last_commit = max(dates).isoformat()

    # Fetch user profile information
    user_url = f"{GITHUB_API_BASE}/users/{username}"
    try:
        user_resp = requests.get(
            user_url,
            headers=_github_headers(),
            timeout=10,
        )
    except requests.RequestException as exc:
        print(f"[GitHub] Request error when fetching user: {exc}")
        user = {}
    else:
        remaining = user_resp.headers.get("X-RateLimit-Remaining")
        limit = user_resp.headers.get("X-RateLimit-Limit")
        reset = user_resp.headers.get("X-RateLimit-Reset")
        print(
            f"[GitHub] GET {user_url} status={user_resp.status_code} "
            f"remaining={remaining} limit={limit} reset={reset}"
        )

        if user_resp.status_code != 200:
            print(
                "[GitHub] User API error body snippet:",
                user_resp.text[:500],
            )
            user = {}
        else:
            try:
                user = user_resp.json()
            except ValueError as exc:
                print(f"[GitHub] Failed to decode user JSON: {exc}")
                user = {}

    stats = {
        "repositories": repo_count,
        "stars": total_stars,
        "top_language": top_language or "N/A",
        "last_commit": last_commit,
        "followers": user.get("followers"),
        "following": user.get("following"),
        "public_repos": user.get("public_repos"),
        "created_at": user.get("created_at"),
    }
    return stats