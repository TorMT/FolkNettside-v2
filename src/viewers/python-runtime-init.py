"""Viewer-only compatibility layer for local course files and inline figures.

No Python code is executed on import from the site until a human selects Run.
The JavaScript helper only loads bounded, same-origin files in the script folder.
"""
import builtins as _builtins
import io as _io
import os as _os
import sys as _sys
import importlib.abc as _abc
import importlib.machinery as _machinery

_viewer_original_open = _builtins.open
_viewer_original_io_open = _io.open
_viewer_original_import = _builtins.__import__
_viewer_images = []
_viewer_patching = False

def _viewer_file_for(path):
    try:
        value = _os.fspath(path)
        if not isinstance(value, (str, bytes)):
            return None
        value = _os.fsdecode(value)
        if _os.path.isabs(value):
            value = _os.path.relpath(value, "/home/pyodide/workspace")
        return value
    except (TypeError, ValueError):
        return None

def _viewer_open(file, mode="r", *args, **kwargs):
    try:
        return _viewer_original_open(file, mode, *args, **kwargs)
    except FileNotFoundError:
        if any(flag in mode for flag in ("w", "a", "x", "+")):
            raise
        candidate = _viewer_file_for(file)
        if candidate is None or not _viewer_fetch_file(candidate):
            raise
        return _viewer_original_open(file, mode, *args, **kwargs)

# pathlib uses io.open(), while normal scripts use builtins.open().
_builtins.open = _viewer_open
_io.open = _viewer_open

class _ViewerSiblingFinder(_abc.MetaPathFinder):
    def find_spec(self, fullname, path=None, target=None):
        # Built-in and installed modules have already had a chance to resolve:
        # the finder is appended, not prepended.
        stem = fullname.replace(".", "/")
        for candidate in (stem + ".py", stem + "/__init__.py"):
            if _viewer_fetch_file(candidate):
                return _machinery.PathFinder.find_spec(fullname, path)
        return None

_sys.meta_path.append(_ViewerSiblingFinder())

def _viewer_capture(fig):
    import base64
    from matplotlib.backends.backend_agg import FigureCanvasAgg
    if len(_viewer_images) >= 12:
        return
    buffer = _io.BytesIO()
    FigureCanvasAgg(fig).print_png(buffer)
    if buffer.tell() > 4_000_000:
        raise ValueError("Figure preview larger than 4 MB")
    source = "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode("ascii")
    _viewer_images.append(source)
    _viewer_emit_image(source)

def _viewer_patch_pyplot():
    global _viewer_patching
    pyplot = _sys.modules.get("matplotlib.pyplot")
    if pyplot is None or _viewer_patching or not callable(getattr(pyplot, "show", None)) or getattr(pyplot.show, "_folk_viewer_show", False):
        return
    _viewer_patching = True
    try:
        from matplotlib.figure import Figure
        def inline_show(*args, **kwargs):
            for number in list(pyplot.get_fignums()):
                figure = pyplot.figure(number)
                _viewer_capture(figure)
                pyplot.close(figure)

        def inline_figure_show(self, *args, **kwargs):
            _viewer_capture(self)
            pyplot.close(self)

        inline_show._folk_viewer_show = True
        pyplot.show = inline_show
        Figure.show = inline_figure_show
        pyplot._folk_viewer_patched = True
    finally:
        _viewer_patching = False

def _viewer_import(name, globals=None, locals=None, fromlist=(), level=0):
    result = _viewer_original_import(name, globals, locals, fromlist, level)
    if not _viewer_patching and "matplotlib.pyplot" in _sys.modules:
        _viewer_patch_pyplot()
    return result

_builtins.__import__ = _viewer_import

def _viewer_complete_figures():
    if "matplotlib.pyplot" in _sys.modules:
        _viewer_patch_pyplot()
        _sys.modules["matplotlib.pyplot"].show()
    return list(_viewer_images)
