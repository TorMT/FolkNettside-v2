#!/usr/bin/env python3
"""Metadata-only NTNU public Apache directory crawler for scheduled GitHub Actions.

Never fetch course file contents; only approved public index.json and directory
listing HTML. Unknown/hidden/protected paths and redirects are never followed.
The output is a V2 catalog JSON of *references* to original NTNU files.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from urllib.error import HTTPError
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote, unquote, urljoin, urlsplit
from urllib.request import Request, build_opener, HTTPRedirectHandler

ORIGIN = "https://tormt.folk.ntnu.no"
MAX_HTTP_BYTES, MAX_FILES, MAX_DIRECTORIES = 2_000_000, 25_000, 2_000
PRIVATE = re.compile(
    r"beskyttet|protected|private|privat|restricted|hemmelig|"
    r"secret|credential|passord|password|token|\.env|\.htaccess", re.I
)
KINDS = {
    ".pdf":"PDF",".py":"PY",".ipynb":"IPYNB",".csv":"CSV",".json":"JSON",
    ".txt":"TXT",".md":"MD",".tex":"TEX",".docx":"DOCX",".doc":"DOC",
    ".xlsx":"XLSX",".xls":"XLS",".pptx":"PPTX",".ppt":"PPT",
    ".png":"IMAGE",".jpg":"IMAGE",".jpeg":"IMAGE",".webp":"IMAGE",
    ".gif":"IMAGE",".svg":"IMAGE",".mp4":"VIDEO",".webm":"VIDEO",
    ".mov":"VIDEO",".zip":"ZIP",".stl":"STL",".3mf":"3MF",
    ".glb":"GLB",".obj":"OBJ",".f3z":"F3Z",".f3d":"F3D",
    ".step":"STEP",".stp":"STEP",".iges":"IGES",".igs":"IGES",
    ".z012rs":"Z012RS",".z014rs":"Z014RS",".w10":"W10",
    ".fbm":"FILE"  # DELFTship / other legacy source file: download-only
}
SKIP = {"index.html","index.htm","index.php","index.json","thumbs.db"}


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        raise ValueError("Unexpected NTNU redirect")


class ApacheListing(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.heading, self.in_heading, self.links = [], False, []

    def handle_starttag(self, tag, attrs):
        if tag in ("title","h1"):
            self.in_heading = True
        if tag == "a":
            self.links += [v for k,v in attrs if k == "href" and v is not None]

    def handle_endtag(self, tag):
        if tag in ("title","h1"):
            self.in_heading = False

    def handle_data(self, data):
        if self.in_heading:
            self.heading.append(data)

    def valid(self):
        return bool(re.search(r"Index of /", " ".join(self.heading), re.I))


def safe_piece(s):
    return (isinstance(s,str) and 0 < len(s) <= 210 and
            s not in (".","..") and not s.startswith((".","~$")) and
            not PRIVATE.search(s) and
            not any(c in s for c in "/\\%?#") and
            all(ord(c) >= 32 and ord(c) != 127 for c in s))


def public_path(semester, slug, parts):
    return ("/semestre/" + str(semester) + "/" + quote(slug, safe="!\u0027()*") +
            "/" + "/".join(quote(p, safe="!\u0027()*") for p in parts))


def fetch_public(url):
    parsed = urlsplit(url)
    if (parsed.scheme != "https" or parsed.netloc != "tormt.folk.ntnu.no"
            or parsed.query or parsed.fragment):
        raise ValueError("Unapproved NTNU URL")
    opener = build_opener(NoRedirect)
    request = Request(url, headers={
        "User-Agent":"FolkNet-V2-metadata-crawler/1.0",
        "Accept":"text/html,application/json",
        "Cache-Control":"no-cache"
    })
    with opener.open(request, timeout=20) as response:
        target = urlsplit(response.geturl())
        if (target.scheme != parsed.scheme or target.netloc != parsed.netloc
                or target.path != parsed.path or getattr(response,"status",200) != 200):
            raise ValueError("Unexpected NTNU response")
        payload = response.read(MAX_HTTP_BYTES + 1)
        if len(payload) > MAX_HTTP_BYTES:
            raise ValueError("Public index is too large")
        return payload.decode("utf-8","strict")


def links_in_directory(html, directory):
    listing = ApacheListing()
    listing.feed(html)
    if not listing.valid():
        raise ValueError("Expected Apache directory listing on approved public directory")
    base = urlsplit(directory)
    if not base.path.endswith("/"):
        raise ValueError("Expected trailing slash")
    entries, seen = [], set()
    for href in listing.links:
        if any(c in href for c in "?#") or "%25" in href.lower():
            continue
        url = urlsplit(urljoin(directory,href))
        if (url.scheme != "https" or url.netloc != base.netloc or
                not url.path.startswith(base.path)):
            continue
        remainder = url.path[len(base.path):]
        is_directory = remainder.endswith("/")
        child = remainder[:-1] if is_directory else remainder
        if not child or "/" in child:
            continue
        try:
            name = unquote(child, encoding="utf-8",errors="strict")
        except UnicodeError:
            continue
        if not safe_piece(name) or name.lower() in SKIP or (name,is_directory) in seen:
            continue
        seen.add((name,is_directory))
        entries.append((name,is_directory))
    if len(entries) > 4000:
        raise ValueError("Directory entry limit exceeded")
    return entries


def approved_courses(config):
    approved = config.get("publicCourses") if isinstance(config,dict) else None
    if not isinstance(approved,list) or not approved or len(approved)>500:
        raise ValueError("Explicit public course allowlist required")
    courses, seen = [],set()
    for course in approved:
        if not isinstance(course,dict):
            raise ValueError("Invalid public course entry")
        sid,slug,sections = (course.get("semester"),course.get("slug"),
                             course.get("sections",[]))
        optional = course.get("allowMissingEmptySections", [])
        if (type(sid) is not int or sid<1 or sid>20 or not safe_piece(slug)
                or not isinstance(sections,list) or len(set(sections)) != len(sections)
                or any(s not in ("filer","quiz") for s in sections)
                or not isinstance(optional,list) or len(set(optional)) != len(optional)
                or any(s not in sections for s in optional)
                or (sid,slug) in seen):
            raise ValueError("Unsafe/duplicate course allowlist entry")
        seen.add((sid,slug))
        courses.append((sid,slug,sections))
    return courses


def previous_section_was_empty(previous, sid, slug, section):
    """Only a known empty public section may be temporarily unavailable."""
    if not isinstance(previous,dict) or previous.get("source") != "ntnu-auto-preview":
        return False
    for semester in previous.get("semesters",[]):
        if semester.get("id") != sid:
            continue
        for course in semester.get("courses",[]):
            if course.get("code") == slug:
                return not any(
                    r.get("relativePath","").startswith(section+"/")
                    for r in course.get("resources",[])
                )
    return False


def is_missing_listing(error):
    return (isinstance(error,HTTPError) and error.code in (404,410)) or (
        type(error) is ValueError and str(error) ==
        "Expected Apache directory listing on approved public directory"
    )


def crawl(config, *, fetch=fetch_public, previous=None):
    semesters, indexes = {}, {}
    reviewed_missing = {
        (row["semester"],row["slug"],section)
        for row in config["publicCourses"]
        for section in row.get("allowMissingEmptySections",[])
    }
    count, directories = 0, 0
    for sid,slug,sections in approved_courses(config):
        if sid not in indexes:
            data = json.loads(fetch(ORIGIN+"/semestre/"+str(sid)+"/index.json"))
            if not isinstance(data,dict):
                raise ValueError("Public semester index invalid")
            indexes[sid] = data
        course = indexes[sid].get(slug)
        if (not isinstance(course,dict) or course.get("beskyttet") is not False
                or course.get("dir",slug) != slug):
            raise ValueError("Allowlisted course is no longer explicitly public")
        resources, seen = [],set()
        for section in sections:
            pending = [[section]]
            while pending:
                parts = pending.pop(0)
                directories += 1
                if directories>MAX_DIRECTORIES or len(parts)>12:
                    raise ValueError("Directory budget exceeded")
                directory = ORIGIN+public_path(sid,slug,parts)+"/"
                try:
                    children = links_in_directory(fetch(directory),directory)
                except (HTTPError,ValueError) as error:
                    allow_absent = (
                        len(parts) == 1 and
                        (sid,slug,section) in reviewed_missing and
                        previous_section_was_empty(previous,sid,slug,section) and
                        is_missing_listing(error)
                    )
                    if not allow_absent:
                        # Include only the vetted public directory URL.
                        # Do not log response HTML, authentication headers or
                        # other untrusted server error text.
                        raise ValueError(
                            "Public NTNU listing unavailable at "+directory+
                            " ("+("HTTP "+str(error.code) if isinstance(error,HTTPError)
                                   else type(error).__name__)+")"
                        ) from error
                    print("::warning::Previously empty, reviewed public "+
                          "section unavailable (not indexed): "+directory,
                          file=sys.stderr)
                    continue
                for name,is_directory in children:
                    next_parts = parts+[name]
                    if is_directory:
                        pending.append(next_parts)
                        continue
                    kind=KINDS.get(Path(name).suffix.lower())
                    if kind is None:
                        continue
                    relative="/".join(next_parts)
                    if relative in seen:
                        continue
                    seen.add(relative)
                    count+=1
                    if count>MAX_FILES:
                        raise ValueError("File limit exceeded")
                    path=public_path(sid,slug,next_parts)
                    resources.append({
                        "source":"ntnu","section":section,
                        "folders":next_parts[1:-1],
                        "name":name,
                        "label":Path(name).stem.replace("_"," ").replace("-"," "),
                        "relativePath":relative,"path":path,"url":ORIGIN+path,
                        "kind":("QUIZ" if section=="quiz" and re.fullmatch(
                            r"quiz(?:_[a-z0-9-]+)?\.json",name,re.I) else kind),
                        # Apache size/mtime are display approximations; not
                        # available as reliable machine values. Never guess.
                        "size":0,"modified":0
                    })
        resources.sort(key=lambda r:(r["relativePath"].casefold(),r["relativePath"]))
        semesters.setdefault(sid,[]).append({
            "semester":sid,"code":slug,
            "title":slug.replace("-"," ").replace("_"," "),
            "description":"Originalfiler på NTNU",
            "tags":["NTNU"],
            "sections":sorted({r["section"] for r in resources}),
            "resources":resources
        })
    return {
        "schemaVersion":2,"source":"ntnu-auto-preview",
        "semesters":[{
            "id":sid,"label":"Semester "+str(sid),
            "courses":sorted(courses,key=lambda c:c["code"].casefold())
        } for sid,courses in sorted(semesters.items())]
    }


def catalog_keys(doc):
    return {
        (s["id"],c["code"],r["relativePath"])
        for s in doc["semesters"] for c in s["courses"] for r in c["resources"]
    }


def scan_and_write(config, output, *, fetch=fetch_public, allow_removals=False):
    previous_catalog=None
    if output.exists():
        previous_catalog=json.loads(output.read_text(encoding="utf-8"))
        if previous_catalog.get("source") != "ntnu-auto-preview":
            raise ValueError("Existing catalog has unknown schema")
    doc=crawl(config,fetch=fetch,previous=previous_catalog)
    raw=json.dumps(doc,ensure_ascii=False,sort_keys=True,indent=2)+"\n"
    if len(raw.encode("utf-8")) > 4_000_000:
        raise ValueError("Catalog too large for browser")
    current=catalog_keys(doc)
    if previous_catalog is not None:
        previous=catalog_keys(previous_catalog)
        if previous and not current:
            raise ValueError("Refusing empty replacement")
        if (previous and (len(current)<.90*len(previous)
             or len(previous-current)>max(10,.05*len(previous)))
             and not allow_removals):
            raise ValueError("Unexpected resource loss; preserving last good catalog")
        if output.read_text(encoding="utf-8")==raw:
            return {"changed":False,"resources":len(current)}
    output.parent.mkdir(parents=True,exist_ok=True)
    temp=output.with_name(output.name+".staging")
    temp.write_text(raw,encoding="utf-8")
    temp.replace(output)
    return {"changed":True,"resources":len(current)}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config",type=Path,default=Path("config/ntnu-public-courses.json"))
    parser.add_argument("--output",type=Path,default=Path("data/ntnu-autocatalog.json"))
    parser.add_argument("--allow-removals",action="store_true")
    args=parser.parse_args()
    cfg=json.loads(args.config.read_text(encoding="utf-8"))
    print(json.dumps(scan_and_write(cfg,args.output,allow_removals=args.allow_removals),
                     ensure_ascii=False))


if __name__=="__main__":
    main()
