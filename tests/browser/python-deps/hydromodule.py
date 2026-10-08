def hydro_force(width, depth):
    from samplelib.wave import crest
    return width * depth + crest(1)
