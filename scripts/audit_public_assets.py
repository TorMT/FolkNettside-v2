#!/usr/bin/env python3
"""Fail closed when protected resources are about to enter the public static site.

This is a release guard, NOT authentication. Actual private files must live
outside the static hosting directory and be served by an authenticated origin.
"""
from __future__ import annotations
import json
import re
import sys
from pathlib import Path
from urllib.parse import parse_qsl, urlsplit

ROOT=Path(__file__).resolve().parents[1]
PROTECTED_SEGMENTS={"beskyttet","protected","privat","private","confidential","hemmelig","restricted","secrets"}
SECRET_EXTENSIONS={".pem",".p12",".pfx",".p8",".keystore"}
SECRET_NAMES={".env",".env.local",".env.production","id_rsa","id_ed25519","credentials.json","service-account.json"}
TOKEN_RE=re.compile(r"(?i)(?:^|[^a-zA-Z])(password|passord|api[_-]?key|private[_-]?key|client[_-]?secret)(?:[^a-zA-Z]|$)")

SENSITIVE_QUERY_NAMES={
    "key", "apikey", "accesskey", "token", "accesstoken", "refreshtoken",
    "clientsecret", "secret", "password", "passord", "passwd", "auth",
    "authorization", "signature", "sig", "jwt", "sessiontoken", "code",
}

def external_url_violations(value):
    """Fail closed before a URL with credentials enters a public manifest.

    Only the reason is returned. Never return, print or log the supplied URL:
    its userinfo, query and fragment could contain real access secrets.
    """
    if not isinstance(value,str) or not value or value!=value.strip() or len(value)>8192:
        return ["invalid external URL"]
    if any(ord(char)<32 or ord(char)==127 or char=="\\\\" for char in value):
        return ["invalid external URL"]
    try:
        url=urlsplit(value)
        if (url.scheme!="https" or not url.hostname or not url.netloc
                or "@" in url.netloc or url.username is not None
                or url.password is not None):
            return ["external URL must be credential-free HTTPS"]
        _=url.port  # Reject malformed port values rather than normalizing them.
        parameters=parse_qsl(url.query,keep_blank_values=True,max_num_fields=128)
        # A fragment is not sent to the server, but is still published in the manifest.
        parameters+=parse_qsl(url.fragment,keep_blank_values=True,max_num_fields=128)
        for name,_ in parameters:
            normalized=name.casefold().replace("_","").replace("-","")
            if (normalized in SENSITIVE_QUERY_NAMES
                    or normalized.endswith(("token","secret","password","apikey","accesskey","signature"))):
                return ["external URL contains a credential-like parameter"]
    except (TypeError,ValueError):
        return ["invalid external URL"]
    return []


def resource_violations(path):
    normalized=path.replace("\\","/")
    if normalized.startswith(("http:", "https:")):
        return external_url_violations(path)
    parts=Path(normalized.removeprefix("./")).parts
    checks=[]
    for part in parts:
        words=set(re.split(r"[^a-z0-9]+",part.casefold()))
        if words & PROTECTED_SEGMENTS:
            checks.append("protected path component")
            break
    name=parts[-1].casefold() if parts else ""
    if name in SECRET_NAMES or Path(name).suffix in SECRET_EXTENSIONS:
        checks.append("credential-like file")
    if TOKEN_RE.search(name):
        checks.append("secret-like filename")
    return checks

def validate_manifest(manifest):
    problems=[]
    for semester in manifest.get("semesters",[]):
        for course in semester.get("courses",[]):
            for resource in course.get("resources",[]):
                path=str(resource.get("path") or resource.get("url") or "")
                remote=resource.get("source")=="remote" or bool(resource.get("url"))
                violations=(external_url_violations(path) if remote
                            else resource_violations(path))
                for problem in violations:
                    # A rejected URL can carry a real token: never expose it in CI.
                    display="<external URL redacted>" if remote or path.startswith(("http:","https:")) else path
                    problems.append((display,problem))
    return problems

def validate_sources(paths):
    problems=[]
    for source in paths:
        if source.is_symlink():
            problems.append((str(source),"symbolic link in static source"))
            continue
        if not source.exists():continue
        for path in source.rglob("*"):
            rel=path.relative_to(ROOT).as_posix()
            if path.is_symlink():
                problems.append((rel,"symbolic link in static source"))
                continue
            if not path.is_file():continue
            for violation in resource_violations(rel):
                problems.append((rel,violation))
    return problems

def main():
    path=ROOT/"data"/"content-manifest.json"
    manifest=json.loads(path.read_text(encoding="utf-8"))
    # Every directory copied by build_preview.py is public, not just course files.
    sources=[ROOT/name for name in ("assets","src","config","data","examples")]
    declared=Path(str(manifest.get("source") or "examples/semesters"))
    candidate=(ROOT/declared).resolve()
    if not candidate.is_relative_to(ROOT.resolve()):
        print("Unsafe public-manifest source outside repository root",file=sys.stderr)
        return 1
    if candidate.exists() and candidate not in sources:sources.append(candidate)
    extra=ROOT/"site-content"
    if extra.exists() and extra not in sources:sources.append(extra)
    issues=validate_manifest(manifest)+validate_sources(sources)
    if issues:
        for name,issue in sorted(set(issues)):
            print(f"PUBLIC RESOURCE BLOCKED: {name} ({issue})",file=sys.stderr)
        print("Move protected files OUTSIDE the static site; use authenticated server delivery.",file=sys.stderr)
        return 1
    print("Public static content guard: no protected or credential-like resources detected.")
    return 0

if __name__=="__main__":
    sys.exit(main())
