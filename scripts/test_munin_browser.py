"""Run the actual CAD browser smoke and retain viewport screenshots for review."""
import base64
from pathlib import Path
import sys
import test_hydro_worker_browser as smoke

original_call = smoke.call

def capture_call(method, path, body=None, timeout=30):
    if method == 'POST' and path == '/session':
        result = original_call(method, path, body, timeout)
        width, height = map(int, sys.argv[3].split(','))
        original_call('POST', '/session/' + result['sessionId'] + '/goog/cdp/execute', {
            'cmd': 'Emulation.setDeviceMetricsOverride', 'params': {
                'width': width, 'height': height, 'deviceScaleFactor': 1, 'mobile': width < 900}})
        return result
    if method == 'DELETE' and path.startswith('/session/'):
        try:
            original_call('POST', path + '/execute/sync', {
                'script': "document.querySelector('#cad-geometry-stage')?.scrollIntoView({block:'start'});", 'args': []})
            encoded = original_call('GET', path + '/screenshot')
            folder = Path('/tmp/munin-review')
            folder.mkdir(exist_ok=True)
            (folder / ('munin-' + sys.argv[3].replace(',', '-') + '.png')).write_bytes(base64.b64decode(encoded))
        finally:
            return original_call(method, path, body, timeout)
    return original_call(method, path, body, timeout)

smoke.call = capture_call
if __name__ == '__main__':
    sys.exit(smoke.main(sys.argv[1]))
