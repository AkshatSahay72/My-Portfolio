import os

from flask import Flask, jsonify, render_template, request
from groq import Groq

from utils.github_api import get_github_stats, get_projects


app = Flask(__name__)


def get_certificates():
    """
    Fetch certificates directly from the Google Drive API using a folder ID.
    Returns a list of dicts with 'name' and 'link' keys.
    """
    api_key = os.getenv("GOOGLE_API_KEY")
    folder_id = "1VKo61wTGJfuQVPaBbfe-SqAXqJPH4Io-"
    certificates = []

    if api_key:
        url = f"https://www.googleapis.com/drive/v3/files?q='{folder_id}'+in+parents+and+trashed=false&key={api_key}&fields=files(id,name)"
        try:
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            
            for file in data.get("files", []):
                file_name = file.get("name", "").rsplit(".", 1)[0].replace("_", " ")
                file_id = file.get("id")
                certificates.append(
                    {
                        "name": file_name,
                        "link": f"https://drive.google.com/file/d/{file_id}/view",
                    }
                )
        except Exception as e:
            print(f"Error fetching certificates from Google Drive: {e}")
    else:
        print("GOOGLE_API_KEY environment variable not set. Cannot fetch certificates.")

    print("Loaded certificates from Google Drive:", certificates)
    return certificates


def get_profile_image_path() -> str:
    """
    Resolve the actual profile image path under static/images, allowing
    for different file extensions while keeping the template simple.
    """
    images_folder = os.path.join(app.static_folder, "images")
    candidates = [
        "Profile_Picture.jpg",
        "Profile_Picture.jpeg",
        "Profile_Picture.png",
        "Profile_Picture.webp",
        "Profile_Picture.JPG",
        "Profile_Picture.JPEG",
        "Profile_Picture.PNG",
        "Profile_Picture.WEBP",
    ]

    if os.path.isdir(images_folder):
        existing = set(os.listdir(images_folder))
        for name in candidates:
            if name in existing:
                return f"images/{name}"

    # Fallback to the default expected path
    return "images/Profile_Picture.jpg"


@app.route("/")
def home():
    certificates = get_certificates()
    profile_image = get_profile_image_path()
    return render_template(
        "index.html",
        certificates=certificates,
        profile_image=profile_image,
        github_username="AkshatSahay72"
    )


@app.route("/api/projects")
def api_projects():
    repos = get_projects("AkshatSahay72")
    return jsonify(repos)


@app.route("/api/git_stats")
def api_git_stats():
    stats = get_github_stats("AkshatSahay72")
    return jsonify(stats)


import requests

@app.route("/contact", methods=["POST"])
def contact():
    """
    Receive contact form submissions and forward them via Resend API.
    """
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    message = (data.get("message") or "").strip()

    if not name or not email or not message:
        return jsonify({"ok": False, "error": "Missing required fields"}), 400

    RESEND_API_KEY = os.getenv("RESEND_API_KEY")

    if not RESEND_API_KEY:
        return jsonify({"ok": False, "error": "Email service not configured on server (Missing Resend API Key)."}), 500

    url = "https://api.resend.com/emails"

    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "from": "Portfolio <onboarding@resend.dev>",
        "to": ["akshatsahay19@gmail.com"],
        "subject": f"Portfolio Contact from {name}",
        "html": f"""
        <h3>New Contact Message</h3>
        <p><b>Name:</b> {name}</p>
        <p><b>Email:</b> {email}</p>
        <p><b>Message:</b><br>{message}</p>
        """
    }

    try:
        res = requests.post(url, headers=headers, json=payload)
        res.raise_for_status()
    except Exception as exc:
        return jsonify({"ok": False, "error": str(exc)}), 500

    return jsonify({"ok": True, "status": "success"})


@app.route("/chat", methods=["POST"])
def chat():
    """
    Receive chat messages and return Groq AI responses.
    """
    data = request.get_json(silent=True) or {}
    user_message = (data.get("message") or "").strip()

    if not user_message:
        return jsonify({"ok": False, "error": "Missing message content"}), 400

    GROQ_API_KEY = os.getenv("GROQ_API_KEY")

    if not GROQ_API_KEY:
        return jsonify({"ok": False, "error": "AI service not configured on server (Missing Groq API Key)."}), 500

    try:
        client = Groq(api_key=GROQ_API_KEY)
        
        system_prompt = (
            "You are an AI assistant for Akshat Sahay's portfolio website. "
            "Help visitors learn about his machine learning projects, programming skills, GitHub work, and experience. "
            "Answer clearly and professionally."
        )

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_message
                }
            ],
            model="llama-3.1-8b-instant",
        )

        reply = chat_completion.choices[0].message.content
        return jsonify({"ok": True, "reply": reply})

    except Exception as exc:
        print(f"Error communicating with Groq API: {exc}")
        return jsonify({"ok": False, "error": "Failed to generate AI response. Please try again later."}), 500


if __name__ == "__main__":
    # Prefer a "safe" non-privileged port by default (8000 instead of 5000),
    # but allow overriding via the PORT environment variable.
    port = int(os.getenv("PORT", "8000"))
    try:
        # Disable the auto-reloader to avoid noisy restart loops on Windows.
        app.run(debug=True, use_reloader=False, port=port)
    except OSError as exc:
        # Common cause: port already in use or blocked by local policy.
        print(f"[Server] Failed to start on port {port}: {exc}")

