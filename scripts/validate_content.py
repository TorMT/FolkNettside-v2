#!/usr/bin/env python3
"""Validate v2 static content/config before deploy."""

from __future__ import annotations
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

def load(path):
    with path.open("r",encoding="utf-8") as f:
        return json.load(f)

def require(condition,message,errors):
    if not condition: errors.append(message)

def main():
    errors=[]

    site_path=ROOT/"config/site.json"
    manifest_path=ROOT/"data/content-manifest.json"
    projects_path=ROOT/"data/projects.json"

    for path in (site_path,manifest_path,projects_path):
        require(path.exists(),f"missing required file: {path.relative_to(ROOT)}",errors)

    if errors:
        for e in errors: print("ERROR:",e)
        return 1

    site=load(site_path)
    manifest=load(manifest_path)
    projects=load(projects_path)

    require(isinstance(site,dict),"config/site.json must be an object",errors)
    require(isinstance(manifest,dict),"data/content-manifest.json must be an object",errors)
    require(isinstance(projects,list),"data/projects.json must be an array",errors)

    slugs=set()
    for i,project in enumerate(projects):
        p=f"projects[{i}]"
        require(isinstance(project,dict),f"{p} must be an object",errors)
        if not isinstance(project,dict): continue
        for key in ("slug","title","type","summary","problem","solution","skills"):
            require(key in project,f"{p} missing {key}",errors)
        slug=str(project.get("slug",""))
        require(bool(slug),f"{p} has empty slug",errors)
        require(slug not in slugs,f"duplicate project slug: {slug}",errors)
        slugs.add(slug)
        require(project.get("type") in {"physical","design","analysis","software"},
                f"{p} invalid type: {project.get('type')}",errors)
        for rel in project.get("files",[]) or []:
            if isinstance(rel,str):
                require((ROOT/rel).exists(),f"{p} missing file: {rel}",errors)

    seen_courses=set()
    seen_paths=set()
    for semester in manifest.get("semesters",[]) or []:
        sid=semester.get("id")
        for course in semester.get("courses",[]) or []:
            code=str(course.get("code",""))
            key=(sid,code)
            require(key not in seen_courses,f"duplicate course: semester {sid} / {code}",errors)
            seen_courses.add(key)
            for resource in course.get("resources",[]) or []:
                path=str(resource.get("path",""))
                source=str(resource.get("source") or "site")
                clean=path[2:] if path.startswith("./") else path
                require(bool(clean),f"{sid}/{code} resource missing path",errors)
                if source=="site" and clean:
                    require((ROOT/clean).exists(),f"{sid}/{code} missing resource file: {clean}",errors)
                elif source=="remote":
                    require(path.startswith("https://"),f"{sid}/{code} remote resource must use https: {path}",errors)
                    require(bool(resource.get("provider")),f"{sid}/{code} remote resource missing provider: {path}",errors)
                else:
                    require(source in {"site","remote"},f"{sid}/{code} unsupported resource source: {source}",errors)
                rkey=(sid,code,resource.get("id") or path)
                require(rkey not in seen_paths,f"duplicate resource path in {sid}/{code}: {path}",errors)
                seen_paths.add(rkey)
                folders=resource.get("folders",[])
                require(isinstance(folders,list),f"{sid}/{code} folders must be a list: {path}",errors)

    model_path=ROOT/"data/demo-model.json"
    if model_path.exists():
        model=load(model_path)
        source=model.get("sourcePath")
        if source:
            clean=source[2:] if str(source).startswith("./") else str(source)
            require((ROOT/clean).exists(),f"demo-model sourcePath missing: {clean}",errors)
        ids=set()
        for c in model.get("components",[]) or []:
            cid=c.get("id")
            require(cid not in ids,f"duplicate configured component id: {cid}",errors)
            ids.add(cid)

    if errors:
        for error in errors: print("ERROR:",error)
        print(f"Validation failed with {len(errors)} error(s).")
        return 1

    print(f"Validation OK: {len(seen_courses)} course(s), {len(seen_paths)} resource(s), {len(projects)} project(s).")
    return 0

if __name__=="__main__":
    raise SystemExit(main())
