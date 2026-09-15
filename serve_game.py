"""Local preview server with correct JavaScript MIME types for ES modules."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
import sys


class GameHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript; charset=utf-8",
        ".mjs": "text/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
    }

    # This is a development preview: always fetch the current source files so a
    # browser refresh immediately reflects gameplay changes.
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()


root = Path(__file__).resolve().parent
os.chdir(root)
port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
server = ThreadingHTTPServer(("127.0.0.1", port), GameHandler)
print(f"Serving {root} at http://127.0.0.1:{port}/")
try:
    server.serve_forever()
except KeyboardInterrupt:
    print("\nServer stopped.")
finally:
    server.server_close()
