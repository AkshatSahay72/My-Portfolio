import os
from collections import Counter
from datetime import datetime
from typing import Any, Dict, List

import requests


GITHUB_API_BASE = "https://api.github.com"


def _github_headers() -> Dict[str, str]:
    token = os.getenv("GITHUB_TOKEN")
    headers = {
        "Accept": "application/vnd.github+json",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def fetch_repos(username: str) -> List[Dict[str, Any]]:
    """
    Fetch non-fork repositories for the given user from GitHub.
    """
    url = f"{GITHUB_API_BASE}/users/{username}/repos"
    params = {
        "per_page": 100,
        "sort": "pushed",
        "direction": "desc",
    }
    resp = requests.get(url, headers=_github_headers(), params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    repos = []
    for repo in data:
        if repo.get("fork"):
            continue
        repos.append(
            {
                "name": repo.get("name"),
                "full_name": repo.get("full_name"),
                "description": repo.get("description"),
                "html_url": repo.get("html_url"),
                "homepage": repo.get("homepage"),
                "language": repo.get("language"),
                "stargazers_count": repo.get("stargazers_count", 0),
                "created_at": repo.get("created_at"),
                "pushed_at": repo.get("pushed_at"),
            }
        )

    # Sort by stars then recent activity
    repos.sort(
        key=lambda r: (r.get("stargazers_count", 0), r.get("pushed_at") or ""),
        reverse=True,
    )
    return repos


def get_git_stats(username: str) -> Dict[str, Any]:
    repos = fetch_repos(username)
    repo_count = len(repos)
    total_stars = sum(r.get("stargazers_count", 0) for r in repos)

    languages = [r.get("language") for r in repos if r.get("language")]
    top_language = None
    if languages:
        counts = Counter(languages)
        top_language = counts.most_common(1)[0][0]

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

    return {
        "repositories": repo_count,
        "stars": total_stars,
        "top_language": top_language or "N/A",
        "last_commit": last_commit,
    }

