#!/usr/bin/env python3
"""Notify search engines (Bing, Yandex, Seznam, Naver…) of all site URLs via IndexNow.

    python3 tools/indexnow.py

Run after pushing changes. Google doesn't use IndexNow — submit the sitemap in Search Console instead.
"""
import json
import re
import urllib.request

KEY = "335723eff3a3e67fe4684a6ab682ead9"
HOST = "mmlaw.ge"

with open(__file__.rsplit("/tools/", 1)[0] + "/sitemap.xml", encoding="utf-8") as f:
    urls = re.findall(r"<loc>([^<]+)</loc>", f.read())

body = json.dumps({"host": HOST, "key": KEY, "keyLocation": f"https://{HOST}/{KEY}.txt", "urlList": urls}).encode()
req = urllib.request.Request("https://api.indexnow.org/indexnow", data=body,
                             headers={"Content-Type": "application/json; charset=utf-8"})
with urllib.request.urlopen(req, timeout=30) as r:
    print(r.status, f"submitted {len(urls)} URLs")
