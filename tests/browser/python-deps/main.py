from hydromodule import hydro_force
from samplelib.wave import crest
from pathlib import Path
print('auto_force=' + str(hydro_force(4, 3)))
print('auto_crest=' + str(crest(2)))
print('auto_data=' + Path('measurements.csv').read_text().strip())
