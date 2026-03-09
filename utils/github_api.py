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


def get_projects(username: str) -> List[Dict[str, Any]]:
    url = f"{GITHUB_API_BASE}/users/{username}/repos"

    params = {
        "per_page": 100,
        "sort": "pushed",
        "direction": "desc",
    }

    headers = _github_headers()
    headers["User-Agent"] = "portfolio-app"

    try:
        resp = requests.get(url, headers=headers, params=params, timeout=10)

        if resp.status_code != 200:
            print("GitHub API error:", resp.status_code, resp.text)
            return []

        data = resp.json()

    except Exception as e:
        print("GitHub API request failed:", e)
        return []

    repos: List[Dict[str, Any]] = []

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

    repos.sort(key=lambda r: r.get("pushed_at") or "", reverse=True)

    return repos


def get_github_stats(username: str) -> Dict[str, Any]:
    repos = get_projects(username)

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
                pass

    if dates:
        last_commit = max(dates).isoformat()

    user_url = f"{GITHUB_API_BASE}/users/{username}"

    try:
        user_resp = requests.get(
            user_url,
            headers=_github_headers(),
            timeout=10
        )

        if user_resp.status_code != 200:
            print("GitHub user API error:", user_resp.status_code)
            user = {}
        else:
            user = user_resp.json()

    except Exception as e:
        print("GitHub user request failed:", e)
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