import os

from flask import Flask, jsonify, render_template, request

from utils.github_api import get_github_stats, get_projects


app = Flask(__name__)


def get_certificates():
    """
    Scan the local static/certificates folder for certificate files.

    Includes all files regardless of extension.
    """
    folder = os.path.join(app.static_folder, "certificates")
    certificates = []

    if os.path.exists(folder):
        for file in os.listdir(folder):
            certificates.append(
                {
                    "name": file.rsplit(".", 1)[0].replace("_", " "),
                    "path": f"/static/certificates/{file}",
                }
            )

    print("Loaded certificates:", certificates)
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
    )


@app.route("/api/projects")
def api_projects():
    repos = get_projects("AkshatSahay72")
    return jsonify(repos)


@app.route("/api/git_stats")
def api_git_stats():
    stats = get_github_stats("AkshatSahay72")
    return jsonify(stats)


@app.route("/api/contact", methods=["POST"])
def api_contact():
    """
    Receive contact form submissions and (optionally) forward them via email.
    """
    from smtplib import SMTP, SMTPException

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    message = (data.get("message") or "").strip()

    if not name or not email or not message:
        return jsonify({"ok": False, "error": "Missing required fields"}), 400

    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    recipient = os.getenv("CONTACT_EMAIL", "akshatsahay19@gmail.com")

    if not smtp_user or not smtp_password:
        # Email is optional; fail gracefully if not configured.
        return jsonify({"ok": False, "error": "Email service not configured on server."}), 500

    subject = f"[Portfolio Contact] Message from {name}"
    body = (
        f"Name: {name}\n"
        f"Email: {email}\n\n"
        f"Message:\n{message}\n"
    )
    msg = f"From: {smtp_user}\r\nTo: {recipient}\r\nSubject: {subject}\r\n\r\n{body}"

    try:
        with SMTP(smtp_server, smtp_port, timeout=20) as smtp:
            smtp.starttls()
            smtp.login(smtp_user, smtp_password)
            smtp.sendmail(smtp_user, [recipient], msg.encode("utf-8"))
    except SMTPException as exc:
        return jsonify({"ok": False, "error": str(exc)}), 500

    return jsonify({"ok": True})


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

