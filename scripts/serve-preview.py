"""Local-only server for the Expo Router single-page preview."""
import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=18766);args=parser.parse_args()
root=Path(__file__).resolve().parents[1]/'dist/web'
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(root),**kwargs)
 def do_GET(self):
  if urlsplit(self.path).path in ['/', '/today','/explore','/collection','/settings','/learn','/pack','/detail']:
   self.path='/index.html'
  super().do_GET()
ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()
