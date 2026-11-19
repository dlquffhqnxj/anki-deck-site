"""Validate the static library before GitHub Pages publishes it."""

import json
import re
from pathlib import Path
from urllib.parse import quote, unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
PROJECT = 'https://github.com/dlquffhqnxj/anki-deck-project/releases'
IDENTIFIER = re.compile(r'[A-Za-z0-9._-]+')
HEXDIGEST = re.compile(r'[0-9a-f]{64}')
TOPICS = {'kanji', 'language', 'practice', 'work', 'summary', 'production'}


def check():
    raw = (ROOT / 'data/library.json').read_text(encoding='utf-8')
    index = json.loads(raw)
    expected_js = f'window.ANKI_LIBRARY = {raw.rstrip()};\n'
    errors = []
    if (ROOT / 'assets/library-data.js').read_text(encoding='utf-8') != expected_js:
        errors.append('assets/library-data.js differs from data/library.json')
    for filename in ('index.html', 'deck.html', 'preview.html', 'releases.html', 'trial.html'):
        if not (ROOT / filename).is_file():
            errors.append(f'Missing entry point {filename}')

    releases = set()
    ids = set()
    for deck in index['decks']:
        name = deck['id']
        prefix = f'{name}: '
        url = deck['release_url']
        tag = unquote(url.rsplit('/', 1)[-1])
        if not IDENTIFIER.fullmatch(name) or name in ids:
            errors.append(prefix + 'invalid or duplicate catalog ID')
        if not IDENTIFIER.fullmatch(tag) or url != f'{PROJECT}/tag/{quote(tag)}' or tag in releases:
            errors.append(prefix + 'invalid or duplicate release URL')
        ids.add(name)
        releases.add(tag)
        assets = {a['name']: a for a in deck['assets']}
        if len(assets) != len(deck['assets']):
            errors.append(prefix + 'duplicate asset name')
        for asset in assets.values():
            expected_path = f'{urlsplit(PROJECT).path}/download/{tag}/{asset["name"]}'
            public = urlsplit(asset['url'])
            if (public.scheme, public.netloc, unquote(public.path), public.query, public.fragment) != ('https','github.com',expected_path,'',''):
                errors.append(prefix + f'invalid URL for {asset["name"]}')
            if not isinstance(asset['size'], int) or asset['size'] <= 0:
                errors.append(prefix + f'invalid size for {asset["name"]}')
            if asset.get('sha256') and not HEXDIGEST.fullmatch(asset['sha256']):
                errors.append(prefix + f'invalid SHA-256 for {asset["name"]}')

        shots = deck['shots']
        if len(shots) != 2 or shots[0]['path'] == shots[1]['path']:
            errors.append(prefix + 'expected two different preview images')
        for shot in shots:
            path = shot['path']
            if not re.fullmatch(r'assets/release-screenshots/[a-zA-Z0-9._-]+\.(png|jpg|jpeg|webp)',path) or not (ROOT / path).is_file() or not shot['caption'].strip():
                errors.append(prefix + f'invalid or missing screenshot {path}')
        preview = deck.get('preview')
        if preview and (not re.fullmatch(r'previews/(?:[a-zA-Z0-9._-]+/)+index\.html',preview) or not (ROOT / preview).is_file()):
            errors.append(prefix + f'missing HTML preview {preview}')
        asset_name = deck.get('preview_asset')
        if asset_name and (asset_name not in assets or not asset_name.lower().endswith('.html') or assets[asset_name]['blocked']):
            errors.append(prefix + 'invalid offline preview asset')
        if not (preview or deck.get('sample') or asset_name):
            errors.append(prefix + 'missing interactive or offline HTML preview')

        pack = deck.get('package_counts')
        if pack and (set(pack) != {'study','practice'} or not all(isinstance(n, int) and n > 0 for n in pack.values()) or sum(pack.values()) != deck['counts']['cards']):
            errors.append(prefix + 'learning and practice totals do not add up')
        if deck['current'] and not deck.get('tracks'):
            errors.append(prefix + 'missing study classification')
        for topic, levels in deck.get('tracks', {}).items():
            if topic not in TOPICS or not isinstance(levels, list) or not set(levels) <= {'N1','N2','N3','N4','N5'}:
                errors.append(prefix + f'invalid filter track {topic}')

        install = deck.get('install')
        if install:
            package = assets.get(install['asset'])
            path_ids = [item['id'] for item in install['paths']]
            if not package or package['blocked'] or not package['name'].endswith('.apkg'):
                errors.append(prefix + 'install APKG missing or unavailable')
            if path_ids.count('fresh') != 1 or len(path_ids) != len(set(path_ids)):
                errors.append(prefix + 'invalid install paths')

        trial = deck.get('trial')
        if trial:
            if len(trial) != 3 or len({q['id'] for q in trial}) != 3:
                errors.append(prefix + 'trial must have three distinct questions')
            for question in trial:
                if 'options' in question and question['options'].count(question['answer']) != 1:
                    errors.append(prefix + f'question {question["id"]} has no unique answer')

    return errors, len(releases)


if __name__ == '__main__':
    errors, count = check()
    if errors:
        raise SystemExit('\n'.join(errors))
    print(f'Checked {count} releases, screenshot pairs, HTML, assets and installation paths.')
