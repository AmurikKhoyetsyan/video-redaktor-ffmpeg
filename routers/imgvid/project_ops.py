import io, json, os, uuid, zipfile, datetime
from fastapi import HTTPException

# Set by image_video.py after import
IMAGES_DIR = ""
CLIPS_DIR  = ""
AUDIO_DIR  = ""
THUMBS_DIR = ""
PROJECTS_DIR = ""
TEMPLATES_DIR = ""


def _make_project_buf(project: dict) -> io.BytesIO:
    files_to_pack = []
    for slide in project.get("slides", []):
        fn = slide.get("file") or slide.get("image", "")
        if fn:
            for d in (IMAGES_DIR, CLIPS_DIR):
                fp = os.path.join(d, fn)
                if os.path.exists(fp):
                    sub = "clips" if d == CLIPS_DIR else "images"
                    files_to_pack.append((f"media/{sub}/{fn}", fp))
                    break
        thumb_url = slide.get("thumbUrl", "")
        if thumb_url:
            tname = thumb_url.split("/")[-1]
            tp = os.path.join(THUMBS_DIR, tname)
            if os.path.exists(tp):
                files_to_pack.append((f"media/thumbs/{tname}", tp))
    for track in project.get("audio", []):
        fn = track.get("file", "")
        if fn:
            fp = os.path.join(AUDIO_DIR, fn)
            if os.path.exists(fp):
                files_to_pack.append((f"media/audio/{fn}", fp))
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("project.json", json.dumps(project, ensure_ascii=False, indent=2))
        for arc_name, file_path in files_to_pack:
            zf.write(file_path, arc_name)
    buf.seek(0)
    return buf


def _extract_project_zip(zf: zipfile.ZipFile) -> dict:
    names = zf.namelist()
    if "project.json" not in names:
        raise HTTPException(400, "Неверный .project: project.json не найден")
    project = json.loads(zf.read("project.json").decode("utf-8"))
    for arc_name in names:
        if arc_name == "project.json":
            continue
        fname = os.path.basename(arc_name)
        if not fname:
            continue
        data = zf.read(arc_name)
        if arc_name.startswith("media/images/"):
            file_dest = os.path.join(IMAGES_DIR, fname)
        elif arc_name.startswith("media/clips/"):
            file_dest = os.path.join(CLIPS_DIR, fname)
        elif arc_name.startswith("media/audio/"):
            file_dest = os.path.join(AUDIO_DIR, fname)
        elif arc_name.startswith("media/thumbs/"):
            file_dest = os.path.join(THUMBS_DIR, fname)
        else:
            continue
        with open(file_dest, 'wb') as fh:
            fh.write(data)
    return project


def _finalize_project(project: dict) -> dict:
    pid = project.get("id") or uuid.uuid4().hex
    project["id"] = pid
    project["updated_at"] = datetime.datetime.now().isoformat()
    ppath = os.path.join(PROJECTS_DIR, f"{pid}.json")
    with open(ppath, "w", encoding="utf-8") as fh:
        json.dump(project, fh, ensure_ascii=False, indent=2)
    return project


def _finalize_template(project: dict) -> dict:
    tid = project.get("id") or uuid.uuid4().hex
    project["id"] = tid
    project["is_template"] = True
    project["updated_at"] = datetime.datetime.now().isoformat()
    tpath = os.path.join(TEMPLATES_DIR, f"{tid}.json")
    with open(tpath, "w", encoding="utf-8") as fh:
        json.dump(project, fh, ensure_ascii=False, indent=2)
    return project


def _collect_media_filenames(project: dict) -> set:
    """Return the set of all media filenames referenced by a project/template dict."""
    names = set()
    for slide in project.get("slides", []):
        fn = slide.get("file") or slide.get("image", "")
        if fn:
            names.add(fn)
        thumb = slide.get("thumbUrl", "")
        if thumb:
            names.add(thumb.split("/")[-1])
    for track in project.get("audio", []):
        fn = track.get("file", "")
        if fn:
            names.add(fn)
    for pip in project.get("pip", []):
        fn = pip.get("file", "")
        if fn:
            names.add(fn)
    return names


def delete_orphaned_media(deleted_project: dict) -> None:
    """Delete media files that are no longer referenced by any project or template."""
    to_delete = _collect_media_filenames(deleted_project)
    if not to_delete:
        return
    in_use: set = set()
    for folder in [PROJECTS_DIR, TEMPLATES_DIR]:
        if not os.path.isdir(folder):
            continue
        for fname in os.listdir(folder):
            if not fname.endswith(".json"):
                continue
            try:
                with open(os.path.join(folder, fname), encoding="utf-8") as f:
                    in_use |= _collect_media_filenames(json.load(f))
            except Exception:
                pass
    for name in to_delete - in_use:
        for media_dir in [IMAGES_DIR, CLIPS_DIR, AUDIO_DIR, THUMBS_DIR]:
            if not media_dir:
                continue
            path = os.path.join(media_dir, name)
            if os.path.exists(path):
                os.remove(path)
                break
